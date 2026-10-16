import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  INTERVIEW_OUTCOMES,
  INTERVIEW_TYPES,
  WORK_MODES,
} from "@/lib/enums";

// Column names are written camelCase here and stored snake_case in Postgres
// (`casing: "snake_case"` in the Drizzle client and drizzle.config.ts).

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const applicationStatus = pgEnum("application_status", APPLICATION_STATUSES);
export const workMode = pgEnum("work_mode", WORK_MODES);
export const employmentType = pgEnum("employment_type", EMPLOYMENT_TYPES);
export const applicationSource = pgEnum("application_source", APPLICATION_SOURCES);
export const interviewType = pgEnum("interview_type", INTERVIEW_TYPES);
export const interviewOutcome = pgEnum("interview_outcome", INTERVIEW_OUTCOMES);

// ---------------------------------------------------------------------------
// Auth tables — shape required by Better Auth 1.7 core schema.
// IDs are text because Better Auth generates them itself.
// Exported with plural names; the adapter is configured with `usePlural: true`.
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    email: text().notNull().unique(),
    emailVerified: boolean().notNull().default(false),
    image: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),

    // App settings (SPEC.md §4.2). Registered as Better Auth `additionalFields`.
    ghostAfterDays: integer().notNull().default(21),
    followUpAfterDays: integer().notNull().default(7),
    emailRemindersEnabled: boolean().notNull().default(true),
    timezone: text().notNull().default("Asia/Bangkok"),
  },
  (t) => [
    check("users_ghost_after_days_positive", sql`${t.ghostAfterDays} > 0`),
    check("users_follow_up_after_days_positive", sql`${t.followUpAfterDays} > 0`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text().primaryKey(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    token: text().notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [index().on(t.userId)],
);

// One row per sign-in method. Email/password users get providerId "credential"
// and their password hash lives in `password` here, not on `users`.
export const accounts = pgTable(
  "accounts",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.identifier)],
);

// ---------------------------------------------------------------------------
// Domain tables (SPEC.md §4.2)
// Child tables have no userId: ownership is checked by joining through applications.
// ---------------------------------------------------------------------------

export const applications = pgTable(
  "applications",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    companyName: text().notNull(),
    roleTitle: text().notNull(),
    jobUrl: text(),
    location: text(),
    workMode: workMode(),
    employmentType: employmentType().notNull().default("FULL_TIME"),
    salaryMin: integer(),
    salaryMax: integer(),
    salaryCurrency: text().notNull().default("THB"),
    source: applicationSource(),

    status: applicationStatus().notNull().default("APPLIED"),
    statusUpdatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),

    // Calendar dates in the user's own timezone, not instants — stored as `date`
    // and read as "YYYY-MM-DD" strings so JS Date can't shift them by a day.
    appliedAt: date({ mode: "string" }),
    nextActionAt: date({ mode: "string" }),
    nextActionNote: text(),

    priority: smallint().notNull().default(2),
    resumeVersion: text(),
    jobDescription: text(),
    notes: text(),

    archivedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index().on(t.userId, t.status),
    index().on(t.userId, t.nextActionAt),
    check("applications_priority_range", sql`${t.priority} between 1 and 3`),
    check(
      "applications_salary_range",
      sql`${t.salaryMin} is null or ${t.salaryMax} is null or ${t.salaryMin} <= ${t.salaryMax}`,
    ),
  ],
);

// Append-only history: rows are inserted on every status change, never updated.
export const statusEvents = pgTable(
  "status_events",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicationId: uuid()
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    fromStatus: applicationStatus(), // null for the first event (creation)
    toStatus: applicationStatus().notNull(),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    note: text(),
  },
  (t) => [index().on(t.applicationId, t.changedAt)],
);

export const interviews = pgTable(
  "interviews",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicationId: uuid()
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    round: text().notNull(),
    type: interviewType().notNull(),
    scheduledAt: timestamp({ withTimezone: true }), // null = date not set yet
    durationMinutes: integer(),
    location: text(),
    meetingUrl: text(),
    interviewers: text(),
    prepNotes: text(),
    reflectionNotes: text(),
    outcome: interviewOutcome().notNull().default("PENDING"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index().on(t.applicationId, t.scheduledAt),
    check(
      "interviews_duration_positive",
      sql`${t.durationMinutes} is null or ${t.durationMinutes} > 0`,
    ),
  ],
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicationId: uuid()
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    name: text().notNull(),
    role: text(),
    email: text(),
    linkedinUrl: text(),
    notes: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.applicationId)],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text().notNull(),
    color: text(),
    createdAt: createdAt(),
  },
  (t) => [unique("tags_user_id_name_unique").on(t.userId, t.name)],
);

// Many-to-many. The action layer must check the tag and application share the same user.
export const applicationTags = pgTable(
  "application_tags",
  {
    applicationId: uuid()
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    tagId: uuid()
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.applicationId, t.tagId] }), index().on(t.tagId)],
);

// ---------------------------------------------------------------------------
// Relations (for Drizzle's relational query API, e.g. `with: { interviews: true }`)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  applications: many(applications),
  tags: many(tags),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  statusEvents: many(statusEvents),
  interviews: many(interviews),
  contacts: many(contacts),
  applicationTags: many(applicationTags),
}));

export const statusEventsRelations = relations(statusEvents, ({ one }) => ({
  application: one(applications, {
    fields: [statusEvents.applicationId],
    references: [applications.id],
  }),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  application: one(applications, {
    fields: [contacts.applicationId],
    references: [applications.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  applicationTags: many(applicationTags),
}));

export const applicationTagsRelations = relations(applicationTags, ({ one }) => ({
  application: one(applications, {
    fields: [applicationTags.applicationId],
    references: [applications.id],
  }),
  tag: one(tags, { fields: [applicationTags.tagId], references: [tags.id] }),
}));
