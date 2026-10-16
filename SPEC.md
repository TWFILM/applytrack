# Job Application Tracker — Product & Technical Spec

> Working name: **Applytrack** (rename freely)
> Owner: Techapat W.
> Status: Draft v1

---

## 1. Overview

### Problem
When job hunting, people apply to dozens of companies across LinkedIn, company sites, JobThai, referrals, and email. Within a couple of weeks it becomes impossible to remember:
- where you already applied, and with which resume
- which applications are waiting on you vs. waiting on them
- when the next interview is, and what you discussed last time
- who you haven't heard back from and should follow up with

Spreadsheets work at first but break down: no reminders, no history, no overview of how the search is going.

### Solution
A web app where a job seeker logs every application, moves it through a clear pipeline, schedules interviews, and gets reminded when to follow up — with a dashboard showing how the search is going overall.

### Target user
A new graduate or early-career developer actively applying to 10–100 positions. Primary user: the author.

### One-line pitch
"Track every job application in one place, know exactly what to do next, and never forget to follow up."

---

## 2. Goals and Non-Goals

### Goals
- Logging a new application takes under 30 seconds
- At a glance, the user sees what needs action today
- Every status change is recorded with a timestamp (full history)
- Works well on both desktop and mobile browsers
- Each user's data is strictly private to them

### Non-Goals (for now)
- Applying to jobs from inside the app
- Scraping job boards or aggregating listings
- Team / recruiter features
- Native mobile apps

---

## 3. Tech Stack

Chosen to broaden the author's stack beyond Go/React while staying practical and widely used in industry.

| Layer | Choice | Notes |
| --- | --- | --- |
| Language | TypeScript (strict mode) | Used across frontend and backend |
| Framework | Next.js (App Router) | Server Components + Server Actions / Route Handlers |
| UI | Tailwind CSS + shadcn/ui | Accessible components, consistent design |
| Forms & validation | React Hook Form + Zod | Same Zod schemas validate client and server |
| Database | PostgreSQL | Hosted on Neon or Supabase (free tier) |
| ORM | Drizzle ORM | Typed queries, SQL migrations committed to repo |
| Auth | Auth.js (NextAuth) | Google OAuth + email/password |
| Email | Resend | Reminder and digest emails |
| Scheduled jobs | Vercel Cron | Daily reminder / ghosting check |
| Drag and drop | dnd-kit | Kanban board |
| Charts | Recharts | Dashboard |
| Testing | Vitest (unit), Playwright (end-to-end) | |
| CI | GitHub Actions | Lint, typecheck, test, build on every push/PR |
| Hosting | Vercel | Preview deploy per PR |
| Local dev | Docker Compose for PostgreSQL | |

---

## 4. Domain Model

### 4.1 Application status pipeline

```
WISHLIST → APPLIED → ASSESSMENT → INTERVIEWING → OFFER → ACCEPTED
                                                  ↘
Any active status can move to: REJECTED · WITHDRAWN · GHOSTED
```

| Status | Meaning |
| --- | --- |
| `WISHLIST` | Saved, not applied yet |
| `APPLIED` | Application submitted |
| `ASSESSMENT` | Online test / take-home assignment |
| `INTERVIEWING` | At least one interview scheduled or done |
| `OFFER` | Offer received |
| `ACCEPTED` | Offer accepted (terminal) |
| `REJECTED` | Rejected by company (terminal) |
| `WITHDRAWN` | User withdrew (terminal) |
| `GHOSTED` | No response after N days (terminal, can be reopened) |

Rules:
- Any status can be changed to any other status manually (real life is messy), but every change is recorded in `StatusEvent`.
- "Active" = not in a terminal status.
- `GHOSTED` is suggested automatically (see 5.5), never applied silently.

### 4.2 Entities

**User**
- `id`, `name`, `email`, `image`, `createdAt`
- Settings: `ghostAfterDays` (default 21), `followUpAfterDays` (default 7), `emailRemindersEnabled` (default true), `timezone` (default `Asia/Bangkok`)

**Application**
- `id`, `userId` (owner)
- `companyName` (required)
- `roleTitle` (required)
- `jobUrl` (optional)
- `location` (optional), `workMode`: `ONSITE | HYBRID | REMOTE` (optional)
- `employmentType`: `FULL_TIME | INTERNSHIP | CONTRACT | PART_TIME`
- `salaryMin`, `salaryMax`, `salaryCurrency` (optional, default `THB`)
- `source`: `LINKEDIN | JOBTHAI | JOBSDB | COMPANY_SITE | REFERRAL | OTHER`
- `status` (see 4.1), `statusUpdatedAt`
- `appliedAt` (date, optional — set automatically when moved to `APPLIED` if empty)
- `nextActionAt` (date, optional) + `nextActionNote` (e.g. "Follow up with recruiter")
- `priority`: 1–3 (how much the user wants this job)
- `resumeVersion` (free text, e.g. "resume-v3-frontend")
- `jobDescription` (long text, optional — pasted JD for later reference)
- `notes` (markdown)
- `archivedAt` (soft delete), `createdAt`, `updatedAt`

**StatusEvent** (append-only history)
- `id`, `applicationId`, `fromStatus` (nullable), `toStatus`, `changedAt`, `note` (optional)

**Interview**
- `id`, `applicationId`
- `round` (e.g. "HR screen", "Technical 1"), `type`: `PHONE | VIDEO | ONSITE | TAKE_HOME`
- `scheduledAt`, `durationMinutes`, `location` or `meetingUrl`
- `interviewers` (free text), `prepNotes`, `reflectionNotes` (written after)
- `outcome`: `PENDING | PASSED | FAILED | UNKNOWN`

**Contact**
- `id`, `applicationId`, `name`, `role` (e.g. Recruiter), `email`, `linkedinUrl`, `notes`

**Tag** (optional in MVP, many-to-many with Application)
- `id`, `userId`, `name`, `color`

All child records cascade-delete with their Application. Every query is scoped by `userId`.

---

## 5. Features

### 5.1 Authentication
- Sign in with Google, or email + password (hashed with bcrypt/argon2)
- Protected routes redirect to `/login`
- Sign out
- Delete account (removes all data)

### 5.2 Applications — create, edit, archive
- "New application" opens a quick form: **company, role, status, job URL** visible; everything else under "More details"
- Keyboard shortcut `N` opens the quick form
- Edit all fields on the detail page
- Archive (soft delete) with undo toast; permanently delete from archive view
- Duplicate warning when the same company + role already exists

### 5.3 Views
**List view** (default)
- Table: company, role, status badge, applied date, next action, priority
- Sort by any column
- Filter by status (multi-select), source, work mode, employment type, tag
- Text search over company, role, notes
- Filters persist in the URL query string (shareable/bookmarkable)
- Pagination or infinite scroll beyond 50 rows

**Board view** (Kanban)
- One column per active status, plus collapsed "Closed" column for terminal statuses
- Drag a card to another column to change status (creates a StatusEvent)
- Card shows company, role, days in current status, next action date

**Detail page** (`/applications/[id]`)
- Header: company, role, status dropdown, priority
- Tabs or sections: Overview, Timeline (StatusEvents + interviews merged chronologically), Interviews, Contacts, Job description, Notes
- Change status with optional note

### 5.4 "Today" home screen
The default page after login answers "what should I do now?":
- **Upcoming interviews** in the next 7 days
- **Action needed**: applications whose `nextActionAt` is today or overdue
- **Follow up?**: `APPLIED` applications with no status change for `followUpAfterDays`
- **Possibly ghosted**: active applications with no change for `ghostAfterDays`, with one-click "Mark as ghosted" or "Snooze 7 days"
- Quick stats strip: active applications, interviews this week, offers

### 5.5 Reminders (scheduled)
- Daily cron at 08:00 user's timezone (implementation: run hourly, process users whose local time is 08:00)
- Sends one digest email per user only if there is something to report: interviews today/tomorrow, overdue next actions, follow-up suggestions
- Users can turn emails off in settings
- Cron endpoint is protected by a secret header

### 5.6 Dashboard / Insights
- Funnel: Applied → Assessment → Interviewing → Offer (counts and conversion %)
- Response rate: % of applications that got any response beyond `APPLIED`
- Applications per week (bar chart, last 12 weeks)
- Breakdown by source (which channel produces interviews)
- Average days from applied to first response

### 5.7 Import / Export
- Export all applications to CSV
- Import from CSV with a column-mapping preview and validation errors per row

### 5.8 Phase 3 ideas (not in MVP)
- **Smart add**: paste a job posting URL or the job description text → prefill company, role, location, salary. Try fetching the URL server-side; many sites (e.g. LinkedIn) block this, so pasting text must always work. Parsing can use an LLM API with a strict JSON schema; user always reviews before saving.
- Calendar export (`.ics`) for interviews
- LINE notification channel
- Resume version management with file upload
- Dark mode

---

## 6. Pages / Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page (logged out) / redirect to `/today` (logged in) |
| `/login` | Sign in |
| `/today` | Today home screen |
| `/applications` | List view (`?view=board` for Kanban) |
| `/applications/new` | Full create form (quick form is a dialog) |
| `/applications/[id]` | Detail page |
| `/insights` | Dashboard |
| `/settings` | Profile, reminder settings, import/export, delete account |
| `/api/cron/reminders` | Cron endpoint (secret-protected) |

---

## 7. Non-Functional Requirements

**Security**
- Every read and write checks that the record belongs to the signed-in user (authorization in the data-access layer, not only in the UI)
- All input validated with Zod on the server
- No secrets committed; `.env.example` documents required variables
- Rate-limit auth endpoints

**Quality**
- TypeScript strict, no `any` without a comment explaining why
- ESLint + Prettier enforced in CI
- Data-access functions live in one layer (`src/server/`), not scattered in components

**UX**
- Responsive down to 360px width
- Keyboard accessible; forms have labels; color is not the only status indicator
- Loading and empty states on every list
- Optimistic UI for status changes and drag-and-drop

**Performance**
- Indexes on `applications(userId, status)`, `applications(userId, nextActionAt)`, `status_events(applicationId, changedAt)`
- Lists render under 1 second with 500 applications

---

## 8. Testing Strategy

Kept light but present from day one.

- **Unit (Vitest):** status transition logic, ghost/follow-up detection, funnel/insight calculations, CSV parsing and validation
- **Integration:** data-access functions against a real test PostgreSQL (Docker), especially the "user can't access another user's data" rule
- **End-to-end (Playwright), a few critical flows:**
  1. Sign in → create application → it appears in the list
  2. Drag card to INTERVIEWING → timeline shows the event
  3. Add interview → it appears on Today page
- CI runs lint, typecheck, unit + integration tests, build on every PR. E2E can run on main only.

---

## 9. Project Structure (suggested)

```
.
├── src/
│   ├── app/                  # Next.js routes (App Router)
│   ├── components/           # UI components (shadcn/ui in components/ui)
│   ├── features/             # Feature modules: applications, interviews, insights...
│   ├── server/
│   │   ├── db/               # Drizzle schema, client, migrations
│   │   ├── queries/          # Read functions (always scoped by userId)
│   │   └── actions/          # Server Actions / mutations
│   ├── lib/                  # Shared utils, Zod schemas, date helpers
│   └── auth.ts               # Auth.js config
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker-compose.yml        # Local PostgreSQL
├── .env.example
├── .github/workflows/ci.yml
├── CLAUDE.md
└── README.md
```

---

## 10. Milestones

| Week | Milestone | Done when |
| --- | --- | --- |
| 1 | **Foundation** | Next.js + TS + Tailwind + shadcn set up; Postgres via Docker; Drizzle schema + first migration; Auth working; CI running lint/typecheck/build; deployed to Vercel (even if empty) |
| 2 | **Core CRUD** | Create/edit/archive applications; list view with sort, filter, search; detail page; status history recorded |
| 3 | **Board + Interviews** | Kanban with drag-and-drop; interviews and contacts on detail page; merged timeline |
| 4 | **Today screen** | Upcoming interviews, overdue actions, follow-up and ghost suggestions; settings page. **MVP complete — start using it for real** |
| 5 | **Reminders** | Daily digest email via cron; email on/off setting |
| 6 | **Insights + Import/Export** | Dashboard charts; CSV export/import |
| 7 | **Polish** | E2E tests, empty/loading states, mobile pass, accessibility pass, landing page, README with screenshots/GIF and live demo link |
| 8+ | **Phase 3** | Smart add from URL/text, `.ics` export, etc. |

---

## 11. Definition of Done (per feature)
- Works on desktop and mobile widths
- Server-side validation and ownership checks in place
- At least one test covering the core logic
- CI green
- Deployed to preview and checked manually

---

## 12. README Requirements (for the portfolio)
The final README should include:
- One-line pitch + live demo link + demo account (read-only seed data)
- GIF of the main flow (add → drag on board → Today screen)
- Feature list
- Tech stack and **why** each choice was made
- Architecture overview (diagram optional)
- Key technical decisions and trade-offs (e.g. append-only status history, timezone handling for reminders, authorization layer)
- How to run locally
- Testing approach
