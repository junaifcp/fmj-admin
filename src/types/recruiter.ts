import type { EducationLevel } from "@/constants/educationOptions";

export interface Company {
  _id: string;
  name: string;
  logo?: string;
  website?: string;
  email?: string;
  description?: string;
  industry?: string;
  size?: "startup" | "small" | "medium" | "large" | "enterprise";
  location?: import("@/types/location").Location;
  verified: "pending" | "approved" | "rejected";
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  _id: string;
  title: string;
  titleId?: string;
  experienceYears: number;
  summary: string;
  description: string;
  requirements: string[];
  qualifications: EducationLevel[];
  salary: {
    min?: number;
    max?: number;
    currency?: string;
  };
  location?: import("@/types/location").Location;
  companyId: Company;
  companyName?: string;
  company?: Company;
  type: "full-time" | "part-time" | "contract" | "internship";
  status: "active" | "paused" | "closed";
  postedBy: string;
  createdAt: string;
  updatedAt: string;
  applicationCount?: number;
  canEdit?: boolean;
  useCompanyLocation?: boolean;
  genderPreference?: string;
  ageMin?: number;
  ageMax?: number;
  otherAllowances?: string[];
  skillIds?: string[];
  fieldOfStudyIds?: string[];
  companyLocation?: string;
  // Populated fields from backend
  skills?: Array<{
    _id: string;
    name: string;
    normalized?: string;
    verified?: string;
  }>;
  fieldOfStudies?: Array<{
    _id: string;
    name: string;
    normalized?: string;
    verified?: string;
  }>;
}

export interface CreateJobPayload {
  title: string;
  titleId?: string;
  experienceYears: number;
  summary: string;
  description: string;
  requirements: string[];
  qualifications: EducationLevel[];
  salary: {
    min?: number;
    max?: number;
    currency?: string;
  };
  location?: import("@/types/location").Location;
  companyId: string;
  type: "full-time" | "part-time" | "contract" | "internship";
  useCompanyLocation?: boolean;
  genderPreference?: string;
  ageMin?: number;
  ageMax?: number;
  otherAllowance?: string;
  fieldOfStudies?: string[];
}

export interface CreateCompanyPayload {
  name: string;
  logo?: string;
  website?: string;
  email?: string;
  description?: string;
  industry?: string;
  size?: "startup" | "small" | "medium" | "large" | "enterprise";
  location?: import("@/types/location").Location;
  phone?: string;
}

export interface Application {
  _id: string;
  jobId: string;
  candidateId: string;
  resumeId?: string;
  coverLetter?: string;
  status: "pending" | "reviewed" | "shortlisted" | "rejected" | "hired";
  appliedAt: string;
  candidate: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    profileImageUrl?: string;
  };
  job: {
    _id: string;
    title: string;
    company: string;
  };
}

export interface Candidate {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  profileImageUrl?: string;
  skills?: string[];
  experience?: number;
  location?: string | import("@/types/location").Location;
  resumeCount: number;
  lastActive?: string;
}

export interface RecruiterStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  totalCandidates: number;
  recentApplications: Application[];
}

export interface RecruiterUser {
  _id: string;
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: "recruiter";
  company?: string;
  position?: string;
  createdAt: string;
  phone?: string;
  bio?: string;
  updatedAt?: string;
  basicInfoProvided?: boolean;
  isEmailVerified?: boolean;
}

export interface SearchFilters {
  skills?: string[];
  experience?: number;
  location?: string;
  availability?: "available" | "looking" | "all";
}

export interface PaginatedJobs {
  data: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedApplications {
  data: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedCandidates {
  data: Candidate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedCompanies {
  data: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// types near top or in your types/recruiter file if you prefer
export interface GenerateJobResponse {
  summary?: string;
  description?: string;
  requirements?: string[];
  qualifications?: EducationLevel[];
  fieldOfStudies?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  type?: "full-time" | "part-time" | "contract" | "internship";
  useCompanyLocation?: boolean;
  location?: any; // prefer a stricter Location type if you have one
  genderPreference?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  otherAllowances?: string[];
  hasOtherAllowances?: boolean;
  // include additional fields if your backend returns more
}

export interface ReferralStats {
  referralCode: string;
  referralUrl: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  creditsEarned: number;
  creditsUsed: number;
  availableCredits: number;
  canClaimReward: boolean;
  referrals: Array<{
    _id: string;
    referredUser: {
      firstName?: string;
      lastName?: string;
      email: string;
    };
    status: "pending" | "completed" | "rewarded";
    firstPaymentDate?: string;
    rewardGrantedDate?: string;
    createdAt: string;
  }>;
}
