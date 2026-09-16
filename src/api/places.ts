// src/api/places.ts
import {
  Location,
  PlaceSuggestion,
  PlaceResolveRequest,
} from "@/types/location";
import type {
  BusinessSuggestResponse,
  BusinessResolveResponse,
} from "@/types/onboarding";

import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";

/**
 * API base (centralized configuration)
 */
const API_BASE = apiBaseUrl;

/**
 * Create axios client for places endpoints.
 * Uses centralized getAuthToken and clears token cache on 401.
 */
const client = createApiClient({
  baseURL: API_BASE,
  getAuthToken,
  onAuthError: () => {
    clearTokenCache();
    console.warn("Places API: unauthorized — token cache cleared");
  },
  timeoutMs: 15000,
});

/** Helper to unwrap axios response.data with typing */
async function unwrap<T>(p: Promise<any>): Promise<T> {
  const res = await p;
  // Handle API responses with { success: true, data: [...] } structure
  if (res.data && typeof res.data === "object" && "data" in res.data) {
    return res.data.data as T;
  }
  return res.data as T;
}

/**
 * Lightweight helpers that accept an optional per-call token + AbortSignal
 * If opts.token is provided it will be used as Authorization header for that call.
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

const post = async <T = any>(
  url: string,
  body?: any,
  opts?: { signal?: AbortSignal; token?: string; params?: any }
): Promise<T> => {
  const config: any = {
    signal: opts?.signal,
    params: opts?.params,
  };
  if (opts?.token) config.headers = { Authorization: `Bearer ${opts.token}` };
  return unwrap<T>(client.post(url, body, config));
};

// ----------------- Places endpoints -----------------

// Places autocomplete suggestions
export const getPlaceSuggestions = async (
  query: string,
  limit = 10,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PlaceSuggestion[]> => {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  });
  return get<PlaceSuggestion[]>(`/places/suggest?${params.toString()}`, {
    signal: opts?.signal,
    token: opts?.token,
  });
};

// Resolve place ID to full location data
export const resolvePlaceId = async (
  request: PlaceResolveRequest,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<Location> => {
  return post<Location>("/places/resolve", request, {
    signal: opts?.signal,
    token: opts?.token,
  });
};

// Set company location
export const setCompanyLocation = async (
  companyId: string,
  request: PlaceResolveRequest,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<any> => {
  return post(`/companies/${companyId}/location`, request, {
    signal: opts?.signal,
    token: opts?.token,
  });
};

// Set job location
export const setJobLocation = async (
  jobId: string,
  request: PlaceResolveRequest,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<any> => {
  return post(`/jobs/${jobId}/location`, request, {
    signal: opts?.signal,
    token: opts?.token,
  });
};

// Search places (optional single-line search)
export const searchPlaces = async (
  query: string,
  limit = 10,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<PlaceSuggestion[]> => {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  });
  return get<PlaceSuggestion[]>(`/places/search?${params.toString()}`, {
    signal: opts?.signal,
    token: opts?.token,
  });
};

// Business autocomplete suggestions
// Accepts optional manual token (keeps backward compatibility). If token is provided it will be sent
// in the Authorization header; otherwise the client's token getter is used.
export async function businessSuggest(
  q: string,
  limit = 5,
  token?: string,
  opts?: { signal?: AbortSignal }
): Promise<BusinessSuggestResponse> {
  const params = { q, limit: String(limit) };
  const config: any = { params, signal: opts?.signal };
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  return unwrap<BusinessSuggestResponse>(
    client.get("/places/business-suggest", config)
  );
}

// Business resolve by placeId
export async function businessResolve(
  placeId: string,
  token?: string,
  opts?: { signal?: AbortSignal }
): Promise<BusinessResolveResponse> {
  const params = { placeId };
  const config: any = { params, signal: opts?.signal };
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  return unwrap<BusinessResolveResponse>(
    client.get("/places/business-resolve", config)
  );
}
