// src/routes/paths.ts
/**
 * Centralized route paths for the application.
 * Use these constants instead of hardcoded strings for type safety and easier refactoring.
 */

export const PATHS = {
  // Public routes
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  CONTACT: "/contact",
  TERMS: "/terms-and-conditions",
  REFUND_POLICY: "/refund-policy",
  PRIVACY_POLICY: "/privacy-policy",
  PRICING_POLICY: "/pricing-policy",

  // Recruiter routes
  RECRUITER: {
    BASE: "/recruiter",
    DASHBOARD: "/recruiter/dashboard",
    COMPANIES: "/recruiter/companies",
    JOBS: "/recruiter/jobs",
    JOB_DETAILS: (id: string) => `/recruiter/jobs/${id}`,
    POST_JOB: "/recruiter/post-job",
    APPLICATIONS: "/recruiter/applications",
    CANDIDATES: "/recruiter/candidates",
    PROFILE: "/recruiter/profile",
  },

  // Admin routes
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

// Helper to build dynamic paths
export const buildPath = {
  recruiterJobDetails: (id: string) => PATHS.RECRUITER.JOB_DETAILS(id),
};
