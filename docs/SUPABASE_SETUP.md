# Supabase setup (one time)

The site (GitHub Pages) talks directly to Supabase. Supabase handles logins, MFA, and the database. The database enforces who can see and change what. The website only displays it.

Project: `https://bjnxtotmzdzmhqdfoyuh.supabase.co` (configured in `js/config.js`)

## 1. Create the tables and security rules

1. Dashboard → **SQL Editor** → **New query**
2. Paste the whole of [`supabase/migrations/001_users_roles.sql`](../supabase/migrations/001_users_roles.sql) → **Run**
3. You should see "Success. No rows returned". Re-running it is safe.

## 2. Deploy the admin Edge Function

Creating users, resetting passwords/MFA, and disabling logins need the secret key, so they run on Supabase, not in the browser.

1. Dashboard → **Edge Functions** → **Deploy a new function** → **Via Editor**
2. Name it exactly: `admin-users`
3. Replace the sample code with [`supabase/functions/admin-users/index.ts`](../supabase/functions/admin-users/index.ts) → **Deploy**
4. Leave **Verify JWT** on (default).

The function reads the secret key from Supabase's own environment. You don't set or paste any key.

## 3. Auth settings

**Authentication → Sign In / Providers**
- Email: **enabled**
- **Allow new users to sign up: OFF** (only admins create accounts)

**Authentication → URL Configuration**
- Site URL: `https://dextr2232.github.io/SullyDevWorks1/`

**Authentication → Multi-Factor**: TOTP (authenticator app) **enabled**. It's on by default.

## 4. Create the first admin

1. **Authentication → Users → Add user → Create new user**: your email and a strong password, tick **Auto Confirm User**.
2. **SQL Editor**: open [`supabase/bootstrap_first_admin.sql`](../supabase/bootstrap_first_admin.sql), replace the email and name, and **Run**.
3. Open the site and sign in. You'll be asked to scan a QR code with Microsoft or Google Authenticator. That's MFA set up.

Create everyone else from the app's **Users** page, not the dashboard. Each new user gets a one-time temporary password. At first sign-in they set up MFA and then choose their own password.

## Testing changes on `dev` before they go live

GitHub Pages serves `main` only. To try `dev`, open `index.html` from your local clone (GitHub Desktop → **Show in Finder** → double-click `index.html`). It talks to the same Supabase project.

## Never commit

- The **secret / service_role key** or the **database password**
- Real alerts, hostnames, usernames, IPs or indicators from any employer
