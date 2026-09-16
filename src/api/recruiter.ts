// src/api/recruiter.ts
import {
  Job,
  Company,
  CreateJobPayload,
  CreateCompanyPayload,
  Application,
  Candidate,
  RecruiterStats,
  RecruiterUser,
  SearchFilters,
  PaginatedJobs,
  PaginatedApplications,
  PaginatedCandidates,
  PaginatedCompanies,
  GenerateJobResponse,
  ReferralStats,
} from "@/types/recruiter";
import { PipelineResponse, PipelineStatusTracking } from "@/types/pipeline";

import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";

/**
 * Recruiter API client base
 */
const API_BASE = apiBaseUrl;

/** Custom error type */
export class RecruiterAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "RecruiterAPIError";
  }
}

/**
 * Create axios client for recruiter endpoints.
 * Token is automatically handled via getAuthToken.
 */
const client = createApiClient({
  baseURL: API_BASE,
  getAuthToken,
  timeoutMs: 20000,
  onAuthError: () => {
    // Clear cached tokens when unauthorized — optional redirect can be added
    clearTokenCache();
    console.warn("Recruiter API unauthorized — token cache cleared");
  },
});

/**
 * Low-level helper to perform HTTP requests
 * Handles both meta and pagination fields from backend
 */
const request = async <T = any>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  opts?: {
    data?: any;
    params?: any;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  }
): Promise<T> => {
  try {
    const config: any = { method, url };
    if (opts?.data) config.data = opts.data;
    if (opts?.params) config.params = opts.params;
    if (opts?.signal) config.signal = opts.signal;
    if (opts?.headers) config.headers = opts.headers;

    const res = await client.request(config);
    const payload = res.data;

    // Handle double-wrapped with 'pagination': { success: true, data: { data: [], pagination: {} } }
    if (
      payload?.data &&
      typeof payload.data === "object" &&
      payload.data.pagination &&
      Array.isArray(payload.data.data)
    ) {
      return {
        data: payload.data.data,
        pagination: payload.data.pagination,
      } as T;
    }

    // Handle double-wrapped with 'meta': { success: true, data: { data: [], meta: {} } }
    if (
      payload?.data &&
      typeof payload.data === "object" &&
      payload.data.meta &&
      Array.isArray(payload.data.data)
    ) {
      return {
        data: payload.data.data,
        pagination: payload.data.meta,
      } as T;
    }

    // Handle single-wrapped with 'pagination': { data: [], pagination: {} }
    if (
      payload &&
      typeof payload === "object" &&
      payload.pagination &&
      Array.isArray(payload.data)
    ) {
      return payload as T;
    }

    // Handle single-wrapped with 'meta': { data: [], meta: {} }
    if (
      payload &&
      typeof payload === "object" &&
      payload.meta &&
      Array.isArray(payload.data)
    ) {
      return {
        data: payload.data,
        pagination: payload.meta,
      } as T;
    }

    // Handle simple wrapped response: { success: true, data: <anything> }
    // Extract just the data field for non-paginated responses
    if (
      payload &&
      typeof payload === "object" &&
      "data" in payload &&
      !payload.pagination &&
      !payload.meta
    ) {
      return payload.data as T;
    }

    return payload as T;
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    const message = err?.message ?? err?.response?.data?.message ?? String(err);
    throw new RecruiterAPIError(message, status);
  }
};

/* ========== User / Self ========== */
export const getRecruiterMe = async (): Promise<{ user: RecruiterUser }> => {
  // request function already unwraps the response
  return request<{ user: RecruiterUser }>("get", "/recruiter/me");
};

/* ========== Dashboard Stats ========== */
export const getRecruiterStats = async (): Promise<RecruiterStats> => {
  return request("get", "/recruiter/stats");
};

/* ========== Jobs ========== */
export const getJobs = async (
  page = 1,
  limit = 10,
  signal?: AbortSignal
): Promise<PaginatedJobs> => {
  return request("get", "/recruiter/jobs", { params: { page, limit }, signal });
};

export const getJobDetails = async (
  id: string,
  signal?: AbortSignal
): Promise<Job> => {
  return request<Job>("get", `/recruiter/jobs/${id}`, { signal });
};

export const updateRecruiterProfile = async (
  profileData: Partial<RecruiterUser>
): Promise<RecruiterUser> => {
  // request function already unwraps the response
  return request<RecruiterUser>("put", "/recruiter/me", {
    data: profileData,
  });
};

export const createJob = async (jobData: CreateJobPayload): Promise<Job> => {
  return request("post", "/recruiter/jobs", { data: jobData });
};

export const updateJob = async (
  id: string,
  jobData: Partial<CreateJobPayload>
): Promise<Job> => {
  return request("put", `/recruiter/jobs/${id}`, { data: jobData });
};

export const deleteJob = async (id: string): Promise<{ success: boolean }> => {
  return request("delete", `/recruiter/jobs/${id}`);
};

/* ========== Applications ========== */
export const getApplications = async (
  jobId?: string,
  page = 1,
  limit = 10
): Promise<PaginatedApplications> => {
  const params: any = { page, limit };
  if (jobId) params.jobId = jobId;
  return request("get", "/recruiter/applications", { params });
};

export const updateApplicationStatus = async (
  applicationId: string,
  status: Application["status"]
): Promise<Application> => {
  return request("put", `/recruiter/applications/${applicationId}/status`, {
    data: { status },
  });
};

/* ========== Candidates ========== */
export const searchCandidates = async (
  filters: SearchFilters = {},
  page = 1,
  limit = 10
): Promise<PaginatedCandidates> => {
  const params = {
    page,
    limit,
    ...Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(",") : String(value),
      ])
    ),
  };
  return request("get", "/recruiter/candidates", { params });
};

export const getCandidateResume = async (
  candidateId: string
): Promise<{ resumeUrl: string }> => {
  return request("get", `/candidates/${candidateId}/resume`);
};

/* ========== Company Management ========== */
export const getCompanies = async (
  page = 1,
  limit = 10
): Promise<PaginatedCompanies> => {
  return request("get", "/recruiter/companies", { params: { page, limit } });
};

export const createCompany = async (
  companyData: CreateCompanyPayload
): Promise<Company> => {
  return request("post", "/recruiter/companies", { data: companyData });
};

export const updateCompany = async (
  id: string,
  companyData: Partial<CreateCompanyPayload>
): Promise<Company> => {
  return request("put", `/recruiter/companies/${id}`, { data: companyData });
};

export const deleteCompany = async (
  id: string
): Promise<{ success: boolean }> => {
  return request("delete", `/recruiter/companies/${id}`);
};

/* ========== Generate Job (AI) ========== */
export const generateJobDetails = async (payload: {
  title: string;
  companyId: string;
  experienceYears: number;
}): Promise<GenerateJobResponse> => {
  // request function already unwraps the response
  return request<GenerateJobResponse>(
    "post",
    "/recruiter/generate-job-details",
    {
      data: payload,
    }
  );
};

/* ========== Referrals ========== */
export const getMyReferralCode = async (): Promise<{
  referralCode: string;
  referralUrl: string;
}> => {
  return request("get", "/recruiter/referral/my-code");
};

export const getReferralStats = async (): Promise<ReferralStats> => {
  const res = await request<any>("get", "/recruiter/referral/stats");
  return res.stats ?? res;
};

export const claimReferralReward = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  return request("post", "/recruiter/referral/claim");
};

export const linkReferralCode = async (
  referralCode: string
): Promise<{ success?: boolean; message?: string; error?: any }> => {
  return request("post", "/recruiter/referral/link", {
    data: { referralCode },
  });
};

/* ========== Pipelines ========== */

/**
 * List all pipelines for the current recruiter
 */
export const listPipelines = async (filters?: {
  status?: string;
  jobId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<{
  pipelines: PipelineResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  return request("get", "/recruiter/pipelines", { params: filters });
};

/**
 * Create a new hiring pipeline
 */
export const createPipeline = async (payload: {
  jobId: string;
  sources?: {
    database?: boolean;
    publicLink?: boolean;
    blogs?: boolean;
  };
  settings?: {
    showAfterHours?: number;
    maxTopCandidates?: number;
    autoMatching?: boolean;
    emailNotifications?: boolean;
  };
}): Promise<PipelineResponse> => {
  return request("post", "/recruiter/pipelines", { data: payload });
};

/**
 * Start a pipeline
 */
export const startPipeline = async (
  pipelineId: string
): Promise<PipelineResponse> => {
  return request("post", `/recruiter/pipelines/${pipelineId}/start`);
};

/**
 * Get pipeline details
 */
export const getPipeline = async (
  pipelineId: string
): Promise<PipelineResponse> => {
  return request("get", `/recruiter/pipelines/${pipelineId}`);
};

/**
 * Get pipeline status (real-time updates)
 */
export const getPipelineStatus = async (
  pipelineId: string
): Promise<PipelineStatusTracking> => {
  return request("get", `/recruiter/pipelines/${pipelineId}/status`);
};

/**
 * Get pipeline by job ID
 */
export const getPipelineByJobId = async (
  jobId: string
): Promise<PipelineResponse | null> => {
  return request("get", `/recruiter/jobs/${jobId}/pipeline`);
};

/**
 * Start matching applications to job (after 24 hours)
 */
export const startMatching = async (
  pipelineId: string
): Promise<{
  matched: number;
  total: number;
}> => {
  return request("post", `/recruiter/pipelines/${pipelineId}/start-matching`);
};

/**
 * Get matched applications sorted by score
 */
export const getMatchedApplications = async (
  pipelineId: string,
  options?: {
    limit?: number;
    minScore?: number;
  }
): Promise<import("@/types/pipeline").PipelineApplication[]> => {
  return request(
    "get",
    `/recruiter/pipelines/${pipelineId}/matched-applications`,
    {
      params: options,
    }
  );
};

/**
 * Get resume data for a specific pipeline application
 * @param pipelineId - Pipeline ID
 * @param applicationId - Application ID
 * @returns Resume data including structuredData and cleanedText
 */
export const getApplicationResumeData = async (
  pipelineId: string,
  applicationId: string
): Promise<{
  resumeUrl: string;
  coverLetter: string;
  structuredData: any;
  cleanedText: string;
  status: string;
  fileName?: string;
  fileType?: string;
  uploadedAt?: string;
}> => {
  return request(
    "get",
    `/recruiter/pipelines/${pipelineId}/applications/${applicationId}/resume`
  );
};
