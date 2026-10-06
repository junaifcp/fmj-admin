// Admin Types and Interfaces
export interface AdminUser {
  _id: string;
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "admin" | "superadmin";
  subscription?: {
    planId?: string;
    planName?: string;
    status: "active" | "inactive" | "cancelled";
    endDate?: string;
  };
  userSubscription?: {
    status:
      | "inactive"
      | "initialized"
      | "active"
      | "on_hold"
      | "cancelled"
      | "completed";
    planId?: string;
    orderId?: string;
    transactionId?: string;
    startDate?: string;
    endDate?: string;
    amount?: number;
  };
  access?: {
    resume?: {
      status?: "inactive" | "active";
      source?:
        | "landing"
        | "download_paywall"
        | "in_app"
        | "migration"
        | "admin"
        | null;
      planId?: string | null;
      planName?: string | null;
      orderId?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    };
  };
  createdAt?: string;
  lastActive?: string;
}

export interface AdminMetrics {
  revenue: Array<{ date: string; amount: number }>;
  activeSubscriptions: number;
  newResumes: Array<{ date: string; count: number }>;
  dau: Array<{ date: string; count: number }>;
  mau: number;
  avgAtsScore: number;
  topTemplates: Array<{ templateId: string; count: number }>;
  subscriptionDistribution: Array<{ planId: string; count: number }>;
  topSkills: Array<{ skill: string; count: number }>;
}

export interface AdminResume {
  _id: string;
  id: string;
  name: string;
  title: string;
  template?: string;
  templateId?: string;
  jobTitleId?: string | null;
  jobTitle?: {
    _id: string;
    name: string;
  } | null;
  userId: string;
  userEmail?: string;
  userName?: string;
  userFirstName?: string;
  userLastName?: string;
  createdAt: string;
  updatedAt: string;
  lastUpdated?: string;
  isPublic?: boolean;
  isDefault?: boolean;
}

export interface AdminPlan {
  _id: string;
  name: string;
  cashfreePlanId: string;
  price: number;
  durationMonths: number;
  features: string[];
  activeSubscriptions: number;
  isActive?: boolean;
  displayName?: string;
  jobPostsLimit?: number;
}

export interface AdminContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied";
  createdAt: string;
}

export interface AdminAtsResult {
  _id: string;
  resumeId?: string;
  uploadId?: string;
  resumeName?: string;
  resumeTitle?: string;
  jobTitle?: {
    _id: string;
    name: string;
  } | null;
  userId: string;
  userEmail?: string;
  userName?: string;
  userFirstName?: string;
  userLastName?: string;
  overallScore: number;
  sections: {
    name: string;
    score: number;
    feedback: string;
  }[];
  status?: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  updatedAt?: string;
  // Full result data for detail view
  score?: {
    overall: number;
    skillsMatch: number;
    experienceRelevance: number;
    educationMatch: number;
    keywordOptimization: number;
  };
  feedback?: Array<{
    category: string;
    severity: "critical" | "important" | "suggestion";
    issue: string;
    recommendation: string;
    impact: string;
  }>;
  summary?: {
    strengths: string[];
    weaknesses: string[];
    quickWins: string[];
  };
  missingKeywords?: string[];
  presentKeywords?: string[];
  aiAnalysis?: string;
  processingTime?: number;
  error?: string;
}

export interface AtsResultsAnalytics {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  averageScore: number;
  highScores: number;
  mediumScores: number;
  lowScores: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  analytics?: AtsResultsAnalytics;
}

export interface AdminAuthResponse {
  user: {
    _id: string; // backend returns _id (Mongo)
    id?: string; // optional convenience field
    email: string;
    role: string;
  };
}

// Management Types
export interface ManagedItem {
  _id: string;
  name: string;
  normalized?: string; // backend provides it (lowercased)
  verified: "pending" | "verified" | "rejected";
  createdBy?: string | { _id: string; email?: string; name?: string };
  createdAt: string;
  updatedAt: string;
  notes?: string;
  deletedAt?: string | null; // soft delete marker
}

export type ManagedSkill = ManagedItem;
export type ManagedJobTitle = ManagedItem;
export type ManagedQualification = ManagedItem;

export interface ManagedCompany {
  _id: string;
  name: string;
  location?: {
    placeId?: string;
    formattedAddress?: string;
    lat?: number;
    lng?: number;
    country?: string;
    region?: string;
    city?: string;
    postalCode?: string;
    street?: string;
    components?: {
      street?: string;
      city?: string;
      region?: string;
      country?: string;
      postalCode?: string;
    };
    source?: string;
  } | null;
  industry?: string;
  verified: "pending" | "verified" | "rejected";
  ownerId?: string;
  ownerEmail?: string;
  ownerName?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  description?: string;
  size?: string;
}

// Recruiter Management Types
export interface AdminRecruiter {
  _id: string;
  clerkUserId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  phone?: string;
  company?: string;
  position?: string;
  role: "recruiter" | "admin" | "superadmin";
  subscription?: {
    planType: "free" | "starter" | "premium";
    status: "active" | "expired" | "inactive" | "cancelled" | "on_hold";
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    jobPostsUsed: number;
    jobPostsLimit: number;
    autoRenew: boolean;
  };
  stats?: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
  };
  createdAt: string;
  lastActive?: string;
  isEmailVerified?: boolean;
  basicInfoProvided?: boolean;
}

export interface PlanAnalyticsSummary {
  totalRevenue: number;
  totalActiveSubscriptions: number;
  totalTransactions: number;
  mrr: number;
  churnRate: number;
  paymentSuccessRate: number;
  avgSubscriptionValue: number;
  ltv: number;
}

export interface PlanPerformance {
  planId: string;
  planName: string;
  price: number;
  activeSubscriptions: number;
  revenue: number;
  transactions: number;
  conversionRate: number;
}

export interface SubscriptionStatusDistribution {
  status: string;
  count: number;
}

export interface RevenueOverTime {
  date: string;
  revenue: number;
  count: number;
}

export interface NewSubscriptionsOverTime {
  date: string;
  count: number;
}

export interface PlanAnalytics {
  summary: PlanAnalyticsSummary;
  planPerformance: PlanPerformance[];
  subscriptionStatusDistribution: SubscriptionStatusDistribution[];
  revenueOverTime: RevenueOverTime[];
  newSubscriptionsOverTime: NewSubscriptionsOverTime[];
  topPlans: PlanPerformance[];
}

export interface TicketMessage {
  sender: "user" | "admin";
  senderName: string;
  senderId: string;
  message: string;
  timestamp: string;
  attachments?: string[];
}

export interface SupportTicket {
  _id: string;
  userId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    subscription?: {
      isActive: boolean;
      plan?: string;
      startDate?: string;
      endDate?: string;
    };
    subscriptionPlan?: {
      name: string;
      price: number;
    };
  };
  subject: string;
  category:
    | "job-search"
    | "profile"
    | "application"
    | "technical"
    | "billing"
    | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in-progress" | "waiting-response" | "resolved" | "closed";
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// Dashboard Metrics Types
export interface DashboardTotals {
  totalCandidates: number;
  totalRecruiters: number;
  totalEmployers: number; // Will be 0 until employer role is implemented
  totalJobs: number;
  totalResumes: number;
  totalRevenue: number; // in paise
}

export interface DashboardFiltered {
  newCandidates: number;
  newRecruiters: number;
  newEmployers: number; // Will be 0 until employer role is implemented
  newJobs: number;
  newResumes: number;
  newRevenue: number; // in paise
}

export type DateFilterPreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last15days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "3months"
  | "6months"
  | "custom";

export interface DateRange {
  from: string; // ISO date string
  to: string; // ISO date string
}

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  createdBy?: string | { _id: string; email?: string };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface OutsideLink {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  bannerImage?: string;
  outsideLink: string;
  clickCount: number;
  defaultCount?: number; // Default application count (8-25) stored in database
  submissionCount?: number; // Total number of submissions for this link
  tags?: Tag[]; // Array of tags associated with this link
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OutsideLinkClickStats {
  totalClicks: number;
  uniqueClicks: number;
  clicksByDate: Array<{ date: string; count: number }>;
}

export interface OutsideLinkSubmissionAdmin {
  _id: string;
  outsideLinkId: string;
  email: string;
  phone: string | null;
  resumeUrl: string | null;
  submittedAt: string;
  ipAddress?: string;
}

export interface Certificate {
  _id: string;
  studentName: string;
  course: string;
  batch: string;
  serialNumber: string;
  certificateImageUrl: string;
  studentPhotoUrl: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}
