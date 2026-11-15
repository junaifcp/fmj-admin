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
    /** Recruiter admin menu (docs/recruiter-admin). Items are added as each page ships. */
    RECRUITERS_ADMIN: {
      OVERVIEW: "/admin/recruiters/overview",
      LIST: "/admin/recruiters",
      /** Detail page: `${LIST}/:id` */
      DETAIL: "/admin/recruiters/:id",
      /** Employer invites (8.2). ?status=, ?recruiterId=, ?jobId= */
      EMPLOYER_INVITES: "/admin/recruiters/employer-invites",
      /** Old placeholder URL; redirects to OVERVIEW. */
      LEGACY_DASHBOARD: "/admin/recruiters/dashboard",
    },
    /** Employers menu (docs/employer-admin). Items are added as each page ships. */
    EMPLOYERS_ADMIN: {
      /** Overview (5.2). */
      OVERVIEW: "/admin/employers/overview",
      /** All Employers (6.2). Filters in the query string, e.g. ?utmCampaign=…&source=ad_landing */
      LIST: "/admin/employers",
      /** Detail page (6.2): `/admin/employers/:id` */
      DETAIL: "/admin/employers/:id",
      /** Post-a-Job Funnel (7.1). ?tab=open|posted|all&step&olderThanHours&channel&utmCampaign */
      FUNNEL: "/admin/employers/funnel",
      /** CV Drops (8.1). ?status=new|contacted&employerId&olderThanDays&q */
      CV_DROPS: "/admin/employers/cv-drops",
      /** Career Pages (8.2). ?enabled&companyVerified&hasJobs&q */
      CAREER_PAGES: "/admin/employers/career-pages",
      /** WhatsApp (9.1). ?tab=messages|consent&status&template&userId&state&q */
      WHATSAPP: "/admin/employers/whatsapp",
      /** Paid Services (10.2). ?status&plan&method&employerId */
      PAYMENTS: "/admin/employers/payments",
      /** Job desk (moved from Recruiters in 4.1). ?tab=unclaimed|assigned|closed, ?recruiterId= */
      JOB_DESK: "/admin/employers/job-desk",
    },
    /** Hiring section shared by recruiters and employers (employer admin 4.1). */
    HIRING: {
      /** Companies verification queue. ?tab=pending|verified|rejected|all, ?ownerId= */
      COMPANIES: "/admin/hiring/companies",
      /** Jobs moderation. ?tab=flagged|removed|all plus any list filter. */
      JOBS: "/admin/hiring/jobs",
      /** Applications health. ?owner=recruiters|employers|all, ?recruiterId= */
      APPLICATIONS: "/admin/hiring/applications",
      /** Activity log. ?actorId=, ?action=, ?targetType=, ?targetId= */
      ACTIVITY: "/admin/hiring/activity",
    },
    RESUMES: "/admin/resumes",
    PLANS: "/admin/plans",
    MESSAGES: "/admin/messages",
    ATS_RESULTS: "/admin/ats-results",
    MANAGEMENT: {
      JOB_TITLES: "/admin/management/job-titles",
      SKILLS: "/admin/management/skills",
      QUALIFICATIONS: "/admin/management/qualifications",
      /** Old URL; redirects to HIRING.COMPANIES. */
      COMPANIES: "/admin/management/companies",
    },
  },
} as const;

/** Employer admin 4.1: old URLs that redirect (query string kept) to their new home. */
export const LEGACY_REDIRECTS: { from: string; to: string }[] = [
  { from: "recruiters/companies", to: PATHS.ADMIN.HIRING.COMPANIES },
  { from: "recruiters/jobs", to: PATHS.ADMIN.HIRING.JOBS },
  { from: "recruiters/applications", to: PATHS.ADMIN.HIRING.APPLICATIONS },
  { from: "recruiters/activity", to: PATHS.ADMIN.HIRING.ACTIVITY },
  { from: "recruiters/job-desk", to: PATHS.ADMIN.EMPLOYERS_ADMIN.JOB_DESK },
  { from: "management/companies", to: PATHS.ADMIN.HIRING.COMPANIES },
];

/** Employer admin 6.2: Employer Detail is live, so owner links open it. */
export const EMPLOYER_DETAIL_LIVE = true;

/** Owner detail page by role. */
export const ownerDetailPath = (role: string | undefined | null, id: string): string | null => {
  if (role === "recruiter") return `${PATHS.ADMIN.RECRUITERS_ADMIN.LIST}/${id}`;
  if (role === "employer" && EMPLOYER_DETAIL_LIVE) return `${PATHS.ADMIN.EMPLOYERS_ADMIN.LIST}/${id}`;
  return null;
};

