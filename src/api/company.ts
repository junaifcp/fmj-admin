// src/api/company.ts
import { PaginationResponse, ManagedCompany } from "@/types/admin";
import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";

/**
 * API base (centralized configuration)
 */
const API_BASE = apiBaseUrl;

/**
 * Create axios client for company management endpoints.
 * Uses centralized getAuthToken and clears token cache on 401.
 */
const client = createApiClient({
  baseURL: API_BASE,
  getAuthToken,
  onAuthError: () => {
    clearTokenCache();
    console.warn("Company API: unauthorized — token cache cleared");
  },
  timeoutMs: 20000,
});

/**
 * Helper to unwrap axios response.data with typing
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
 * Lightweight helpers that accept an optional per-call token + AbortSignal.
 * If opts.token is provided it will be used for that call; otherwise the client's getAuthToken handles it.
 */
const get = async <T = any>(
  url: string,
  opts?: { signal?: AbortSignal; token?: string; params?: any }
): Promise<T> => {
  const config: any = {
    signal: opts?.signal,
    params: opts?.params,
  };
  if (opts?.token) config.headers = { Authorization: `Bearer ${opts.token}` };
  return unwrap<T>(client.get(url, config));
};

const put = async <T = any>(
  url: string,
  body?: any,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<T> => {
  const config: any = { signal: opts?.signal };
  if (opts?.token) config.headers = { Authorization: `Bearer ${opts.token}` };
  return unwrap<T>(client.put(url, body, config));
};

const patch = async <T = any>(
  url: string,
  body?: any,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<T> => {
  const config: any = { signal: opts?.signal };
  if (opts?.token) config.headers = { Authorization: `Bearer ${opts.token}` };
  return unwrap<T>(client.patch(url, body, config));
};

// ----------------- Company management endpoints -----------------

/**
 * Get managed companies (paginated)
 */
export const getManagementCompanies = async (
  page = 1,
  limit = 20,
  search = "",
  verified = "",
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PaginationResponse<ManagedCompany>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { q: search }), // Backend expects 'q' not 'search'
    ...(verified && { verified }),
  });

  return get<PaginationResponse<ManagedCompany>>(
    `/companies?${params.toString()}`,
    { ...opts }
  );
};

/**
 * Update a managed company
 */
export const updateManagedCompany = async (
  companyId: string,
  company: { notes?: string; industry?: string },
  opts?: { signal?: AbortSignal; token?: string }
): Promise<ManagedCompany> => {
  return put<ManagedCompany>(`/companies/${companyId}`, company, opts);
};

/**
 * Verify a company (verified: "verified" | "pending" | "rejected")
 */
export const verifyCompany = async (
  companyId: string,
  verified: "verified" | "pending" | "rejected",
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ success: boolean }> => {
  return patch<{ success: boolean }>(
    `/companies/${companyId}/verify`,
    { verified },
    opts
  );
};
