-- =====================================================================
-- Unified SOAR — 001: users, roles, MFA enforcement, audit log
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: objects are created with IF NOT EXISTS / OR REPLACE.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PROFILES: one row per login (auth.users), holds the app role
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null,
  full_name             text not null default '',
  role                  text not null default 'analyst'
                        check (role in ('analyst','team_lead','admin')),
  is_active             boolean not null default true,
  must_change_password  boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- AUDIT LOG: append-only. Clients can read (leads/admins), never write.
-- ---------------------------------------------------------------------
create table if not exists public.audit_log (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  actor_id     uuid,
  actor_email  text,
  action       text not null,
  target_type  text,
  target_id    text,
  old_value    jsonb,
  new_value    jsonb
);
create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------
-- HELPERS (used by row-level security policies)
-- ---------------------------------------------------------------------

-- True only when the caller's session passed MFA (TOTP) — JWT claim aal = aal2.
create or replace function public.has_mfa()
returns boolean language sql stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

-- Caller's role, or NULL if they have no profile or are disabled.
create or replace function public.my_role()
returns text language sql stable security definer
set search_path = ''
as $$
  select p.role from public.profiles p
  where p.id = auth.uid() and p.is_active;
$$;

create or replace function public.is_admin()
returns boolean language sql stable
set search_path = ''
as $$
  select public.has_mfa() and coalesce(public.my_role() = 'admin', false);
$$;

create or replace function public.is_lead_or_admin()
returns boolean language sql stable
set search_path = ''
as $$
  select public.has_mfa() and coalesce(public.my_role() in ('team_lead','admin'), false);
$$;

-- Called by the app after a user sets their own password on first login.
create or replace function public.mark_password_changed()
returns void language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.has_mfa() then
    raise exception 'MFA-verified session required';
  end if;
  update public.profiles set must_change_password = false where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------

-- New login (created by the admin Edge Function or the dashboard) → profile.
-- Role always starts as 'analyst'; it is never taken from user metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guard rails on profile changes.
create or replace function public.profiles_guard()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  new.updated_at := now();

  -- Email and id are owned by Supabase Auth, not editable here.
  if new.email is distinct from old.email or new.id is distinct from old.id then
    if auth.uid() is not null then
      raise exception 'Email cannot be changed from the app';
    end if;
  end if;

  -- An admin cannot change their own role or disable themselves.
  if auth.uid() is not null and new.id = auth.uid()
     and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    raise exception 'You cannot change your own role or status';
  end if;

  -- Never remove the last active admin.
  if old.role = 'admin' and old.is_active
     and (new.role <> 'admin' or not new.is_active)
     and not exists (
       select 1 from public.profiles p
       where p.role = 'admin' and p.is_active and p.id <> old.id
     ) then
    raise exception 'At least one active admin is required';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- Audit every profile change made from the app or the SQL editor.
-- (The admin Edge Function writes its own, more specific audit rows.)
create or replace function public.profiles_audit()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_email text;
  v_old jsonb := '{}'::jsonb;
  v_new jsonb := '{}'::jsonb;
begin
  -- The Edge Function (service role) logs its own actions with the real admin as actor.
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  select email into v_actor_email from public.profiles where id = v_actor;

  if tg_op = 'INSERT' then
    insert into public.audit_log (actor_id, actor_email, action, target_type, target_id, new_value)
    values (v_actor, coalesce(v_actor_email, 'system'), 'user.created', 'user', new.id::text,
            jsonb_build_object('email', new.email, 'role', new.role));
    return new;
  end if;

  if new.role is distinct from old.role then
    v_old := v_old || jsonb_build_object('role', old.role);
    v_new := v_new || jsonb_build_object('role', new.role);
  end if;
  if new.is_active is distinct from old.is_active then
    v_old := v_old || jsonb_build_object('is_active', old.is_active);
    v_new := v_new || jsonb_build_object('is_active', new.is_active);
  end if;
  if new.full_name is distinct from old.full_name then
    v_old := v_old || jsonb_build_object('full_name', old.full_name);
    v_new := v_new || jsonb_build_object('full_name', new.full_name);
  end if;
  if new.must_change_password is distinct from old.must_change_password then
    v_old := v_old || jsonb_build_object('must_change_password', old.must_change_password);
    v_new := v_new || jsonb_build_object('must_change_password', new.must_change_password);
  end if;

  if v_new <> '{}'::jsonb then
    insert into public.audit_log (actor_id, actor_email, action, target_type, target_id, old_value, new_value)
    values (v_actor, coalesce(v_actor_email, 'system'), 'user.updated', 'user', new.id::text, v_old, v_new);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_audit on public.profiles;
create trigger profiles_audit
  after insert or update on public.profiles
  for each row execute function public.profiles_audit();

-- ---------------------------------------------------------------------
-- PERMISSIONS
-- Start from nothing, then grant exactly what the app needs.
-- ---------------------------------------------------------------------
revoke all on public.profiles  from anon, authenticated;
revoke all on public.audit_log from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, role, is_active) on public.profiles to authenticated;
grant select on public.audit_log to authenticated;

revoke all on function public.mark_password_changed() from public, anon;
grant execute on function public.mark_password_changed() to authenticated;

-- ---------------------------------------------------------------------
-- ROW-LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.audit_log enable row level security;

-- Everyone can read their own row (needed during login, before MFA).
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Active, MFA-verified users can see the team (for assignment lists).
drop policy if exists profiles_select_team on public.profiles;
create policy profiles_select_team on public.profiles
  for select to authenticated
  using (public.my_role() is not null and public.has_mfa());

-- Only MFA-verified admins can change role / status / name.
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Audit log: team leads and admins can read. Nobody can write from the app.
drop policy if exists audit_select_leads on public.audit_log;
create policy audit_select_leads on public.audit_log
  for select to authenticated
  using (public.is_lead_or_admin());
