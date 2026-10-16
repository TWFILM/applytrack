# CLAUDE.md

This is **Applytrack**, a job application tracker. The full product and technical spec is in `SPEC.md` — read it before starting any task.

## How we work

- Work one milestone (SPEC.md §10) at a time, and one feature at a time within it. Do not build ahead.
- Before writing code for a feature, propose a short plan (files to touch, data changes, open questions) and wait for approval.
- Explain non-obvious decisions in the PR description or a short note, so the owner can understand and defend them in an interview.
- Keep changes small and reviewable. One feature = one branch = one PR.
- Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`).

## Code rules

- TypeScript strict. No `any` without a comment explaining why.
- All database access goes through `src/server/queries` and `src/server/actions`. Every query must be scoped to the signed-in user's `userId`.
- Validate all input on the server with Zod. Share schemas from `src/lib/schemas`.
- Use shadcn/ui components before writing custom ones.
- Every status change must create a `StatusEvent` row.
- Dates are stored in UTC; display in the user's timezone.
- Never commit secrets. Add new env vars to `.env.example`.

## Commands

- `docker compose up -d` — start local PostgreSQL
- `npm run dev` — start dev server
- `npm run lint` / `npm run format:check` / `npm run typecheck` / `npm test` / `npm run build` — must pass before a PR
- `npm run format` — apply Prettier
- `npm run db:generate` / `npm run db:migrate` — Drizzle migrations

## Stack notes

- Next.js 16 with `cacheComponents` enabled (scaffold default). Bundled docs live in `node_modules/next/dist/docs/` — check them for Next 16 APIs before relying on memory.
- shadcn/ui uses the Radix base; `cn()` comes from the `cn` package (shadcn's replacement for clsx + tailwind-merge).
- Vitest picks up `tests/unit/**/*.test.ts` and `src/**/*.test.ts`.

## Definition of done

See SPEC.md §11.
