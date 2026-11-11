-- =====================================================================
-- Unified SOAR — 002: public DEMO MODE sandbox
-- Run after 001_users_roles.sql (SQL Editor → paste → Run). Safe to re-run.
--
-- The demo login is published in the README with a public MFA code page.
-- Assume anyone on the internet can use it. So the demo account:
--   * can switch its own role (Analyst / Team Leader / Admin) to show RBAC,
--   * can NEVER see or change real users or the real audit log,
--   * as "Admin" manages a separate table of FAKE users (demo_users),
--   * gets its sandbox reset every time someone signs in as the demo.
-- =====================================================================

alter table public.profiles  add column if not exists is_demo boolean not null default false;
alter table public.audit_log add column if not exists is_demo boolean not null default false;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.is_demo_user()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select coalesce((select p.is_demo from public.profiles p where p.id = auth.uid()), false);
$$;

-- The demo account's current role, only inside an MFA-verified demo session.
create or replace function public.demo_role()
returns text language sql stable
set search_path = ''
as $$
  select case when public.is_demo_user() and public.has_mfa() then public.my_role() end;
$$;

-- Real-admin checks now explicitly exclude the demo account.
create or replace function public.is_admin()
returns boolean language sql stable
set search_path = ''
as $$
  select public.has_mfa() and not public.is_demo_user()
         and coalesce(public.my_role() = 'admin', false);
$$;

create or replace function public.is_lead_or_admin()
returns boolean language sql stable
set search_path = ''
as $$
  select public.has_mfa() and not public.is_demo_user()
         and coalesce(public.my_role() in ('team_lead','admin'), false);
$$;

-- ---------------------------------------------------------------------
-- Policies: hide real data from the demo account
-- ---------------------------------------------------------------------
drop policy if exists profiles_select_team on public.profiles;
create policy profiles_select_team on public.profiles
  for select to authenticated
  using (public.my_role() is not null and public.has_mfa() and not public.is_demo_user());

drop policy if exists audit_select_leads on public.audit_log;
create policy audit_select_leads on public.audit_log
  for select to authenticated
  using (public.is_lead_or_admin() and not is_demo);

drop policy if exists audit_select_demo on public.audit_log;
create policy audit_select_demo on public.audit_log
  for select to authenticated
  using (is_demo and coalesce(public.demo_role() in ('team_lead','admin'), false));

-- ---------------------------------------------------------------------
-- Guard + audit triggers, updated for demo
-- ---------------------------------------------------------------------
create or replace function public.profiles_guard()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  new.updated_at := now();

  if new.email is distinct from old.email or new.id is distinct from old.id then
    if auth.uid() is not null then
      raise exception 'Email cannot be changed from the app';
    end if;
  end if;

  -- Users cannot change their own role/status — except the demo account,
  -- whose role switch goes through public.demo_set_role().
  if auth.uid() is not null and new.id = auth.uid() and not old.is_demo
     and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    raise exception 'You cannot change your own role or status';
  end if;

  -- Never remove the last active REAL admin (the demo account doesn't count).
  if old.role = 'admin' and old.is_active and not old.is_demo
     and (new.role <> 'admin' or not new.is_active)
     and not exists (
       select 1 from public.profiles p
       where p.role = 'admin' and p.is_active and not p.is_demo and p.id <> old.id
     ) then
    raise exception 'At least one active admin is required';
  end if;

  return new;
end;
$$;

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
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  select email into v_actor_email from public.profiles where id = v_actor;

  if tg_op = 'INSERT' then
    insert into public.audit_log (actor_id, actor_email, action, target_type, target_id, new_value, is_demo)
    values (v_actor, coalesce(v_actor_email, 'system'), 'user.created', 'user', new.id::text,
            jsonb_build_object('email', new.email, 'role', new.role), new.is_demo);
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
    insert into public.audit_log (actor_id, actor_email, action, target_type, target_id, old_value, new_value, is_demo)
    values (v_actor, coalesce(v_actor_email, 'system'),
            case when new.is_demo and new.id = v_actor then 'demo.role_switched' else 'user.updated' end,
            'user', new.id::text, v_old, v_new, new.is_demo);
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Fake users managed by the demo account when it is "Admin"
-- ---------------------------------------------------------------------
create table if not exists public.demo_users (
  id                    uuid primary key default gen_random_uuid(),
  full_name             text not null,
  email                 text not null,
  role                  text not null default 'analyst' check (role in ('analyst','team_lead','admin')),
  is_active             boolean not null default true,
  must_change_password  boolean not null default true,
  created_at            timestamptz not null default now()
);
revoke all on public.demo_users from anon, authenticated;
grant select on public.demo_users to authenticated;
alter table public.demo_users enable row level security;

drop policy if exists demo_users_select on public.demo_users;
create policy demo_users_select on public.demo_users
  for select to authenticated
  using (public.demo_role() = 'admin');

-- Internal: write a demo audit row (not callable from the app directly).
create or replace function public.demo_audit(p_action text, p_target uuid, p_old jsonb, p_new jsonb)
returns void language sql security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_id, actor_email, action, target_type, target_id, old_value, new_value, is_demo)
  select auth.uid(), p.email, p_action, 'user', p_target::text, p_old, p_new, true
  from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.demo_require_admin()
returns void language plpgsql stable
set search_path = ''
as $$
begin
  if coalesce(public.demo_role(), '') <> 'admin' then
    raise exception 'Switch the demo to the Admin role first';
  end if;
end;
$$;

create or replace function public.demo_temp_password()
returns text language sql volatile
set search_path = ''
as $$
  select 'Demo-' || substr(md5(gen_random_uuid()::text), 1, 10);
$$;

create or replace function public.demo_create_user(p_full_name text, p_email text, p_role text)
returns text language plpgsql security definer
set search_path = ''
as $$
declare v_id uuid; v_pw text := public.demo_temp_password();
begin
  perform public.demo_require_admin();
  if (select count(*) from public.demo_users) >= 40 then
    raise exception 'Demo limit reached (40 users). Sign in again to reset the demo.';
  end if;
  if coalesce(trim(p_full_name), '') = '' then raise exception 'Full name required'; end if;
  if p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'Valid email required'; end if;
  if p_role not in ('analyst','team_lead','admin') then raise exception 'Invalid role'; end if;
  insert into public.demo_users (full_name, email, role)
  values (left(trim(p_full_name), 120), lower(trim(p_email)), p_role)
  returning id into v_id;
  perform public.demo_audit('user.created', v_id, null, jsonb_build_object('email', lower(trim(p_email)), 'role', p_role));
  return v_pw;
end;
$$;

create or replace function public.demo_set_user_role(p_id uuid, p_role text)
returns void language plpgsql security definer
set search_path = ''
as $$
declare v_old text;
begin
  perform public.demo_require_admin();
  if p_role not in ('analyst','team_lead','admin') then raise exception 'Invalid role'; end if;
  select role into v_old from public.demo_users where id = p_id;
  if v_old is null then raise exception 'User not found'; end if;
  update public.demo_users set role = p_role where id = p_id;
  perform public.demo_audit('user.updated', p_id, jsonb_build_object('role', v_old), jsonb_build_object('role', p_role));
end;
$$;

create or replace function public.demo_set_user_active(p_id uuid, p_active boolean)
returns void language plpgsql security definer
set search_path = ''
as $$
begin
  perform public.demo_require_admin();
  update public.demo_users set is_active = p_active where id = p_id;
  if not found then raise exception 'User not found'; end if;
  perform public.demo_audit(case when p_active then 'user.enabled' else 'user.disabled' end, p_id, null, null);
end;
$$;

create or replace function public.demo_reset_user_password(p_id uuid)
returns text language plpgsql security definer
set search_path = ''
as $$
declare v_pw text := public.demo_temp_password();
begin
  perform public.demo_require_admin();
  update public.demo_users set must_change_password = true where id = p_id;
  if not found then raise exception 'User not found'; end if;
  perform public.demo_audit('user.password_reset', p_id, null, null);
  return v_pw;
end;
$$;

create or replace function public.demo_reset_user_mfa(p_id uuid)
returns void language plpgsql security definer
set search_path = ''
as $$
begin
  perform public.demo_require_admin();
  if not exists (select 1 from public.demo_users where id = p_id) then raise exception 'User not found'; end if;
  perform public.demo_audit('user.mfa_reset', p_id, null, null);
end;
$$;

-- Switch the demo account's own role ("View as").
create or replace function public.demo_set_role(p_role text)
returns void language plpgsql security definer
set search_path = ''
as $$
begin
  if not (public.is_demo_user() and public.has_mfa()) then
    raise exception 'Demo account only';
  end if;
  if p_role not in ('analyst','team_lead','admin') then raise exception 'Invalid role'; end if;
  update public.profiles set role = p_role where id = auth.uid() and is_demo;
end;
$$;

-- Fresh sandbox for a new demo sign-in: Analyst role, fake team, empty log.
create or replace function public.demo_reset()
returns void language plpgsql security definer
set search_path = ''
as $$
begin
  if not (public.is_demo_user() and public.has_mfa()) then
    raise exception 'Demo account only';
  end if;
  update public.profiles set role = 'analyst' where id = auth.uid() and is_demo;
  delete from public.audit_log where is_demo;
  delete from public.demo_users;
  insert into public.demo_users (full_name, email, role, must_change_password, created_at) values
    ('Mariam Saleh',   'mariam.saleh@demo.example',   'team_lead', false, now() - interval '41 days'),
    ('Tariq Mansour',  'tariq.mansour@demo.example',  'analyst',   false, now() - interval '33 days'),
    ('Noor Abbas',     'noor.abbas@demo.example',     'analyst',   false, now() - interval '27 days'),
    ('Sami Khoury',    'sami.khoury@demo.example',    'analyst',   false, now() - interval '19 days'),
    ('Hana Farouk',    'hana.farouk@demo.example',    'admin',     false, now() - interval '60 days'),
    ('Zaid Rahman',    'zaid.rahman@demo.example',    'analyst',   true,  now() - interval '2 days'),
    ('Dana Aziz',      'dana.aziz@demo.example',      'analyst',   false, now() - interval '12 days');
  update public.demo_users set is_active = false where email = 'sami.khoury@demo.example';
end;
$$;

-- Function permissions: app users may call the demo RPCs (each checks for
-- the demo account itself); internal helpers are not callable.
revoke all on function public.demo_audit(text, uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.demo_temp_password() from public, anon, authenticated;
do $$
declare f text;
begin
  foreach f in array array[
    'public.demo_create_user(text,text,text)', 'public.demo_set_user_role(uuid,text)',
    'public.demo_set_user_active(uuid,boolean)', 'public.demo_reset_user_password(uuid)',
    'public.demo_reset_user_mfa(uuid)', 'public.demo_set_role(text)', 'public.demo_reset()',
    'public.demo_require_admin()'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Demo MFA state: only the demo-otp Edge Function (service role) can read.
-- ---------------------------------------------------------------------
create table if not exists public.demo_state (
  id           int primary key default 1 check (id = 1),
  user_id      uuid,
  factor_id    text,
  totp_secret  text,
  checked_at   timestamptz
);
revoke all on public.demo_state from anon, authenticated;
alter table public.demo_state enable row level security;
