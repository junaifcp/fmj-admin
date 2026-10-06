// src/api/admin.ts
import {
  AdminUser,
  AdminMetrics,
  AdminResume,
  AdminPlan,
  AdminContactMessage,
  AdminAtsResult,
  PaginationResponse,
  AdminAuthResponse,
  ManagedSkill,
  ManagedJobTitle,
  ManagedQualification,
  ManagedCompany,
  AdminRecruiter,
  PlanAnalytics,
  DashboardTotals,
  DashboardFiltered,
  OutsideLink,
  OutsideLinkClickStats,
  OutsideLinkSubmissionAdmin,
  Tag,
  Certificate,
} from "@/types/admin";

import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";

/**
 * Build admin API base URL (centralized configuration)
 */
export const API_BASE_ADMIN = `${apiBaseUrl.replace(/\/$/, "")}/admin`;

/**
 * Create a per-module axios client. Uses centralized token getter and clears token cache on auth error.
 */
const client = createApiClient({
  baseURL: API_BASE_ADMIN,
  getAuthToken,
  onAuthError: () => {
    clearTokenCache();
    console.warn("Admin API: unauthorized — token cache cleared");
  },
  timeoutMs: 20000,
});

/**
 * Small helper to unwrap response.data with typing
 * Handles both meta and pagination fields from backend
 */
async function unwrap<T>(p: Promise<any>): Promise<T> {
  const res = await p;
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
}

/**
 * Helper for requests with optional per-call token and signal.
 * We use `any` for config to avoid Axios header typing friction.
 */
const get = <T = any>(
  url: string,
  opts?: { signal?: AbortSignal; token?: string; params?: any }
) =>
  unwrap<T>(
    client.get(url, {
      params: opts?.params,
      signal: opts?.signal,
      // inject per-call token if provided
      ...(opts?.token
        ? { headers: { Authorization: `Bearer ${opts.token}` } as any }
        : {}),
    } as any)
  );

const post = <T = any>(
  url: string,
  body?: any,
  opts?: { signal?: AbortSignal; token?: string; params?: any }
) =>
  unwrap<T>(
    client.post(url, body, {
      params: opts?.params,
      signal: opts?.signal,
      ...(opts?.token
        ? { headers: { Authorization: `Bearer ${opts.token}` } as any }
        : {}),
    } as any)
  );

const put = <T = any>(
  url: string,
  body?: any,
  opts?: { signal?: AbortSignal; token?: string; params?: any }
) =>
  unwrap<T>(
    client.put(url, body, {
      params: opts?.params,
      signal: opts?.signal,
      ...(opts?.token
        ? { headers: { Authorization: `Bearer ${opts.token}` } as any }
        : {}),
    } as any)
  );

const patch = <T = any>(
  url: string,
  body?: any,
  opts?: { signal?: AbortSignal; token?: string; params?: any }
) =>
  unwrap<T>(
    client.patch(url, body, {
      params: opts?.params,
      signal: opts?.signal,
      ...(opts?.token
        ? { headers: { Authorization: `Bearer ${opts.token}` } as any }
        : {}),
    } as any)
  );

const del = <T = any>(
  url: string,
  opts?: { signal?: AbortSignal; token?: string; params?: any }
) =>
  unwrap<T>(
    client.delete(url, {
      params: opts?.params,
      signal: opts?.signal,
      ...(opts?.token
        ? { headers: { Authorization: `Bearer ${opts.token}` } as any }
        : {}),
    } as any)
  );

// ----------------- Endpoints -----------------

// Auth & Role Check
export const getAdminMe = async (opts?: {
  signal?: AbortSignal;
  token?: string;
}): Promise<AdminAuthResponse> => {
  // unwrap function already extracts the data field
  return get<AdminAuthResponse>("/me", opts);
};

// Dashboard Metrics
export const getMetrics = async (
  from?: string,
  to?: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<AdminMetrics> => {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  return get<AdminMetrics>(`/metrics?${params.toString()}`, opts);
};

// Users
export const getUsers = async (
  page = 1,
  limit = 20,
  search = "",
  filters?: {
    location?: { lat: number; lng: number; radius?: number };
    skills?: string[];
    jobTitles?: string[];
    dateRange?: { from?: string; to?: string };
  },
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PaginationResponse<AdminUser>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });

  // Add location filter
  if (filters?.location) {
    params.set("lat", filters.location.lat.toString());
    params.set("lng", filters.location.lng.toString());
    if (filters.location.radius) {
      params.set("radius", filters.location.radius.toString());
    }
  }

  // Add skills filter
  if (filters?.skills && filters.skills.length > 0) {
    params.set("skills", filters.skills.join(","));
  }

  // Add job titles filter
  if (filters?.jobTitles && filters.jobTitles.length > 0) {
    params.set("jobTitles", filters.jobTitles.join(","));
  }

  // Add date range filter
  if (filters?.dateRange?.from) {
    params.set("dateFrom", filters.dateRange.from);
  }
  if (filters?.dateRange?.to) {
    params.set("dateTo", filters.dateRange.to);
  }

  return get<PaginationResponse<AdminUser>>(
    `/users?${params.toString()}`,
    opts
  );
};

export const deleteUser = async (
  userId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`/users/${userId}`, opts);
};

export const exportUsersCSV = async (
  userIds: string[] = [],
  opts?: { signal?: AbortSignal; token?: string }
): Promise<void> => {
  const params = userIds.length > 0 ? `?ids=${userIds.join(",")}` : "";
  // use client.request to allow responseType blob
  const res = await client.request({
    method: "get",
    url: `/users/export${params}`,
    responseType: "blob",
    signal: opts?.signal,
    ...(opts?.token
      ? { headers: { Authorization: `Bearer ${opts.token}` } as any }
      : {}),
  } as any);

  if (res.status === 200) {
    const blob = res.data as Blob;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } else {
    throw new Error(`Export failed: HTTP ${res.status}`);
  }
};

// Resumes
export const getResumes = async (
  page = 1,
  limit = 20,
  search = "",
  template = "",
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PaginationResponse<AdminResume>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(template && { template }),
  });

  return get<PaginationResponse<AdminResume>>(
    `/resumes?${params.toString()}`,
    opts
  );
};

export const deleteResume = async (
  resumeId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`/resumes/${resumeId}`, opts);
};

export const duplicateResume = async (
  resumeId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean; resume: AdminResume }> => {
  return post<{ success: boolean; resume: AdminResume }>(
    `/resumes/${resumeId}/duplicate`,
    undefined,
    opts
  );
};

export const exportResumesCSV = async (
  resumeIds: string[] = [],
  opts?: { signal?: AbortSignal; token?: string }
): Promise<void> => {
  const params = resumeIds.length > 0 ? `?ids=${resumeIds.join(",")}` : "";
  const res = await client.request({
    method: "get",
    url: `/resumes/export${params}`,
    responseType: "blob",
    signal: opts?.signal,
    ...(opts?.token
      ? { headers: { Authorization: `Bearer ${opts.token}` } as any }
      : {}),
  } as any);

  if (res.status === 200) {
    const blob = res.data as Blob;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } else {
    throw new Error(`Export failed: HTTP ${res.status}`);
  }
};

// Plans & Subscriptions
export const getPlans = async (opts?: {
  signal?: AbortSignal;
  token?: string;
}): Promise<AdminPlan[]> => {
  return get<AdminPlan[]>("/plans", opts);
};

export const createPlan = async (
  plan: Partial<AdminPlan>,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<AdminPlan> => {
  return post<AdminPlan>("/plans", plan, opts);
};

export const updatePlan = async (
  planId: string,
  plan: Partial<AdminPlan>,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<AdminPlan> => {
  return put<AdminPlan>(`/plans/${planId}`, plan, opts);
};

export const deletePlan = async (
  planId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`/plans/${planId}`, opts);
};

export const getPlanAnalytics = async (
  from?: string,
  to?: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PlanAnalytics> => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const queryString = params.toString();
  const url = queryString
    ? `/plans/analytics?${queryString}`
    : "/plans/analytics";
  // unwrap function already extracts the data field
  return get<PlanAnalytics>(url, opts);
};

// Dashboard Metrics
export async function getDashboardTotals(opts?: {
  signal?: AbortSignal;
  token?: string;
}): Promise<DashboardTotals> {
  const response = await client.get("/metrics/totals", opts);
  return response.data.data;
}

export async function getDashboardFilteredMetrics(
  from: string,
  to: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<DashboardFiltered> {
  const params = new URLSearchParams();
  params.append("from", from);
  params.append("to", to);
  const response = await client.get(
    `/metrics/filtered?${params.toString()}`,
    opts
  );
  return response.data.data;
}

// Contact Messages
export const getContactMessages = async (
  page = 1,
  limit = 20,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PaginationResponse<AdminContactMessage>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  return get<PaginationResponse<AdminContactMessage>>(
    `/messages?${params.toString()}`,
    opts
  );
};

export const getContactMessage = async (
  messageId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<AdminContactMessage> => {
  return get<AdminContactMessage>(`/messages/${messageId}`, opts);
};

export const deleteContactMessage = async (
  messageId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`/messages/${messageId}`, opts);
};

// ATS Results
export const getAtsResults = async (
  page = 1,
  limit = 20,
  resumeId = "",
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PaginationResponse<AdminAtsResult>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(resumeId && { resumeId }),
  });
  return get<PaginationResponse<AdminAtsResult>>(
    `/ats?${params.toString()}`,
    opts
  );
};

export const getAtsResult = async (
  resultId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<AdminAtsResult> => {
  return get<AdminAtsResult>(`/ats/${resultId}`, opts);
};

// Management endpoints (Skills / Job Titles / Qualifications)
const listEndpoint = <T = any>(
  path: string,
  page = 1,
  limit = 20,
  search = "",
  verified = "",
  opts?: { signal?: AbortSignal; token?: string }
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(verified && { verified }),
  });
  return get<PaginationResponse<T>>(`${path}?${params.toString()}`, opts);
};

const createEndpoint = <T = any>(
  path: string,
  body: any,
  opts?: { signal?: AbortSignal; token?: string }
) => post<T>(path, body, opts);
const updateEndpoint = <T = any>(
  path: string,
  body: any,
  opts?: { signal?: AbortSignal; token?: string }
) => put<T>(path, body, opts);
const deleteEndpoint = <T = any>(
  path: string,
  opts?: { signal?: AbortSignal; token?: string }
) => del<T>(path, opts);
const bulkActionEndpoint = (
  path: string,
  ids: string[],
  action: string,
  opts?: { signal?: AbortSignal; token?: string }
) => post<{ success: boolean }>(path, { ids, action }, opts);

// Skills
export const getSkills = (
  page = 1,
  limit = 20,
  search = "",
  verified = "",
  opts?: { signal?: AbortSignal; token?: string }
) =>
  listEndpoint<ManagedSkill>(
    "/management/skills",
    page,
    limit,
    search,
    verified,
    opts
  );
export const createSkill = (
  skill: { name: string; notes?: string },
  opts?: { signal?: AbortSignal; token?: string }
) => createEndpoint<ManagedSkill>("/management/skills", skill, opts);
export const updateSkill = (
  skillId: string,
  skill: { name?: string; notes?: string },
  opts?: { signal?: AbortSignal; token?: string }
) => updateEndpoint<ManagedSkill>(`/management/skills/${skillId}`, skill, opts);
export const verifySkill = (
  skillId: string,
  verified: "verified" | "pending" | "rejected",
  opts?: { signal?: AbortSignal; token?: string }
) =>
  patch<{ success: boolean }>(
    `/management/skills/${skillId}/verify`,
    { verified },
    opts
  );
export const deleteSkill = (
  skillId: string,
  opts?: { signal?: AbortSignal; token?: string }
) =>
  deleteEndpoint<{ success: boolean }>(`/management/skills/${skillId}`, opts);
export const bulkActionSkills = (
  ids: string[],
  action: "verify" | "unverify" | "delete",
  opts?: { signal?: AbortSignal; token?: string }
) => bulkActionEndpoint("/management/skills/bulk-action", ids, action, opts);

// Job Titles
export const getJobTitles = (
  page = 1,
  limit = 20,
  search = "",
  verified = "",
  opts?: { signal?: AbortSignal; token?: string }
) =>
  listEndpoint<ManagedJobTitle>(
    "/management/job-titles",
    page,
    limit,
    search,
    verified,
    opts
  );
export const createJobTitle = (
  jobTitle: { name: string; notes?: string },
  opts?: { signal?: AbortSignal; token?: string }
) => createEndpoint<ManagedJobTitle>("/management/job-titles", jobTitle, opts);
export const updateJobTitle = (
  jobTitleId: string,
  jobTitle: { name?: string; notes?: string },
  opts?: { signal?: AbortSignal; token?: string }
) =>
  updateEndpoint<ManagedJobTitle>(
    `/management/job-titles/${jobTitleId}`,
    jobTitle,
    opts
  );
export const verifyJobTitle = (
  jobTitleId: string,
  verified: "verified" | "pending" | "rejected",
  opts?: { signal?: AbortSignal; token?: string }
) =>
  patch<{ success: boolean }>(
    `/management/job-titles/${jobTitleId}/verify`,
    { verified },
    opts
  );
export const deleteJobTitle = (
  jobTitleId: string,
  opts?: { signal?: AbortSignal; token?: string }
) =>
  deleteEndpoint<{ success: boolean }>(
    `/management/job-titles/${jobTitleId}`,
    opts
  );
export const bulkActionJobTitles = (
  ids: string[],
  action: "verify" | "unverify" | "delete",
  opts?: { signal?: AbortSignal; token?: string }
) =>
  bulkActionEndpoint("/management/job-titles/bulk-action", ids, action, opts);

// Qualifications
export const getQualifications = (
  page = 1,
  limit = 20,
  search = "",
  verified = "",
  opts?: { signal?: AbortSignal; token?: string }
) =>
  listEndpoint<ManagedQualification>(
    "/management/qualifications",
    page,
    limit,
    search,
    verified,
    opts
  );
export const createQualification = (
  qualification: { name: string; notes?: string },
  opts?: { signal?: AbortSignal; token?: string }
) =>
  createEndpoint<ManagedQualification>(
    "/management/qualifications",
    qualification,
    opts
  );
export const updateQualification = (
  qualificationId: string,
  qualification: { name?: string; notes?: string },
  opts?: { signal?: AbortSignal; token?: string }
) =>
  updateEndpoint<ManagedQualification>(
    `/management/qualifications/${qualificationId}`,
    qualification,
    opts
  );
export const verifyQualification = (
  qualificationId: string,
  verified: "verified" | "pending" | "rejected",
  opts?: { signal?: AbortSignal; token?: string }
) =>
  patch<{ success: boolean }>(
    `/management/qualifications/${qualificationId}/verify`,
    { verified },
    opts
  );
export const deleteQualification = (
  qualificationId: string,
  opts?: { signal?: AbortSignal; token?: string }
) =>
  deleteEndpoint<{ success: boolean }>(
    `/management/qualifications/${qualificationId}`,
    opts
  );
export const bulkActionQualifications = (
  ids: string[],
  action: "verify" | "unverify" | "delete",
  opts?: { signal?: AbortSignal; token?: string }
) =>
  bulkActionEndpoint(
    "/management/qualifications/bulk-action",
    ids,
    action,
    opts
  );

// Recruiter Management
export const getRecruiters = (
  page = 1,
  limit = 20,
  search = "",
  planType = "",
  status = "",
  opts?: { signal?: AbortSignal; token?: string }
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(planType && { planType }),
    ...(status && { status }),
  });
  return get<PaginationResponse<AdminRecruiter>>(
    `/recruiters?${params.toString()}`,
    opts
  );
};

export const getRecruiter = (
  recruiterId: string,
  opts?: { signal?: AbortSignal; token?: string }
) => get<AdminRecruiter>(`/recruiters/${recruiterId}`, opts);

export const exportRecruitersCSV = async (
  recruiterIds: string[] = [],
  opts?: { signal?: AbortSignal; token?: string }
): Promise<void> => {
  const params =
    recruiterIds.length > 0 ? `?ids=${recruiterIds.join(",")}` : "";
  const res = await client.request({
    method: "get",
    url: `/recruiters/export${params}`,
    responseType: "blob",
    signal: opts?.signal,
    ...(opts?.token
      ? { headers: { Authorization: `Bearer ${opts.token}` } as any }
      : {}),
  } as any);

  if (res.status === 200) {
    const blob = res.data as Blob;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recruiters-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } else {
    throw new Error(`Export failed: HTTP ${res.status}`);
  }
};

export const updateRecruiterRole = (
  recruiterId: string,
  role: string,
  opts?: { signal?: AbortSignal; token?: string }
) =>
  put<{ success: boolean; user: AdminRecruiter }>(
    `/recruiters/${recruiterId}/role`,
    { role },
    opts
  );

// Payment/Plan Activation for Users
const PAYMENT_BASE_URL = `${apiBaseUrl.replace(/\/$/, "")}/payments`;

const paymentClient = createApiClient({
  baseURL: PAYMENT_BASE_URL,
  getAuthToken,
  onAuthError: () => {
    clearTokenCache();
    console.warn("Payment API: unauthorized — token cache cleared");
  },
  timeoutMs: 20000,
});

const paymentGet = <T = any>(
  url: string,
  opts?: { signal?: AbortSignal; token?: string; params?: any }
) =>
  unwrap<T>(
    paymentClient.get(url, {
      params: opts?.params,
      signal: opts?.signal,
      ...(opts?.token
        ? { headers: { Authorization: `Bearer ${opts.token}` } as any }
        : {}),
    } as any)
  );

const paymentPost = <T = any>(
  url: string,
  body?: any,
  opts?: { signal?: AbortSignal; token?: string; params?: any }
) =>
  unwrap<T>(
    paymentClient.post(url, body, {
      params: opts?.params,
      signal: opts?.signal,
      ...(opts?.token
        ? { headers: { Authorization: `Bearer ${opts.token}` } as any }
        : {}),
    } as any)
  );

export const getCashfreeOrderDetails = async (
  orderId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean; order: any }> => {
  return paymentGet<{ success: boolean; order: any }>(
    `/get-order-details/${orderId}`,
    opts
  );
};

export const activateUserPlan = async (
  data: { userId: string; orderId: string; planId: string },
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean; message: string; subscription: any }> => {
  return paymentPost<{ success: boolean; message: string; subscription: any }>(
    "/activate-plan",
    data,
    opts
  );
};

export const activateResumePayment = async (
  userId: string,
  planId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{
  resume: {
    status: "active";
    source: "admin";
    planId: string;
    planName: string;
    orderId: null;
    startDate: string;
    endDate: string | null;
  };
}> => {
  return post(`/users/${userId}/resume-access`, { planId }, opts);
};

// ========================
// Support Tickets
// ========================

export async function getSupportTickets(
  page = 1,
  limit = 50,
  status?: string,
  priority?: string,
  category?: string,
  opts?: { signal?: AbortSignal; token?: string }
) {
  const params = {
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(category && { category }),
  };
  return get(`/support-tickets`, { ...opts, params });
}

export async function getSupportTicketById(
  ticketId: string,
  opts?: { signal?: AbortSignal; token?: string }
) {
  return get(`/support-tickets/${ticketId}`, opts);
}

export async function respondToTicket(
  ticketId: string,
  message: string,
  opts?: { signal?: AbortSignal; token?: string }
) {
  return post(`/support-tickets/${ticketId}/respond`, { message }, opts);
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  opts?: { signal?: AbortSignal; token?: string }
) {
  return patch(`/support-tickets/${ticketId}/status`, { status }, opts);
}

export async function updateTicketPriority(
  ticketId: string,
  priority: string,
  opts?: { signal?: AbortSignal; token?: string }
) {
  return patch(`/support-tickets/${ticketId}/priority`, { priority }, opts);
}

// ========================
// Email Management
// ========================

export interface EmailServer {
  _id: string;
  name: string;
  provider: "gmail" | "smtp" | "outlook";
  host?: string;
  port: number;
  secure: boolean;
  username: string;
  fromName?: string;
  fromEmail: string;
  isDefault: boolean;
  isActive: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
  dailyCount?: number;
  monthlyCount?: number;
  lastResetDate?: string;
  lastMonthReset?: string;
  createdBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmailServerCreatePayload {
  name: string;
  provider: "gmail" | "smtp" | "outlook" | "ses";
  host?: string;
  port?: number;
  secure?: boolean;
  username: string;
  password: string;
  fromName?: string;
  fromEmail: string;
  isDefault?: boolean;
  isActive?: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface EmailServerTestResult {
  connected: boolean;
  message: string;
}

export const getEmailServers = async (
  page = 1,
  limit = 20,
  provider?: "gmail" | "smtp" | "outlook" | "ses",
  active?: boolean,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PaginationResponse<EmailServer>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(provider && { provider }),
    ...(active !== undefined && { active: active.toString() }),
  });
  return get<PaginationResponse<EmailServer>>(
    `/email/servers?${params.toString()}`,
    opts
  );
};

export const getEmailServer = async (
  serverId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<EmailServer> => {
  return get<EmailServer>(`/email/servers/${serverId}`, opts);
};

export const getDefaultEmailServer = async (opts?: {
  signal?: AbortSignal;
  token?: string;
}): Promise<EmailServer> => {
  return get<EmailServer>(`/email/servers/default/get`, opts);
};

export const createEmailServer = async (
  payload: EmailServerCreatePayload,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<EmailServer> => {
  return post<EmailServer>(`/email/servers`, payload, opts);
};

export const updateEmailServer = async (
  serverId: string,
  payload: Partial<EmailServerCreatePayload>,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<EmailServer> => {
  return put<EmailServer>(`/email/servers/${serverId}`, payload, opts);
};

export const deleteEmailServer = async (
  serverId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`/email/servers/${serverId}`, opts);
};

export const setDefaultEmailServer = async (
  serverId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<EmailServer> => {
  return patch<EmailServer>(`/email/servers/${serverId}/set-default`, {}, opts);
};

export const testEmailServerConnection = async (
  serverId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<EmailServerTestResult> => {
  return post<EmailServerTestResult>(
    `/email/servers/${serverId}/test`,
    {},
    opts
  );
};

// ========================
// Email Templates
// ========================

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "date" | "url" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
  defaultValue?: any;
  example?: any;
  group?: string;
}

export interface EmailTemplate {
  _id: string;
  name: string;
  description?: string;
  subject: string;
  category:
    | "marketing"
    | "job-opening"
    | "notification"
    | "welcome"
    | "password-reset"
    | "custom";
  type: "transactional" | "marketing" | "notification";
  htmlBody: string;
  textBody?: string;
  companyLogoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  variables: TemplateVariable[];
  sampleData?: Record<string, any>;
  isActive: boolean;
  isSystem: boolean;
  isPublic: boolean;
  version: number;
  tags: string[];
  emailServerId?: string;
  usageCount: number;
  lastUsedAt?: string;
  createdBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateCreatePayload {
  name: string;
  description?: string;
  subject: string;
  category:
    | "marketing"
    | "job-opening"
    | "notification"
    | "welcome"
    | "password-reset"
    | "custom";
  type?: "transactional" | "marketing" | "notification";
  htmlBody: string;
  textBody?: string;
  companyLogoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  variables?: TemplateVariable[];
  sampleData?: Record<string, any>;
  isActive?: boolean;
  isPublic?: boolean;
  tags?: string[];
  emailServerId?: string;
}

export interface EmailTemplatePreview {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplateValidation {
  valid: boolean;
  errors: string[];
}

export const getEmailTemplates = async (
  page = 1,
  limit = 20,
  category?: string,
  active?: boolean,
  search?: string,
  tags?: string[],
  system?: boolean,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PaginationResponse<EmailTemplate>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(category && { category }),
    ...(active !== undefined && { active: active.toString() }),
    ...(search && { search }),
    ...(tags && tags.length > 0 && { tags: tags.join(",") }),
    ...(system !== undefined && { system: system.toString() }),
  });
  return get<PaginationResponse<EmailTemplate>>(
    `/email/templates?${params.toString()}`,
    opts
  );
};

export const getEmailTemplate = async (
  templateId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<EmailTemplate> => {
  return get<EmailTemplate>(`/email/templates/${templateId}`, opts);
};

export const createEmailTemplate = async (
  payload: EmailTemplateCreatePayload,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<EmailTemplate> => {
  return post<EmailTemplate>(`/email/templates`, payload, opts);
};

export const updateEmailTemplate = async (
  templateId: string,
  payload: Partial<EmailTemplateCreatePayload>,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<EmailTemplate> => {
  return put<EmailTemplate>(`/email/templates/${templateId}`, payload, opts);
};

export const deleteEmailTemplate = async (
  templateId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`/email/templates/${templateId}`, opts);
};

export const duplicateEmailTemplate = async (
  templateId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<EmailTemplate> => {
  return post<EmailTemplate>(
    `/email/templates/${templateId}/duplicate`,
    {},
    opts
  );
};

export const previewEmailTemplate = async (
  templateId: string,
  variables?: Record<string, any>,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<EmailTemplatePreview> => {
  return post<EmailTemplatePreview>(
    `/email/templates/${templateId}/preview`,
    { variables },
    opts
  );
};

export const testEmailTemplate = async (
  templateId: string,
  email: string,
  variables?: Record<string, any>,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ sent: boolean }> => {
  return post<{ sent: boolean }>(
    `/email/templates/${templateId}/test`,
    { email, variables },
    opts
  );
};

export const validateEmailTemplate = async (
  templateId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<EmailTemplateValidation> => {
  return post<EmailTemplateValidation>(
    `/email/templates/${templateId}/validate`,
    {},
    opts
  );
};

export const getEmailTemplateVariables = async (
  templateId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ variables: TemplateVariable[] }> => {
  return get<{ variables: TemplateVariable[] }>(
    `/email/templates/${templateId}/variables`,
    opts
  );
};

export const uploadTemplateLogo = async (
  file: File,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append("logo", file);

  // Use fetch for FormData
  const token =
    opts?.token || (await import("@/utils/auth").then((m) => m.getAuthToken()));
  const baseURL = import.meta.env.VITE_API_BASE_URL || "";

  const response = await fetch(
    `${baseURL}/api/admin/email/templates/logo/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: opts?.signal,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload logo");
  }

  return response.json();
};

export const deleteTemplateLogo = async (
  logoUrl: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ deleted: boolean }> => {
  return del<{ deleted: boolean }>(
    `/email/templates/logo/${encodeURIComponent(logoUrl)}`,
    opts
  );
};

// ========================
// Bulk Email Sending
// ========================

export interface FilterCandidate {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface FilterOptions {
  location?: { lat: number; lng: number; radius?: number };
  skills?: string[];
  jobTitles?: string[];
  dateRange?: { from?: string; to?: string };
  subscriptionStatus?: "active" | "inactive" | "all";
  lastActiveRange?: { from?: string; to?: string };
  search?: string;
}

export interface BulkEmailResponse {
  immediateCount: number;
  scheduledCount: number;
  batchId: string;
  schedulerIds: string[];
  nextAvailableDate?: string;
}

export interface EmailServerCapacity {
  dailyUsed: number;
  monthlyUsed: number;
  dailyRemaining: number;
  monthlyRemaining: number;
  dailyResetAt: string;
  monthlyResetAt: string;
}

export interface EmailScheduler {
  _id: string;
  emailServerId: any;
  templateId: any;
  subject: string;
  htmlBody: string;
  textBody?: string;
  recipients: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    variables?: Record<string, any>;
  }>;
  scheduledDate: string;
  scheduledTime?: string;
  priority: number;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  batchId: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  rejectedCount?: number; // Duplicate rejections (counts as completed, not failed)
  failedRecipients: Array<{
    email: string;
    error: string;
    failedAt: string;
  }>;
  rejectedRecipients?: Array<{
    email: string;
    reason: string;
    rejectedAt: string;
  }>;
  lastError?: string;
  retryCount: number;
  maxRetries: number;
  createdBy: any;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Filter candidates for email sending
 */
export const filterCandidatesForEmail = async (
  type: "candidates" | "recruiters" | "employers",
  filters: FilterOptions,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ candidates: FilterCandidate[] }> => {
  return post<{ candidates: FilterCandidate[] }>(
    `/email/filter-candidates`,
    { type, filters },
    opts
  );
};

/**
 * Send bulk emails
 */
export const sendBulkEmails = async (
  payload: {
    emailServerId?: string;
    templateId: string;
    recipientIds: string[];
    variables?: Record<string, any>;
    scheduledDate?: string;
  },
  opts?: { signal?: AbortSignal; token?: string }
): Promise<BulkEmailResponse> => {
  return post<BulkEmailResponse>(`/email/send-bulk`, payload, opts);
};

/**
 * Get email server capacity
 */
export const getEmailServerCapacity = async (
  emailServerId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<EmailServerCapacity> => {
  return get<EmailServerCapacity>(
    `/email/servers/${emailServerId}/capacity`,
    opts
  );
};

/**
 * Get scheduled emails
 */
export const getScheduledEmails = async (
  page?: number,
  limit?: number,
  status?: string,
  scheduledDate?: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PaginationResponse<EmailScheduler>> => {
  const params = new URLSearchParams();
  if (page) params.set("page", page.toString());
  if (limit) params.set("limit", limit.toString());
  if (status) params.set("status", status);
  if (scheduledDate) params.set("scheduledDate", scheduledDate);

  return get<PaginationResponse<EmailScheduler>>(
    `/email/scheduled?${params.toString()}`,
    opts
  );
};

/**
 * Cancel scheduled email
 */
export const cancelScheduledEmail = async (
  schedulerId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`/email/scheduled/${schedulerId}`, opts);
};

/**
 * Unsubscribe Management
 */
export interface UnsubscribedUser {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribedAt?: Date;
}

export interface UnsubscribedUsersResponse {
  users: UnsubscribedUser[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Get unsubscribed users
 */
export const getUnsubscribedUsers = async (
  page?: number,
  limit?: number,
  search?: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<UnsubscribedUsersResponse> => {
  const params = new URLSearchParams();
  if (page) params.set("page", page.toString());
  if (limit) params.set("limit", limit.toString());
  if (search) params.set("search", search);

  return get<UnsubscribedUsersResponse>(
    `/email/unsubscribed?${params.toString()}`,
    opts
  );
};

/**
 * Re-subscribe user
 */
export const resubscribeUser = async (
  userId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean; userId: string }> => {
  return post<{ success: boolean; userId: string }>(
    `/email/unsubscribed/${userId}/resubscribe`,
    {},
    opts
  );
};

/**
 * Email Analytics
 */
export interface EmailAnalytics {
  totalSent: number;
  totalFailed: number;
  totalBounced: number;
  totalDelivered: number;
  successRate: number;
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
  serverStats: Array<{
    serverId: string;
    serverName: string;
    totalSent: number;
    totalFailed: number;
    successRate: number;
  }>;
  templateStats: Array<{
    templateId: string;
    templateName: string;
    count: number;
  }>;
  statusBreakdown: {
    sent: number;
    failed: number;
    bounced: number;
    delivered: number;
  };
  recentActivity: {
    sent: number;
    failed: number;
  };
}

/**
 * Email Scheduler
 */
export interface EmailScheduler {
  _id: string;
  emailServerId: any;
  templateId: any;
  subject: string;
  htmlBody: string;
  textBody?: string;
  recipients: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    variables?: Record<string, any>;
  }>;
  scheduledDate: string;
  scheduledTime?: string;
  priority: number;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  batchId: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  rejectedCount?: number; // Duplicate rejections (counts as completed, not failed)
  failedRecipients: Array<{
    email: string;
    error: string;
    failedAt: string;
  }>;
  rejectedRecipients?: Array<{
    email: string;
    reason: string;
    rejectedAt: string;
  }>;
  lastError?: string;
  retryCount: number;
  maxRetries: number;
  createdBy: any;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get email sending analytics
 */
export const getEmailAnalytics = async (opts?: {
  signal?: AbortSignal;
  token?: string;
}): Promise<EmailAnalytics> => {
  return get<EmailAnalytics>(`/email/analytics`, opts);
};

// ========================
// Outside Links Management
// ========================

/**
 * List outside links
 */
export const getOutsideLinks = (
  page = 1,
  limit = 20,
  search = "",
  isActive?: boolean,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PaginationResponse<OutsideLink>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(isActive !== undefined && { isActive: isActive.toString() }),
  });
  return get<PaginationResponse<OutsideLink>>(
    `/outside-links?${params.toString()}`,
    opts
  );
};

/**
 * Get a single outside link
 */
export const getOutsideLink = (
  id: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<OutsideLink> => {
  return get<OutsideLink>(`/outside-links/${id}`, opts);
};

/**
 * Create a new outside link
 */
export const createOutsideLink = async (
  data: {
    title: string;
    description?: string;
    outsideLink: string;
    bannerImage?: string;
    isActive?: boolean;
    tags?: string[];
  },
  bannerFile?: File,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<OutsideLink> => {
  let bannerImageUrl = data.bannerImage;

  // Upload banner image if file is provided
  if (bannerFile) {
    const formData = new FormData();
    formData.append("bannerImage", bannerFile);

    const token =
      opts?.token || (await import("@/utils/auth").then((m) => m.getAuthToken()));
    const baseURL = apiBaseUrl.replace(/\/$/, ""); // Remove trailing slash

    const response = await fetch(
      `${baseURL}/upload/banner-image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: opts?.signal,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload banner image");
    }

    const result = await response.json();
    bannerImageUrl = result.data?.filePath || result.filePath;
  }

  return post<OutsideLink>(
    "/outside-links",
    {
      ...data,
      bannerImage: bannerImageUrl,
      tags: data.tags || [],
    },
    opts
  );
};

/**
 * Update an outside link
 */
export const updateOutsideLink = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    outsideLink?: string;
    bannerImage?: string;
    isActive?: boolean;
    tags?: string[];
  },
  bannerFile?: File,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<OutsideLink> => {
  let bannerImageUrl = data.bannerImage;

  // Upload banner image if file is provided
  if (bannerFile) {
    const formData = new FormData();
    formData.append("bannerImage", bannerFile);

    const token =
      opts?.token || (await import("@/utils/auth").then((m) => m.getAuthToken()));
    const baseURL = apiBaseUrl.replace(/\/$/, ""); // Remove trailing slash

    const response = await fetch(
      `${baseURL}/upload/banner-image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: opts?.signal,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload banner image");
    }

    const result = await response.json();
    bannerImageUrl = result.data?.filePath || result.filePath;
  }

  return put<OutsideLink>(
    `/outside-links/${id}`,
    {
      ...data,
      ...(bannerImageUrl && { bannerImage: bannerImageUrl }),
      ...(data.tags !== undefined && { tags: data.tags }),
    },
    opts
  );
};

/**
 * Delete an outside link
 */
export const deleteOutsideLink = (
  id: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`/outside-links/${id}`, opts);
};

/**
 * Get click statistics for an outside link
 */
export const getOutsideLinkStats = (
  id: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<OutsideLinkClickStats> => {
  return get<OutsideLinkClickStats>(`/outside-links/${id}/stats`, opts);
};

/**
 * Get paginated submissions for an outside link
 */
export const getOutsideLinkSubmissions = (
  linkId: string,
  page = 1,
  limit = 20,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PaginationResponse<OutsideLinkSubmissionAdmin>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  return get<PaginationResponse<OutsideLinkSubmissionAdmin>>(
    `/outside-links/${linkId}/submissions?${params.toString()}`,
    opts
  );
};

/**
 * Track a click on an outside link (public endpoint)
 */
export const trackOutsideLinkClick = async (
  id: string,
  opts?: { signal?: AbortSignal }
): Promise<{ success: boolean }> => {
  // This is a public endpoint, no auth token needed
  const baseURL = import.meta.env.VITE_API_BASE_URL || "";
  const response = await fetch(`${baseURL}/api/admin/outside-links/${id}/track-click`, {
    method: "POST",
    signal: opts?.signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to track click");
  }

  return response.json();
};

// ========================
// Tags Management
// ========================

/**
 * List tags (paginated, searchable)
 */
export const getTags = (
  page = 1,
  limit = 20,
  search = "",
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PaginationResponse<Tag>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });
  return get<PaginationResponse<Tag>>(`/tags?${params.toString()}`, opts);
};

/**
 * Get a single tag
 */
export const getTag = (
  id: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<Tag> => {
  return get<Tag>(`/tags/${id}`, opts);
};

/**
 * Create a new tag
 */
export const createTag = (
  data: { name: string },
  opts?: { signal?: AbortSignal; token?: string }
): Promise<Tag> => {
  return createEndpoint<Tag>("/tags", data, opts);
};

/**
 * Update a tag
 */
export const updateTag = (
  tagId: string,
  data: { name?: string },
  opts?: { signal?: AbortSignal; token?: string }
): Promise<Tag> => {
  return updateEndpoint<Tag>(`/tags/${tagId}`, data, opts);
};

/**
 * Delete a tag
 */
export const deleteTag = (
  tagId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean }> => {
  return deleteEndpoint<{ success: boolean }>(`/tags/${tagId}`, opts);
};

// ========== Certificates ==========

/**
 * Get certificates (paginated, searchable)
 */
export const getCertificates = (
  page = 1,
  limit = 20,
  search = "",
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PaginationResponse<Certificate>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });
  return get<PaginationResponse<Certificate>>(`/certificates?${params.toString()}`, opts);
};

/**
 * Get a single certificate
 */
export const getCertificate = (
  id: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<Certificate> => {
  return get<Certificate>(`/certificates/${id}`, opts);
};

/**
 * Create a new certificate (multipart: studentName, course, batch, serialNumber, certificateImage, studentPhoto)
 */
export const createCertificate = async (
  formData: FormData,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<Certificate> => {
  const token =
    opts?.token || (await import("@/utils/auth").then((m) => m.getAuthToken()));
  const baseURL = `${apiBaseUrl.replace(/\/$/, "")}/admin`;

  const response = await fetch(`${baseURL}/certificates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    signal: opts?.signal,
  });

  if (!response.ok) {
    const err = await response.json();
    const msg = err.message || err.error?.message || "Failed to create certificate";
    throw new Error(msg);
  }

  const result = await response.json();
  return result.data ?? result;
};
