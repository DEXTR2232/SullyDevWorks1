/* Supabase connection.
   Both values are PUBLIC by design: data is protected by row-level security
   in the database, not by hiding this key. Never put the secret /
   service_role key in this file or anywhere in the repo. */
const SUPABASE_URL = 'https://bjnxtotmzdzmhqdfoyuh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_udL6aL7xAA39PvrYYby42Q_n5U7H8PW';

/* App roles → display labels. Must match the CHECK constraint in
   supabase/migrations/001_users_roles.sql */
const ROLE_LABELS = {analyst:'SOC Analyst', team_lead:'Team Leader', admin:'Administrator'};
