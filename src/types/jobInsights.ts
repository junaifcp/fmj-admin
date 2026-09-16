// Job Insights and Analytics Types

import type { Location } from "@/types/location";

export interface JobInsights {
  applicantsTotal: number;
  applicantsNew: number;
  applicantsNew7Days: number;
  applicantsNew30Days: number;
  funnel: {
    applied: number;
    screened: number;
    interview: number;
    offer: number;
    hired: number;
  };
  funnelConversions: {
    appliedToScreened: number;
    screenedToInterview: number;
    interviewToOffer: number;
    offerToHired: number;
    overallConversion: number;
  };
  timeToHireAvgDays: number;
  views: number;
  applies: number;
  applicationRate: number; // applies/views ratio
  applicationsTimeseries: Array<{
    date: string;
    count: number;
  }>;
  sources: Array<{
    source: string;
    count: number;
    conversion: number;
  }>;
  topSkills: Array<{
    skill: string;
    count: number;
  }>;
  candidateQualityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  benchmarks: {
    companyAvgTimeToHire: number;
    industryAvgTimeToHire: number;
    companyAvgApplicationRate: number;
    industryAvgApplicationRate: number;
  };
  traffic: {
    impressions: number;
    clicks: number;
    ctr: number;
    ctrTimeseries: Array<{
      date: string;
      impressions: number;
      clicks: number;
      ctr: number;
    }>;
  };
}

// import your Location type

/** Skill item as returned by API */
export interface CandidateSkill {
  _id?: string; // resume/skill mapping id (optional)
  skill?: string; // skill ObjectId (string) — e.g. "68d8f2..."
  name?: string; // skill display name (may be empty string)
  proficiency?: number; // 0-100 (optional)
}

/** Note item shape returned by API */
export interface CandidateNote {
  _id?: string;
  id?: string; // keep alias if frontend expects `id`
  content: string;
  createdAt: string;
  createdBy?: string;
}

/** Timeline entry shape returned by API */
export interface CandidateTimelineEntry {
  _id?: string;
  id?: string;
  action: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
}

export interface CandidateWithDetails {
  _id: string; // application record id
  candidateId?: string; // user id (present in your response)
  firstName?: string;
  lastName?: string;
  email: string;
  profileImageUrl?: string | null;
  skills?: CandidateSkill[]; // changed from string[] to object[]
  experience?: number | null; // may be missing
  location?: Location | null; // object (not a plain string)
  appliedAt: string; // application timestamp (ISO)
  source: string;
  stage: "applied" | "screened" | "interview" | "offer" | "hired" | "rejected";
  qualityScore?: "high" | "medium" | "low" | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  notes?: CandidateNote[];
  timeline?: CandidateTimelineEntry[];
}

export interface JobNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  private: boolean;
}

export interface JobAction {
  action: "pause" | "resume" | "duplicate" | "promote" | "close" | "reopen";
  params?: Record<string, any>;
}

export interface CandidateAction {
  action: "advance" | "reject" | "message" | "note" | "schedule";
  candidateIds: string[];
  params?: {
    newStage?: CandidateWithDetails["stage"];
    message?: string;
    noteContent?: string;
    scheduleDate?: string;
    scheduleType?: "phone" | "video" | "onsite";
  };
}

export interface DateRangeFilter {
  from: string;
  to: string;
  preset?: "7d" | "30d" | "90d" | "custom";
}

export interface CandidateFilters {
  source?: string;
  stage?: CandidateWithDetails["stage"];
  qualityScore?: CandidateWithDetails["qualityScore"];
  experience?: {
    min?: number;
    max?: number;
  };
  skills?: string[];
  location?: string;
}

export interface ExportOptions {
  format: "csv" | "excel" | "pdf";
  includePrivateNotes?: boolean;
  dateRange?: DateRangeFilter;
  filters?: CandidateFilters;
}
