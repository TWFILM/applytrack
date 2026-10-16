# Deploying to Vercel + Neon

Checklist for the first production deploy (SPEC §10, Milestone 1). Steps marked **you** need
your accounts; nothing here is automated yet.

## 1. Create the Neon database (you)

1. Sign up at <https://neon.tech> and create a project (region: **AWS Asia Pacific (Singapore)** is closest to Thailand).
2. Postgres version: 17 (matches `docker-compose.yml`).
3. From **Connect**, copy two connection strings for the `main` branch:
   - **Pooled** (host contains `-pooler`) → the app uses this as `DATABASE_URL` on Vercel.
   - **Direct** (no `-pooler`) → use this only for running migrations.

   Both should end in `?sslmode=require`.

## 2. Run migrations against Neon (you, from your machine)

Migrations are applied manually for now, using the **direct** URL (no `.env.local` change needed):

```bash
DATABASE_URL="postgresql://...direct-url...?sslmode=require" npm run db:migrate
```

PowerShell:

```powershell
$env:DATABASE_URL="postgresql://...direct-url...?sslmode=require"; npm run db:migrate
```

Re-run this whenever a merged PR adds a file in `src/server/db/migrations/`, **before** that
code is deployed.

## 3. Import the repo into Vercel (you)

1. <https://vercel.com/new> → import `TWFILM/applytrack`.
2. Framework preset: Next.js (auto-detected). Leave build/install commands as default.
3. Node.js version: Vercel reads `engines.node` from `package.json` (`>=24`).

## 4. Environment variables (you)

In **Project → Settings → Environment Variables**:

| Variable               | Production | Preview | Value                                                                                                                                    |
| ---------------------- | ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | ✓          | ✓       | Neon **pooled** URL                                                                                                                      |
| `BETTER_AUTH_SECRET`   | ✓          | ✓       | A new random value — don't reuse your local one. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `BETTER_AUTH_URL`      | ✓          | —       | `https://<your-app>.vercel.app`                                                                                                          |
| `GOOGLE_CLIENT_ID`     | ✓          | —       | From Google Cloud (optional, see [google-oauth.md](google-oauth.md))                                                                     |
| `GOOGLE_CLIENT_SECRET` | ✓          | —       | From Google Cloud (optional)                                                                                                             |

> **Preview deployments:** each one has its own URL, so leave `BETTER_AUTH_URL` unset for
> Preview. The app then falls back to `https://$VERCEL_URL` (set by Vercel), so email/password
> sign-in works on every preview. Google sign-in won't (see [google-oauth.md](google-oauth.md)).
>
> Previews share the production database in this setup. Fine while you're the only user;
> revisit with Neon branching before inviting anyone else.

## 5. Deploy and check (you)

1. Click **Deploy** (or push to `main`).
2. Open `https://<your-app>.vercel.app`:
   - [ ] Landing page loads, **Sign in** goes to `/login`
   - [ ] Create an account → lands on `/today` with your name
   - [ ] Sign out → back to `/login`; `/today` redirects to `/login`
   - [ ] Sign in again with the same password
   - [ ] (If configured) **Continue with Google** works
3. In Neon's **Tables** view, confirm a row in `users` and `accounts`.

## 6. Add the production URL to Google (you, if using Google)

Add `https://<your-app>.vercel.app` and `.../api/auth/callback/google` to the OAuth client
(see [google-oauth.md](google-oauth.md) step 3).

## Later (not Milestone 1)

- Run migrations automatically (GitHub Action on merge to `main`) instead of by hand.
- Neon branch per preview deployment.
- Auth rate limiting backed by the database (TODO in `src/auth.ts`, Polish milestone).
