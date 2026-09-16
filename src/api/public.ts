// src/api/public.ts
// Public API client for unauthenticated application flow

import { createApiClient } from "./apiClient";
import { apiBaseUrl } from "@/config/env";

/**
 * Public API client base (no authentication required)
 */
const API_BASE = apiBaseUrl;

/**
 * Create axios client for public endpoints (no auth token)
 */
const client = createApiClient({
  baseURL: API_BASE,
  // No getAuthToken - public endpoints don't require authentication
  timeoutMs: 30000, // Longer timeout for file uploads
});

/**
 * Helper to unwrap axios response.data with typing
 */
async function unwrap<T>(p: Promise<any>): Promise<T> {
  const res = await p;
  // Backend returns { success: true, data: ... } or direct data
  return res.data?.data ?? res.data;
}

/**
 * Request helper for public API
 */
async function request<T>(
  method: "get" | "post" | "put" | "delete",
  url: string,
  options?: {
    data?: any;
    params?: any;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const config: any = {
    method,
    url,
    ...(options?.params && { params: options.params }),
    ...(options?.headers && { headers: options.headers }),
  };

  if (options?.data) {
    if (options.data instanceof FormData) {
      // Don't set Content-Type for FormData, let browser set it with boundary
      config.data = options.data;
    } else {
      config.data = options.data;
    }
  }

  try {
    return unwrap<T>(client.request(config));
  } catch (error: any) {
    // Preserve the full error response structure for proper error handling
    // This ensures error.response.data is available in catch blocks
    if (error?.response) {
      // Attach the full response data to the error for easier access
      error.responseData = error.response.data;
    }
    throw error;
  }
}

export interface JobDetails {
  _id: string;
  title: string;
  companyId: string;
  location: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  type?: string;
  status: string;
}

export interface PipelineInfo {
  _id: string;
  status: string;
  publicLink?: {
    uniqueId: string;
    url: string;
    isActive: boolean;
  };
}

export interface JobByPublicLinkResponse {
  job: JobDetails;
  pipeline: PipelineInfo;
  isActive: boolean;
}

export interface InitiateApplicationResponse {
  temporaryUploadId: string;
  otpSent: boolean;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
}

export interface VerifyOTPResponse {
  verified: boolean;
  message: string;
}

export interface UploadResumeResponse {
  resumeUrl: string;
  parsingStatus: string;
}

export interface ApplicationStatusResponse {
  temporaryUpload: {
    _id: string;
    email: string;
    name?: string;
    phone?: string;
    emailVerified: boolean;
    fileUrl?: string;
    status: string;
    currentStep?: number;
  };
  canSubmit: boolean;
}

export interface SubmitApplicationResponse {
  applicationId: string;
  message: string;
}

/**
 * Get job details by public link uniqueId
 * GET /api/public/apply/:uniqueId
 */
export const getJobByPublicLink = async (
  uniqueId: string
): Promise<JobByPublicLinkResponse> => {
  return request<JobByPublicLinkResponse>("get", `/public/apply/${uniqueId}`);
};

/**
 * Initiate application - create TemporaryResumeUpload and send OTP
 * POST /api/public/apply/:uniqueId/initiate
 */
export const initiateApplication = async (
  uniqueId: string,
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
  }
): Promise<InitiateApplicationResponse> => {
  return request<InitiateApplicationResponse>(
    "post",
    `/public/apply/${uniqueId}/initiate`,
    {
      data: personalInfo,
    }
  );
};

/**
 * Send OTP email
 * POST /api/public/temporary-resume/:id/send-otp
 */
export const sendOTP = async (
  temporaryUploadId: string
): Promise<SendOTPResponse> => {
  return request<SendOTPResponse>(
    "post",
    `/public/temporary-resume/${temporaryUploadId}/send-otp`
  );
};

/**
 * Verify OTP code
 * POST /api/public/temporary-resume/:id/verify-otp
 */
export const verifyOTP = async (
  temporaryUploadId: string,
  otpCode: string
): Promise<VerifyOTPResponse> => {
  return request<VerifyOTPResponse>(
    "post",
    `/public/temporary-resume/${temporaryUploadId}/verify-otp`,
    {
      data: { otpCode },
    }
  );
};

/**
 * Upload resume
 * POST /api/public/temporary-resume/:id/upload-resume
 */
export const uploadResume = async (
  temporaryUploadId: string,
  resumeFile: File
): Promise<UploadResumeResponse> => {
  const formData = new FormData();
  formData.append("resume", resumeFile);

  return request<UploadResumeResponse>(
    "post",
    `/public/temporary-resume/${temporaryUploadId}/upload-resume`,
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

/**
 * Get application status
 * GET /api/public/temporary-resume/:id
 */
export const getApplicationStatus = async (
  temporaryUploadId: string
): Promise<ApplicationStatusResponse> => {
  return request<ApplicationStatusResponse>(
    "get",
    `/public/temporary-resume/${temporaryUploadId}`
  );
};

/**
 * Submit application
 * POST /api/public/temporary-resume/:id/submit
 */
export const submitApplication = async (
  temporaryUploadId: string,
  coverLetter?: string
): Promise<SubmitApplicationResponse> => {
  return request<SubmitApplicationResponse>(
    "post",
    `/public/temporary-resume/${temporaryUploadId}/submit`,
    {
      data: { coverLetter },
    }
  );
};
