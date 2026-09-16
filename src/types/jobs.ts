import type { Location } from "./location";

export type ApplicationStatus =
  | "applied"
  | "screened"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface ViewerApplication {
  _id: string;
  status: ApplicationStatus;
  appliedAt?: string | null;
  rejectionReason?: string | null;
  recruiterFeedback?: string | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  hiredAt?: string | null;
}

export interface CompanySummary {
  _id: string;
  name: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: "startup" | "small" | "medium" | "large" | "enterprise";
  // Added fields that your backend populates and the UI expects:
  description?: string;
  email?: string;
  location?: Location | null;
}

export interface Job {
  _id: string;
  title: string;
  titleId?: string;
  companyId: string | CompanySummary; // sometimes populated as object in your responses
  companyName: string;
  company?: CompanySummary;
  type: "full-time" | "part-time" | "contract" | "internship";
  status: "active" | "paused" | "closed";
  // your DB uses experienceYears; your frontend expects experienceMin/Max — keep both optional
  experienceYears?: number;
  experienceMin?: number;
  experienceMax?: number;
  summary: string;
  description: string;
  requirements: string[];
  qualifications: string[];
  salary: {
    min?: number;
    max?: number;
    currency?: string;
  };
  location?: Location;
  remote?: boolean;
  postedBy: string;
  postedAt?: string;
  createdAt?: string;
  expiresAt?: string;
  views?: number;
  applicationCount?: number;

  // compatibility: older UI used alreadyApplied; newer API returns viewerApplied/viewerApplication
  alreadyApplied?: boolean;
  viewerApplied?: boolean;
  viewerApplication?: ViewerApplication | null;

  // any other optional runtime fields you sometimes include
  distanceKm?: number;
}

export interface JobSearchFilters {
  q?: string;
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
  companyId?: string;
  type?: string[];
  remote?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  placeId?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  sort?: "relevance" | "newest" | "nearest" | "salary-high" | "salary-low";
  page?: number;
  limit?: number;
}

export interface JobApplication {
  _id: string;
  jobId: string;
  candidateId: string;
  resumeId?: string;
  resumeUrl?: string;
  coverLetter?: string;
  attachments?: Array<{
    url: string;
    name: string;
    size?: number;
    mime?: string;
  }>;
  status:
    | "applied"
    | "screened"
    | "interview"
    | "offer"
    | "hired"
    | "rejected"
    | "withdrawn";
  appliedAt: string;
  stageUpdatedAt: string;
  hiredAt?: string;
  rejectionReason?: string;
  recruiterFeedback?: string;
  qualityScore?: "high" | "medium" | "low";
  source?: string;
  timeline: Array<{
    actorId: string;
    action: string;
    message?: string;
    createdAt: string;
  }>;
  job: {
    _id: string;
    title: string;
    companyName: string;
    company?: {
      name: string;
      logo?: string;
    };
  };
}

export interface ApplyJobData {
  resumeId?: string;
  resumeFile?: File;
  coverLetter?: string;
  attachments?: File[];
}

export interface JobAnalytics {
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  applicationsByMonth: Array<{
    month: string;
    count: number;
  }>;
  averageResponseTime: number;
  topCompanies: Array<{
    name: string;
    applications: number;
  }>;
  topSkills: Array<{
    skill: string;
    count: number;
  }>;
}
