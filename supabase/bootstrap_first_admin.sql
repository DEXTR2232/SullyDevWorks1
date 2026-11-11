-- =====================================================================
-- Unified SOAR — make the FIRST admin (run once, after 001_users_roles.sql)
--
-- 1. Dashboard → Authentication → Users → Add user → Create new user
--    (enter email + a strong password, tick "Auto Confirm User").
-- 2. Replace the email and name below, then run this in the SQL Editor.
-- 3. Log in on the site — you'll be asked to set up MFA on first login.
--
-- After this, create every other user from the app's Users page.
-- =====================================================================
update public.profiles
set role = 'admin',
    full_name = 'Your Name',
    must_change_password = false
where email = 'you@example.com';

-- Check it worked (should show one row with role = admin):
select email, full_name, role, is_active from public.profiles where role = 'admin';
