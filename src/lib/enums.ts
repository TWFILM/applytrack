// Single source of truth for enum values (SPEC.md §4). Used by the Drizzle pgEnums
// and, later, by the Zod form schemas, so the DB and validation can't drift apart.

export const APPLICATION_STATUSES = [
  "WISHLIST",
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEWING",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "GHOSTED",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const WORK_MODES = ["ONSITE", "HYBRID", "REMOTE"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const EMPLOYMENT_TYPES = ["FULL_TIME", "INTERNSHIP", "CONTRACT", "PART_TIME"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const APPLICATION_SOURCES = [
  "LINKEDIN",
  "JOBTHAI",
  "JOBSDB",
  "COMPANY_SITE",
  "REFERRAL",
  "OTHER",
] as const;
export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];

export const INTERVIEW_TYPES = ["PHONE", "VIDEO", "ONSITE", "TAKE_HOME"] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_OUTCOMES = ["PENDING", "PASSED", "FAILED", "UNKNOWN"] as const;
export type InterviewOutcome = (typeof INTERVIEW_OUTCOMES)[number];
