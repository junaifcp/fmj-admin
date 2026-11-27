// src/types/recruiterAdmin.ts
// Recruiter admin 4.1/4.2: GET /api/admin/recruiters/overview

export interface RecruiterOverviewWeek {
  week: string; // yyyy-mm-dd of the Monday (Asia/Kolkata)
  jobsPosted: number;
  applications: number;
  hires: number;
}

export interface RecruiterOverviewTopRow {
  userId: string;
  name: string;
  email: string;
  company: string;
  jobs: number;
  applications: number;
  hires: number;
}

export interface RecruiterOverview {
  range: { from: string; to: string };
  generatedAt: string;
  kpis: {
    totalRecruiters: number;
    newRecruiters: number;
    active7d: number;
    active30d: number;
    /** When recruiter lastActive collection started (3.3 deploy), or null if not set. */
    lastActiveSince: string | null;
    onboardedPct: number;
    activeJobs: number;
    applicationsInRange: number;
    hiresInRange: number;
  };
  funnel: {
    signedUp: number;
    onboarded: number;
    postedJob: number;
    gotApplication: number;
    hired: number;
  };
  trends: RecruiterOverviewWeek[];
  avgApplicationsPerJob: number | null;
  medianHoursToFirstApplication: number | null;
  needsAction: {
    companiesPending: number;
    jobsFlagged: number;
    employerJobsUnclaimed48h: number;
    posterFailed: number;
    invitesSendFailed: number;
    heavyInviteSenders: number;
  };
  costs: {
    googleCityLookupsToday: number;
    googleCityDailyCap: number;
    postersGeneratedInRange: number;
  };
  topRecruiters: RecruiterOverviewTopRow[];
}

// ---- Recruiter admin 5.1/5.2: list, detail, tabs ----

export type CompanyVerification = "pending" | "verified" | "rejected";

export interface Paged<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface RecruiterListFilters {
  search?: string;
  status?: "active" | "suspended";
  onboarded?: "true" | "false";
  companyVerified?: CompanyVerification;
  joinedFrom?: string;
  joinedTo?: string;
  lastActiveWithin?: "7" | "30" | "90";
  sortBy?: "createdAt" | "lastActive" | "jobs" | "applications" | "hires";
  sortOrder?: "asc" | "desc";
}

export interface RecruiterListRow {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  phone?: string;
  company?: string;
  companyId?: string | null;
  companyVerified: CompanyVerification | null;
  position?: string;
  role: "recruiter";
  stats: { totalJobs: number; activeJobs: number; totalApplications: number; hires: number };
  isActive: boolean;
  suspendedAt: string | null;
  /** Set when an admin deleted the account (soft delete). */
  deletedAt: string | null;
  createdAt: string;
  lastActive: string | null;
  basicInfoProvided: boolean;
  isEmailVerified?: boolean;
}

export interface RecruiterDetail {
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
    role: string;
    createdAt: string;
    lastActive: string | null;
    isEmailVerified: boolean;
  };
  profile: {
    company: string;
    companyId: string | null;
    position: string;
    phone: string;
    dialCode: string;
    bio: string;
    basicInfoProvided: boolean;
    features: string[];
    isActive: boolean;
    suspendedAt: string | null;
    suspendedReason: string | null;
    suspendedBy: { _id: string; email: string; name: string } | null;
    deletedAt: string | null;
    deletedReason: string | null;
    deletedBy: { _id: string; email: string; name: string } | null;
  };
  companies: {
    _id: string;
    name: string;
    logo?: string;
    website?: string;
    verified?: CompanyVerification;
    verifiedAt?: string;
    createdAt: string;
  }[];
  stats: {
    jobs: number;
    jobsByStatus: Record<string, number>;
    applications: number;
    applicationsByStatus: Record<string, number>;
    hires: number;
    invitesByStatus: Record<string, number>;
    jobDeskClaims: number;
  };
}

export interface RecruiterJobRow {
  _id: string;
  title: string;
  status: string;
  type?: string;
  city: string | null;
  company: { _id: string; name: string; verified?: CompanyVerification } | null;
  source: "posted" | "claimed";
  fulfillmentPlan: string | null;
  posterStatus: string | null;
  moderation: { status: "none" | "flagged" | "removed"; reason: string | null; autoFlags: string[] };
  applicationCount: number;
  publicUrl: string | null;
  createdAt: string;
}

export interface RecruiterApplicationsRow {
  jobId: string;
  title: string;
  jobStatus: string | null;
  total: number;
  byStatus: Record<string, number>;
}

export interface RecruiterJobDeskRow {
  _id: string;
  title: string;
  status: string;
  company: string | null;
  employer: { _id: string; email: string; name: string } | null;
  fulfillmentPlan: string;
  createdAt: string;
  assignedAt: string | null;
  applicationCount: number;
}

export interface RecruiterInviteRow {
  id: string;
  jobId: string;
  jobTitle: string;
  email: string;
  status: "sent" | "send_failed" | "accepted" | "revoked" | "expired";
  sentAt: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
  lastError: string;
  whatsapp: { number: string | null; status: string } | null;
  createdAt: string;
}

export interface AdminActivityRow {
  _id: string;
  actorId: { _id: string; email: string; firstName?: string; lastName?: string } | null;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  createdAt: string;
}

export interface AdminNoteRow {
  _id: string;
  body: string;
  createdBy: { _id: string; email: string; firstName?: string; lastName?: string } | null;
  createdAt: string;
}

// ---- Recruiter admin 6.1: Companies verification queue ----

export interface CompanyLocation {
  placeId?: string;
  formattedAddress?: string;
  city?: string;
  region?: string;
  country?: string;
}

export interface CompanyListRow {
  _id: string;
  name: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  industry?: string;
  size?: string;
  location?: CompanyLocation | null;
  verified: CompanyVerification;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerRole?: string;
  jobCount: number;
  createdAt: string;
}

export interface CompanyListResult extends Paged<CompanyListRow> {
  counts: Record<CompanyVerification | "all", number>;
}

type PersonRef = { _id: string; email: string; firstName?: string; lastName?: string; role?: string };

export interface CompanySummary {
  _id: string;
  name: string;
  verified?: CompanyVerification;
  location?: { city?: string } | null;
  ownerId?: PersonRef | string | null;
  createdAt: string;
}

export interface CompanyDetail extends Omit<CompanyListRow, "ownerId" | "ownerName" | "ownerEmail" | "ownerRole"> {
  description?: string;
  ownerId: PersonRef | null;
  verifiedBy?: PersonRef | null;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  ownerOtherCompanies: CompanySummary[];
  possibleDuplicates: CompanySummary[];
}

// ---- Recruiter admin 7.1/7.2: Jobs moderation ----

export type JobModerationStatus = "none" | "flagged" | "removed";
export type JobAutoFlag = "unverified_company" | "salary_outlier" | "duplicate_recent";
export type JobModerationAction = "flag" | "unflag" | "remove" | "restore" | "close";

export interface JobModeration {
  status: JobModerationStatus;
  reason: string | null;
  at?: string | null;
  by?: { _id: string; email: string; firstName?: string; lastName?: string } | null;
  autoFlags: JobAutoFlag[];
}

type JobPerson = { _id: string; email: string; name: string; role?: string } | null;

/** Job tags 2.2 (docs/job-tags): a job tag as the admin jobs API sends it. */
export interface AdminJobTag {
  _id: string;
  name: string;
  slug: string;
  showToCandidates: boolean;
}

/** POST /admin/jobs/tags/bulk result. */
export interface BulkJobTagsResult {
  matched: number;
  modified: number;
  skippedTooMany: number;
  missing: number;
}

export interface AdminJobRow {
  _id: string;
  title: string;
  status: "active" | "paused" | "closed";
  type: string | null;
  city: string | null;
  company: { _id: string; name: string; verified: CompanyVerification } | null;
  postedBy: JobPerson;
  assignedRecruiter: JobPerson;
  fulfillmentPlan: string | null;
  applicationCount: number;
  posterStatus: "pending" | "ready" | "failed" | null;
  moderation: JobModeration;
  publicUrl: string | null;
  /** Job tags 2.2. */
  tags: AdminJobTag[];
  createdAt: string;
}

export interface AdminJobsResult extends Paged<AdminJobRow> {
  counts: Record<JobModerationStatus | "all", number>;
}

export interface AdminJobFilters {
  q?: string;
  status?: string;
  moderation?: JobModerationStatus;
  recruiterId?: string;
  companyId?: string;
  companyVerified?: CompanyVerification;
  type?: string;
  city?: string;
  from?: string;
  to?: string;
  posterStatus?: string;
  postedByRole?: "recruiter" | "employer";
  minApplications?: string;
  /** Job tags 2.2: one tag id. */
  tagId?: string;
}

type PopulatedPerson = { _id: string; email: string; firstName?: string; lastName?: string; role?: string };

export interface AdminJobDetail {
  _id: string;
  title: string;
  status: "active" | "paused" | "closed";
  type?: string;
  summary?: string;
  description?: string;
  experienceYears?: number;
  salary?: { min?: number; max?: number; currency?: string };
  location?: { city?: string; formattedAddress?: string } | null;
  skills?: { _id: string; name: string }[];
  companyId?: { _id: string; name: string; verified?: CompanyVerification; website?: string } | null;
  postedBy?: PopulatedPerson | null;
  assignedRecruiterId?: PopulatedPerson | null;
  posterStatus?: "pending" | "ready" | "failed";
  posterImageUrl?: string;
  applicationCount: number;
  publicUrl: string | null;
  moderation: JobModeration;
  /** Job tags 2.2. */
  tags: AdminJobTag[];
  history: AdminActivityRow[];
  createdAt: string;
}

// ---- Recruiter admin 8.1: Job desk ----

export type DeskTab = "unclaimed" | "assigned" | "closed";
export type FulfillmentPlan = "free" | "smart_hire" | "hire_assist";

export interface DeskJobRow {
  _id: string;
  title: string;
  status: "active" | "paused" | "closed";
  city: string | null;
  company: string | null;
  employer: {
    _id: string;
    email: string;
    name: string;
    phone: string | null;
    whatsappNumber: string | null;
  } | null;
  assignedRecruiter: { _id: string; email: string; name: string } | null;
  assignedAt: string | null;
  hoursToClaim: number | null;
  unclaimedOver48h: boolean;
  fulfillmentPlan: FulfillmentPlan;
  applicationCount: number;
  removed: boolean;
  createdAt: string;
}

export interface DeskResult extends Paged<DeskJobRow> {
  counts: Record<DeskTab, number>;
}

// ---- Recruiter admin 8.2: Employer invites ----

export interface AdminInviteRow extends RecruiterInviteRow {
  invitedBy: string;
  jobRemoved: boolean;
  recruiter: { _id: string; email: string; name: string; role?: string } | null;
  canResend: boolean;
  canRevoke: boolean;
}

export interface HeavySender {
  recruiterId: string;
  email: string;
  name: string;
  invites: number;
  lastAt: string;
}

// ---- Recruiter admin 9.1: Applications health ----

type SummaryPerson = {
  _id: string;
  email: string;
  name: string;
  company: string;
  /** Employer admin 4.1: who owns the pipeline. */
  ownerRole?: "recruiter" | "employer";
};

/** Employer admin 4.1: whose pipelines the Applications page shows. */
export type ApplicationsOwnerScope = "recruiters" | "employers" | "all";

export interface ApplicationsSummary {
  range: { from: string | null; to: string | null };
  owner?: ApplicationsOwnerScope;
  total: number;
  worked: number;
  byStatus: Record<string, number>;
  bySource: { source: string; count: number }[];
  stuck: {
    jobId: string;
    title: string;
    jobStatus: string | null;
    recruiter: SummaryPerson | null;
    count: number;
    oldestAppliedAt: string;
    daysWaiting: number;
  }[];
  stuckDays: number;
  byRecruiter: {
    recruiter: SummaryPerson;
    total: number;
    worked: number;
    workedPct: number;
    hires: number;
    medianDaysToFirstChange: number | null;
    measured: number;
  }[];
  invalidStatus: number;
}

// ---- Recruiter admin 9.2: Activity log ----

export interface AuditLogFilters {
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  from?: string;
  to?: string;
}
