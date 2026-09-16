// Pipeline and Application Types for Hiring Funnel

export type PipelineStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";
export type ApplicationStatus =
  | "pending"
  | "top-candidate"
  | "shortlisted"
  | "rejected"
  | "hired"
  | "reviewing";
export type ApplicationSource =
  | "database"
  | "public-link"
  | "blog"
  | "website"
  | "website-unregistered";

export interface Pipeline {
  _id: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  recruiterId: string;
  status: PipelineStatus;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  totalApplications: number;
  shortlisted: number;
  hired: number;
  rejected: number;
  statusBreakdown?: {
    pending: number;
    reviewing: number;
    "top-candidate": number;
    shortlisted: number;
    rejected: number;
    hired: number;
    withdrawn: number;
  };
  sources: {
    database: boolean;
    publicLink: boolean;
    blogs: boolean;
  };
  publicLink?: {
    uniqueId: string;
    url: string;
    isActive: boolean;
    expiresAt?: string;
    maxApplications?: number;
  };
  blogs?: Array<{
    blogId: string;
    title: string;
    url: string;
    publishedAt: string;
    applyLink: string;
  }>;
  settings: {
    showAfterHours: number;
    maxTopCandidates: number;
    autoMatching: boolean;
    emailNotifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PipelineApplication {
  _id: string;
  pipelineId: string;
  jobId: string;
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhoto?: string;
  matchingScore: number; // 0-100
  matchingDetails: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    locationMatch: number;
    overallFit: number;
    vectorSimilarity?: number;
    aiAnalysis?: {
      summary: string;
      strengths: string[];
      concerns: string[];
      recommendation: "strong" | "moderate" | "weak";
    };
  };
  status: ApplicationStatus;
  position?: number; // 1-5 for top candidates
  isVisible: boolean;
  appliedAt: string;
  reviewedAt?: string;
  shortlistedAt?: string;
  rejectedAt?: string;
  hiredAt?: string;
  source: ApplicationSource;
  sourceDetails?: {
    blogId?: string;
    pipelineId?: string;
    publicLinkId?: string;
    referrerUrl?: string;
    utmParams?: Record<string, string>;
  };
  skills: string[];
  experience: number; // years
  location: string;
  notes?: Array<{
    note: string;
    addedBy: string;
    addedAt: string;
  }>;
  tags?: string[];
  emails?: Array<{
    emailId: string;
    type: "shortlist" | "rejection" | "interview" | "offer" | "custom";
    sentAt: string;
    subject: string;
    body: string;
    status: "sent" | "delivered" | "opened" | "clicked" | "bounced";
  }>;
  interview?: {
    scheduledAt: string;
    googleMeetLink: string;
    calendarEventId: string;
    status: "scheduled" | "completed" | "cancelled" | "rescheduled";
    notes?: string;
    feedback?: string;
  };
  resumeData?: {
    resumeUrl: string;
    coverLetter: string;
    structuredData: any;
    cleanedText: string;
    status: string;
    fileName?: string;
    fileType?: string;
    uploadedAt?: string;
  };
}

export interface CandidateProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  bio?: string;
  location?: string;
  skills: Array<{
    _id: string;
    name: string;
    level?: string;
    proficiency?: number;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    isPresent?: boolean;
    achievements?: string[];
    responsibilities?: string[];
  }>;
  experience: Array<{
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    isPresent?: boolean;
    description?: string;
    responsibilities?: string[];
    achievements?: string[];
  }>;
  resumeUrl?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
}

export interface MatchingScores {
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  locationMatch: number;
  vectorSimilarity?: number;
}

export interface AIAnalysis {
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendation: "strong" | "moderate" | "weak";
}

export interface PipelineStatusTracking {
  database: {
    found: number;
    emailsSent: number;
    applications: number;
  };
  publicLink: {
    clicks: number;
    applications: number;
    link?: string;
  };
  blog: {
    status: "creating" | "published" | "failed";
    publishedAt?: string;
    link?: string;
  };
  timeRemaining: number; // seconds
  startedAt: string;
}

export interface PipelineResponse {
  _id: string;
  jobId: string;
  jobTitle?: string;
  companyId?: string;
  companyName?: string;
  recruiterId: string;
  status: PipelineStatus;
  sources: { database: boolean; publicLink: boolean; blogs: boolean };
  publicLink: {
    uniqueId?: string;
    url?: string;
    isActive: boolean;
    expiresAt?: string;
    maxApplications?: number;
  };
  blogs: Array<{
    blogId: string;
    title?: string;
    url?: string;
    publishedAt?: string;
    applyLink?: string;
  }>;
  settings: {
    showAfterHours: number;
    maxTopCandidates: number;
    autoMatching: boolean;
    emailNotifications: boolean;
  };
  stats: {
    totalApplications: number;
    matchedApplications: number;
    shortlistedCount: number;
    rejectedCount: number;
    hiredCount: number;
    interviewScheduledCount: number;
  };
  statusBreakdown?: {
    pending: number;
    reviewing: number;
    "top-candidate": number;
    shortlisted: number;
    rejected: number;
    hired: number;
    withdrawn: number;
  };
  job?: {
    _id: string;
    title: string;
    status?: string;
    company?: {
      _id: string;
      name: string;
      logo?: string;
    };
  };
  statusTracking?: PipelineStatusTracking;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
