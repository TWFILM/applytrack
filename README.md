# Applytrack

Track every job application in one place, know exactly what to do next, and never forget to follow up.

> Work in progress — see [SPEC.md](SPEC.md) for the product and technical spec.

## Run locally

Requires Node.js 24+ and Docker.

```bash
npm install
cp .env.example .env.local   # then set BETTER_AUTH_SECRET (command is in the file)
docker compose up -d         # PostgreSQL on localhost:5433
npm run db:migrate           # apply migrations
npm run dev
```

Open http://localhost:3000 and create an account with email and password.
Google sign-in is optional — see [docs/google-oauth.md](docs/google-oauth.md).
Deploying: [docs/deploy.md](docs/deploy.md).

## Scripts

| Command                           | What it does                                       |
| --------------------------------- | -------------------------------------------------- |
| `npm run dev`                     | Start the dev server                               |
| `npm run build`                   | Production build                                   |
| `npm run lint`                    | ESLint                                             |
| `npm run format` / `format:check` | Prettier write / check                             |
| `npm run typecheck`               | Generate Next.js route types, then `tsc --noEmit`  |
| `npm test`                        | Vitest unit tests                                  |
| `npm run db:generate`             | Create a SQL migration from `src/server/db/schema` |
| `npm run db:migrate`              | Apply pending migrations                           |
| `npm run db:studio`               | Browse the database in Drizzle Studio              |
