/* Supabase connection.
   Both values are PUBLIC by design: data is protected by row-level security
   in the database, not by hiding this key. Never put the secret /
   service_role key in this file or anywhere in the repo. */
const SUPABASE_URL = 'https://bjnxtotmzdzmhqdfoyuh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_udL6aL7xAA39PvrYYby42Q_n5U7H8PW';

/* App roles → display labels. Must match the CHECK constraint in
   supabase/migrations/001_users_roles.sql */
const ROLE_LABELS = {analyst:'SOC Analyst', team_lead:'Team Leader', admin:'Administrator'};

/* ---------------------------------------------------------------------
   DEMO MODE — public showcase only. OFF for every other deployment.
   It turns on only when the site is served from one of DEMO_SITES (the repo's
   GitHub Pages, published from the `demo` branch). A customer's own server never matches, so it never
   shows the demo login, demo page or role switcher.
   For local testing you can open index.html?demo-mode from file:// or localhost.
   Production installs must also skip migration 002 and the demo-otp function
   (see docs/SUPABASE_SETUP.md); the database then refuses all demo features.
--------------------------------------------------------------------- */
const DEMO_SITES = [
  {host:'dextr2232.github.io', path:'/SullyDevWorks1'}
];
const DEMO_MODE = (function(){
  try{
    if(DEMO_SITES.some(s => location.hostname === s.host && location.pathname.startsWith(s.path))) return true;
    const local = location.protocol === 'file:' || ['localhost','127.0.0.1'].includes(location.hostname);
    return local && new URLSearchParams(location.search).has('demo-mode');
  }catch(_){ return false; }
})();

/* Demo account (sandboxed in the database: it never sees or changes real
   users, even when switched to Admin). Demo presentations last 30 minutes. */
const DEMO_EMAIL = 'demo@example.com';
const DEMO_OTP_URL = SUPABASE_URL + '/functions/v1/demo-otp';
const DEMO_SESSION_MINUTES = 30;
