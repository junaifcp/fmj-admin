// src/types/employerAdmin.ts
// Employer admin: response shapes for /api/admin/employers/*.
import type { CompanyVerification, FulfillmentPlan, JobModerationStatus, Paged } from "./recruiterAdmin";

/** GET /api/admin/employers/overview (5.1). */
export interface EmployerOverview {
  range: { from: string; to: string };
  generatedAt: string;
  kpis: {
    totalEmployers: number;
    newEmployers: number;
    active7d: number;
    active30d: number;
    lastActiveSince: string | null;
    withCompanyPct: number;
    postedPct: number;
    jobsPostedInRange: number;
    applicationsInRange: number;
    hiresInRange: number;
    revenueInRangePaise: number;
  };
  adFunnel: {
    signedUp: number;
    whatsappDone: number;
    company: number;
    basics: number;
    posted: number;
    gotApplication: number;
    hired: number;
  };
  bySource: { source: string; signups: number; posted: number; withApplication: number }[];
  byCampaign: {
    channel: string;
    utmSource: string;
    utmCampaign: string;
    signups: number;
    posted: number;
    withApplication: number;
  }[];
  trends: { week: string; signups: number; jobsPosted: number; applications: number }[];
  needsAction: {
    abandonedDrafts24h: number;
    companiesPending: number;
    cvDropsUncontacted7d: number;
    jobDeskUnclaimed48h: number;
    whatsappFailed7d: number;
    employerJobsFlagged: number;
  };
  cvDrops: {
    receivedInRange: number;
    contactedPct: number;
    medianHoursToContact: number | null;
  };
  topEmployers: {
    userId: string;
    name: string;
    email: string;
    company: string;
    jobs: number;
    applications: number;
    hires: number;
  }[];
}

// ---- Employer admin 6.1 / 6.2: list, detail and tabs ----


export type EmployerSource = "ad_landing" | "dashboard" | "invite";
export type DraftStep = "whatsapp" | "company" | "basics" | "generate" | "review" | "posted";

export interface EmployerListFilters {
  search?: string;
  status?: "active" | "suspended";
  source?: EmployerSource;
  channel?: string;
  utmCampaign?: string;
  hasCompany?: "true" | "false";
  posted?: "true" | "false";
  companyVerified?: CompanyVerification;
  joinedFrom?: string;
  joinedTo?: string;
  lastActiveWithin?: "7" | "30" | "90";
  sortBy?: "createdAt" | "lastActive" | "jobs" | "applications";
  sortOrder?: "asc" | "desc";
}

export interface EmployerListRow {
  _id: string;
  email: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  company: { _id: string; name: string; verified: CompanyVerification } | null;
  stats: { jobs: number; activeJobs: number; applications: number; hires: number };
  openDraftStep: DraftStep | null;
  cvDrops: { total: number; new: number };
  source: EmployerSource | null;
  channel: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  isActive: boolean;
  suspendedAt: string | null;
  createdAt: string;
  lastActive: string | null;
}

export interface EmployerDetail {
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
    phone: string;
    dialCode: string;
    position: string;
    basicInfoProvided: boolean;
    whatsapp: {
      number: string | null;
      consentAt: string | null;
      skippedAt: string | null;
      optOutAt: string | null;
    };
    acquisition: {
      source: EmployerSource | null;
      channel: string | null;
      utmSource: string | null;
      utmMedium: string | null;
      utmCampaign: string | null;
      capturedAt: string | null;
    } | null;
    isActive: boolean;
    suspendedAt: string | null;
    suspendedReason: string | null;
    suspendedBy: { _id: string; email: string; name: string } | null;
  };
  company: {
    _id: string;
    name: string;
    logo: string | null;
    website: string | null;
    verified: CompanyVerification;
    verifiedAt: string | null;
  } | null;
  careerPage: { slug: string | null; enabled: boolean; verified: boolean; publicUrl: string | null };
  cvDrop: { code: string | null; enabled: boolean; publicUrl: string | null; total: number; new: number };
  stats: {
    jobs: number;
    jobsByStatus: Record<string, number>;
    applications: number;
    applicationsByStatus: Record<string, number>;
    hires: number;
    openDraftStep: DraftStep | null;
    sharedJobs: number;
    whatsappMessages: number;
  };
}

export interface EmployerJobRow {
  _id: string;
  title: string;
  status: string;
  type?: string;
  city: string | null;
  company: { _id: string; name: string; verified?: CompanyVerification } | null;
  assignee: { _id: string; email: string; name: string } | null;
  assignedAt: string | null;
  fulfillmentPlan: FulfillmentPlan;
  posterStatus: string | null;
  moderation: { status: JobModerationStatus; reason: string | null; autoFlags: string[] };
  applicationCount: number;
  publicUrl: string | null;
  createdAt: string;
}

export interface EmployerApplicationsRow {
  jobId: string;
  title: string;
  jobStatus: string | null;
  total: number;
  byStatus: Record<string, number>;
}

export interface EmployerDraftRow {
  _id: string;
  status: "open" | "posted";
  step: DraftStep;
  title: string;
  company: string | null;
  postedJobId: string | null;
  createdAt: string;
  lastSavedAt: string;
}

export interface EmployerCvDropRow {
  _id: string;
  name: string;
  phone: string | null;
  email: string | null;
  roleInterest: string | null;
  job: { _id: string; title: string } | null;
  status: "new" | "contacted";
  contactedAt: string | null;
  createdAt: string;
}

export interface EmployerSharedJobRow {
  _id: string;
  job: { _id: string; title: string; status: string } | null;
  recruiter: { _id: string; email: string; name: string } | null;
  status: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface EmployerWhatsappRow {
  _id: string;
  template: string;
  to: string | null;
  status: "queued" | "sent" | "skipped" | "failed";
  error: string | null;
  job: { _id: string; title: string } | null;
  createdAt: string;
}

/** Employer admin 10.1: one recorded (or refunded) payment. */
export type PaidPlan = "smart_hire" | "hire_assist";
export type PaymentMethod = "upi" | "bank" | "cash" | "card" | "other";
type PaymentPerson = { _id: string; email: string; name: string } | null;

export interface EmployerPaymentRow {
  _id: string;
  employer: PaymentPerson;
  job: { _id: string; title: string; company: string | null; fulfillmentPlan: string } | null;
  plan: PaidPlan;
  amountPaise: number;
  currency: "INR";
  paidAt: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  status: "recorded" | "refunded";
  recordedBy: PaymentPerson;
  refundedBy: PaymentPerson;
  refundedAt: string | null;
  refundReason: string | null;
  createdAt: string;
}

// ---- Employer admin 7.1: Post-a-Job Funnel ----

export type FunnelTab = "open" | "posted" | "all";

export interface FunnelDraftRow {
  _id: string;
  status: "open" | "posted";
  step: DraftStep;
  title: string;
  company: string | null;
  employer: {
    _id: string;
    email: string;
    name: string;
    role: string | null;
    phone: string | null;
    whatsapp: { number: string | null; status: "consented" | "opted_out" | "no_consent" };
    isActive: boolean;
  };
  acquisition: { source: EmployerSource | null; channel: string | null; utmCampaign: string | null };
  postedJob: { _id: string; title: string; status: string; publicUrl: string | null } | null;
  latestNote: { body: string; createdAt: string; by: string } | null;
  createdAt: string;
  lastSavedAt: string;
  ageHours: number;
}

export interface FunnelResult extends Paged<FunnelDraftRow> {
  tab: FunnelTab;
  stepCounts: Record<DraftStep, number>;
}

export interface FunnelFilters {
  tab?: FunnelTab;
  step?: DraftStep;
  olderThanHours?: string;
  channel?: string;
  utmCampaign?: string;
}

// ---- Employer admin 8.1: CV drops ----

export interface AdminCvDropRow {
  _id: string;
  name: string;
  phone: string | null;
  email: string | null;
  roleInterest: string | null;
  job: { _id: string; title: string } | null;
  company: { _id: string; name: string } | null;
  employer: { _id: string; email: string; name: string } | null;
  status: "new" | "contacted";
  contactedAt: string | null;
  hoursToContact: number | null;
  createdAt: string;
}

export interface CvDropSummaryRow {
  employer: { _id: string; email: string; name: string };
  company: string;
  total: number;
  new: number;
  uncontacted7d: number;
  medianHoursToContact: number | null;
}

export interface CvDropFilters {
  status?: "new" | "contacted";
  employerId?: string;
  olderThanDays?: string;
  q?: string;
}

// ---- Employer admin 8.2: Career pages ----

export interface CareerPageRow {
  employer: { _id: string; email: string; name: string };
  company: { _id: string; name: string; verified: CompanyVerification; hasLogo: boolean; hasAbout: boolean } | null;
  slug: string;
  publicUrl: string;
  enabled: boolean;
  suspended: boolean;
  listedJobs: number;
  hiddenOldJobs: number;
  live: boolean;
}

export interface CareerPageFilters {
  enabled?: "true" | "false";
  companyVerified?: CompanyVerification;
  hasJobs?: "true" | "false";
  q?: string;
}

export interface PaymentFilters {
  status?: "recorded" | "refunded";
  plan?: PaidPlan;
  method?: PaymentMethod;
  employerId?: string;
  from?: string;
  to?: string;
}

export interface PaymentsSummary {
  range: { from: string | null; to: string | null };
  revenuePaise: number;
  payments: number;
  paidJobs: number;
  assignedJobs: number;
  conversionPct: number;
  byMonth: { month: string; revenuePaise: number; count: number }[];
  byPlan: { plan: PaidPlan; revenuePaise: number; count: number }[];
  byChannel: { channel: string; revenuePaise: number; count: number }[];
  prices: Record<PaidPlan, number>;
}

export interface RecordPaymentInput {
  jobId: string;
  plan: PaidPlan;
  amountPaise: number;
  paidAt: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

// ---- Employer admin 9.1: WhatsApp ----

export type WhatsappStatus = "queued" | "sent" | "skipped" | "failed";
export type ConsentState = "consented" | "opted_out" | "skipped" | "none";

export interface WhatsappMessageRow {
  _id: string;
  template: string;
  status: WhatsappStatus;
  error: string | null;
  to: string | null;
  employer: { _id: string; email: string; name: string } | null;
  job: { _id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappMessagesResult extends Paged<WhatsappMessageRow> {
  providerConfigured: boolean;
}

export interface WhatsappConsentRow {
  employer: { _id: string; email: string; name: string };
  number: string | null;
  state: ConsentState;
  consentAt: string | null;
  skippedAt: string | null;
  optOutAt: string | null;
  lastMessage: { status: WhatsappStatus; template: string; at: string } | null;
}

export interface WhatsappSummary {
  totals: Record<WhatsappStatus, number>;
  byTemplate: ({ template: string } & Record<WhatsappStatus, number>)[];
  topErrors: { error: string; count: number }[];
  providerConfigured: boolean;
}

export interface WhatsappMessageFilters {
  template?: string;
  status?: WhatsappStatus;
  userId?: string;
  from?: string;
  to?: string;
}
