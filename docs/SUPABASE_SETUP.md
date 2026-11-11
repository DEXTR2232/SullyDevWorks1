# Supabase setup (one time)

The site (GitHub Pages) talks directly to Supabase. Supabase handles logins, MFA, and the database. The database enforces who can see and change what. The website only displays it.

Project: `https://bjnxtotmzdzmhqdfoyuh.supabase.co` (configured in `js/config.js`)

## 1. Create the tables and security rules

1. Dashboard → **SQL Editor** → **New query**
2. Paste the whole of [`supabase/migrations/001_users_roles.sql`](../supabase/migrations/001_users_roles.sql) → **Run**
3. You should see "Success. No rows returned". Re-running it is safe.
4. Do the same with every later file in `supabase/migrations/`, in number order.

## 2. Deploy the admin Edge Function

Creating users, resetting passwords/MFA, and disabling logins need the secret key, so they run on Supabase, not in the browser.

1. Dashboard → **Edge Functions** → **Deploy a new function** → **Via Editor**
2. Name it exactly: `admin-users`
3. Replace the sample code with [`supabase/functions/admin-users/index.ts`](../supabase/functions/admin-users/index.ts) → **Deploy**
4. Open the function's **Settings** tab and turn **Verify JWT with legacy secret OFF**, then **Save changes**. The function checks every caller itself: it validates the session with Supabase Auth and requires an MFA-verified, active, non-demo admin. Supabase recommends this setting for functions that do their own auth, and with it on, sessions on new-style projects can be rejected before the check runs.

The function reads the secret key from Supabase's own environment. You don't set or paste any key.

## 2b. Demo mode (public demo login): PoC showcase only

> **Production / customer installs: skip this whole section.** Don't run `002_demo_mode.sql` and don't deploy `demo-otp`. Without them, the demo account and demo features can't exist. The website also keeps demo mode off on any site other than the demo Pages site (`DEMO_SITES` in `js/config.js`).

1. **SQL Editor:** paste and run [`supabase/migrations/002_demo_mode.sql`](../supabase/migrations/002_demo_mode.sql).
2. **Edge Functions → Deploy a new function → Via Editor:** name it exactly `demo-otp`, paste [`supabase/functions/demo-otp/index.ts`](../supabase/functions/demo-otp/index.ts), and **Deploy**.
3. In the function's **Settings** tab, turn **Verify JWT with legacy secret OFF** and **Save changes**. This function is meant to be public, and the demo page can't load a code while this is on.
4. **Re-deploy `admin-users`** with the updated file. It now refuses the demo account.
5. Open `demo.html`. The first load creates the demo user (`demo@example.com`) and its MFA automatically. That takes a few seconds; after that, a 6-digit code appears.

You don't need to create the demo user by hand. If a visitor changes the demo password or MFA, the function repairs it within 10 minutes.

## 3. Auth settings

**Authentication → Sign In / Providers**
- Email: **enabled**
- **Allow new users to sign up: OFF** (only admins create accounts)

**Authentication → URL Configuration**
- Site URL: `https://dextr2232.github.io/SullyDevWorks1/`

**Authentication → Multi-Factor**: TOTP (authenticator app) **enabled**. It's on by default.

## 4. Create the first admin(s)

Built-in accounts don't need a real mailbox. Use `username@unified-soar.local` (for example `faisal@unified-soar.local`) and sign in with just `faisal`. The app adds the domain (`LOGIN_DOMAIN` in `js/config.js`).

1. **Authentication → Users → Add user → Create new user**: email plus a temporary password, tick **Auto Confirm User**.
2. **SQL Editor**: open [`supabase/bootstrap_first_admin.sql`](../supabase/bootstrap_first_admin.sql), replace the email and name, and **Run**. Repeat for each founding admin.
3. Open the site and sign in. You'll scan a QR code with Microsoft or Google Authenticator (MFA), then replace the temporary password with your own.

Create everyone else from the app's **Users** page, not the dashboard. Each new user gets a one-time temporary password. At first sign-in they set up MFA and then choose their own password.

## Where the code runs

| Site | Repo / branch | Demo mode |
|---|---|---|
| Public demo | `demo` branch → GitHub Pages (`dextr2232.github.io/SullyDevWorks1`) | **On** |
| Development | `dev` branch, opened locally | Off (add `?demo-mode` to test) |
| Product releases | `main` branch | Off |
| Customer install | its own server and its own Supabase | Off. Skip migration 002 and `demo-otp`. |

All branches have the same code. To update the demo, merge `dev` into `demo` (GitHub Desktop → switch to `demo` → **Branch → Merge into current branch** → `dev` → Push).

**Settings → Pages (repo owner):** Source = **Deploy from a branch**, Branch = **`demo`**, folder `/ (root)`.

## Testing changes on `dev` before they go live

GitHub Pages serves `main` only. To try `dev`, open `index.html` from your local clone (GitHub Desktop → **Show in Finder** → double-click `index.html`). It talks to the same Supabase project. Add `?demo-mode` to the address to test the demo UI locally.

## Never commit

- The **secret / service_role key** or the **database password**
- Real alerts, hostnames, usernames, IPs or indicators from any employer
