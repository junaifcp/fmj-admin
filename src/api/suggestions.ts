// src/api/suggestions.ts
import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";

/**
 * Suggestions API base (centralized configuration)
 */
const SUGGESTIONS_API_BASE = `${apiBaseUrl.replace(/\/$/, "")}/suggestions`;

/**
 * Create axios client for suggestions endpoints.
 * Uses centralized getAuthToken (module-level) and clears token cache on 401.
 */
const client = createApiClient({
  baseURL: SUGGESTIONS_API_BASE,
  getAuthToken,
  onAuthError: () => {
    clearTokenCache();
    console.warn("Suggestions API: unauthorized — token cache cleared");
  },
  timeoutMs: 15000,
});

export interface SuggestionItem {
  _id: string;
  name: string;
  verified: "pending" | "verified" | "rejected";
}

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
 * Low-level helpers that accept optional per-call token and signal.
 * If opts.token is provided it will be sent as Authorization header for that call.
 */
const get = async <T = any>(
  url: string,
  opts?: { token?: string; signal?: AbortSignal; params?: any }
): Promise<T> => {
  const config: any = {
    params: opts?.params ?? {},
    signal: opts?.signal,
  };

  if (opts?.token) {
    config.headers = {
      Authorization: `Bearer ${opts.token}`,
    };
  }

  return unwrap<T>(client.get(url, config));
};

const post = async <T = any>(
  url: string,
  data?: any,
  opts?: { token?: string; signal?: AbortSignal; params?: any }
): Promise<T> => {
  const config: any = {
    params: opts?.params,
    signal: opts?.signal,
  };

  if (opts?.token) {
    config.headers = {
      Authorization: `Bearer ${opts.token}`,
    };
  }

  return unwrap<T>(client.post(url, data, config));
};

/* ========== Suggestions endpoints ========== */

/** Skill suggestions */
export const getSkillSuggestions = async (
  query: string,
  limit = 10,
  opts?: { token?: string; signal?: AbortSignal }
): Promise<SuggestionItem[]> => {
  const params = { query, limit };
  return get<SuggestionItem[]>("/skills", { ...opts, params });
};

export const addSkillSuggestion = async (
  name: string,
  opts?: { token?: string; signal?: AbortSignal }
): Promise<SuggestionItem> => {
  return post<SuggestionItem>("/skills", { name }, opts);
};

/** Job title suggestions */
export const getJobTitleSuggestions = async (
  query: string,
  limit = 10,
  opts?: { token?: string; signal?: AbortSignal }
): Promise<SuggestionItem[]> => {
  const params = { query, limit };
  return get<SuggestionItem[]>("/job-titles", { ...opts, params });
};

export const addJobTitleSuggestion = async (
  name: string,
  opts?: { token?: string; signal?: AbortSignal }
): Promise<SuggestionItem> => {
  return post<SuggestionItem>("/job-titles", { name }, opts);
};

/** Qualification suggestions */
export const getQualificationSuggestions = async (
  query: string,
  limit = 10,
  opts?: { token?: string; signal?: AbortSignal }
): Promise<SuggestionItem[]> => {
  const params = { query, limit };
  return get<SuggestionItem[]>("/qualifications", { ...opts, params });
};

export const addQualificationSuggestion = async (
  name: string,
  opts?: { token?: string; signal?: AbortSignal }
): Promise<SuggestionItem> => {
  return post<SuggestionItem>("/qualifications", { name }, opts);
};

/** Field of study suggestions */
export const getFieldOfStudySuggestions = async (
  query: string,
  limit = 10,
  opts?: { token?: string; signal?: AbortSignal }
): Promise<SuggestionItem[]> => {
  const params = { query, limit };
  return get<SuggestionItem[]>("/field-of-study", { ...opts, params });
};

export const addFieldOfStudySuggestion = async (
  name: string,
  opts?: { token?: string; signal?: AbortSignal }
): Promise<SuggestionItem> => {
  return post<SuggestionItem>("/field-of-study", { name }, opts);
};

/**
 * Bulk upload suggestions.
 * - type: one of 'skills' | 'job-titles' | 'qualifications' | 'field-of-study' (controller should validate)
 * - items: array of names (strings)
 * - markAsVerified: boolean
 *
 * Returns counts and errors.
 */
export const bulkUploadSuggestions = async (
  type: string,
  items: string[],
  markAsVerified: boolean,
  opts?: { token?: string; signal?: AbortSignal }
): Promise<{
  createdCount: number;
  modifiedCount: number;
  upsertedCount: number;
  errors: any[];
}> => {
  if (!type) throw new Error("Missing suggestion type");
  if (!Array.isArray(items) || items.length === 0) {
    return { createdCount: 0, modifiedCount: 0, upsertedCount: 0, errors: [] };
  }

  const params = { verified: markAsVerified ? "verified" : "pending" };
  try {
    const result = await unwrap<{
      createdCount?: number;
      modifiedCount?: number;
      upsertedCount?: number;
      errors?: any[];
    }>(
      client.post(`/${encodeURIComponent(type)}/bulk`, { names: items }, {
        params,
        signal: opts?.signal,
        headers: opts?.token
          ? { Authorization: `Bearer ${opts.token}` }
          : undefined,
      } as any)
    );

    return {
      createdCount: Number(result.createdCount || 0),
      modifiedCount: Number(result.modifiedCount || 0),
      upsertedCount: Number(result.upsertedCount || 0),
      errors: Array.isArray(result.errors) ? result.errors : [],
    };
  } catch (err: any) {
    // Normalize axios errors: attempt to read meaningful message
    const status = err?.status ?? err?.response?.status;
    let message = err?.message ?? "Bulk upload failed";
    try {
      const d = err?.response?.data;
      if (d && typeof d === "object" && d.message) message = d.message;
      else if (typeof d === "string" && d.trim()) message = d;
    } catch {
      /* ignore */
    }
    const e = new Error(message) as Error & { status?: number; original?: any };
    e.status = status;
    e.original = err;
    throw e;
  }
};
