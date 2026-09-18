// src/routes/paths.ts
/**
 * Centralized route paths for the admin app.
 * Use these constants instead of hardcoded strings.
 */

export const PATHS = {
  HOME: "/",
  SIGN_IN: "/sign-in",

  ADMIN: {
    BASE: "/admin",
    DASHBOARD: "/admin",
    USERS: "/admin/users",
    RECRUITERS: "/admin/recruiters",
    RESUMES: "/admin/resumes",
    PLANS: "/admin/plans",
    MESSAGES: "/admin/messages",
    ATS_RESULTS: "/admin/ats-results",
    MANAGEMENT: {
      JOB_TITLES: "/admin/management/job-titles",
      SKILLS: "/admin/management/skills",
      QUALIFICATIONS: "/admin/management/qualifications",
      COMPANIES: "/admin/management/companies",
    },
  },
} as const;
