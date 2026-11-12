-- =====================================================================
-- Unified SOAR — 003: fix demo reset on Supabase
-- Supabase loads pg-safeupdate for API calls, which rejects any DELETE or
-- UPDATE without a WHERE clause — including inside functions. demo_reset()
-- did `delete from public.demo_users;`, so every demo sign-in failed with
-- "DELETE requires a WHERE clause". Only needed where 002 was already run
-- (002 itself is now fixed for fresh installs). Safe to re-run.
-- =====================================================================
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
  -- "where true": Supabase's pg-safeupdate rejects DELETE/UPDATE without a WHERE clause.
  delete from public.demo_users where true;
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

revoke all on function public.demo_reset() from public, anon;
grant execute on function public.demo_reset() to authenticated;
