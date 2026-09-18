// src/api/businessData.ts
import {
  StartScrapingJobRequest,
  StartScrapingJobResponse,
  GetScrapedDataResponse,
  JobStatus,
  FilterOptions,
  ListJobsResponse,
  Filters,
} from "@/types/businessData";
import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";

/**
 * Build business data API base URL
 */
export const API_BASE_BUSINESS_DATA = `${apiBaseUrl.replace(
  /\/$/,
  ""
)}/admin/business-data`;

/**
 * Create axios client for business data API
 */
const client = createApiClient({
  baseURL: API_BASE_BUSINESS_DATA,
  getAuthToken,
  onAuthError: () => {
    clearTokenCache();
    console.warn("Business Data API: unauthorized — token cache cleared");
  },
  timeoutMs: 20000,
});

/**
 * Helper to unwrap response.data with typing
 */
async function unwrap<T>(p: Promise<any>): Promise<T> {
  const res = await p;
  const payload = res.data;

  // Handle wrapped response: { success: true, data: <anything> }
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
 * Helper for GET requests
 */
const get = <T = any>(
  url: string,
  opts?: { signal?: AbortSignal; token?: string; params?: any }
) =>
  unwrap<T>(
    client.get(url, {
      params: opts?.params,
      signal: opts?.signal,
      ...(opts?.token
        ? { headers: { Authorization: `Bearer ${opts.token}` } as any }
        : {}),
    } as any)
  );

/**
 * Helper for POST requests
 */
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

// ----------------- Endpoints -----------------

/**
 * Start a new scraping job
 */
export const startScrapingJob = async (
  data: StartScrapingJobRequest,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<StartScrapingJobResponse> => {
  return post<StartScrapingJobResponse>("/scraping/start", data, opts);
};

/**
 * Get filter options (keywords and locations)
 */
export const getFilterOptions = async (opts?: {
  signal?: AbortSignal;
  token?: string;
}): Promise<FilterOptions> => {
  return get<FilterOptions>("/scraping/filter-options", opts);
};

/**
 * Get job status
 */
export const getJobStatus = async (
  jobId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<JobStatus> => {
  return get<JobStatus>(`/scraping/jobs/${jobId}/status`, opts);
};

/**
 * List all scraping jobs
 */
export const listJobs = async (
  params?: {
    page?: number;
    limit?: number;
    status?: string;
  },
  opts?: { signal?: AbortSignal; token?: string }
): Promise<ListJobsResponse> => {
  return get<ListJobsResponse>("/scraping/jobs", {
    ...opts,
    params,
  });
};

/**
 * Get scraped data
 * @param jobId - Job ID (null for filtering across all jobs)
 * @param params - Query parameters including filters
 */
export const getScrapedData = async (
  jobId: string | null,
  params?: {
    page?: number;
    limit?: number;
    keywords?: string[];
    locationPlaceIds?: string[];
    search?: string;
    minRating?: number;
    hasWebsite?: boolean;
    hasEmail?: boolean;
    hasPhone?: boolean;
  },
  opts?: { signal?: AbortSignal; token?: string }
): Promise<GetScrapedDataResponse> => {
  const url = jobId ? `/scraping/jobs/${jobId}/data` : "/scraping/data";

  // Convert arrays to query params (handle both array and comma-separated formats)
  const queryParams: any = {};
  if (params) {
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.keywords && params.keywords.length > 0) {
      queryParams.keywords = params.keywords;
    }
    if (params.locationPlaceIds && params.locationPlaceIds.length > 0) {
      queryParams.locationPlaceIds = params.locationPlaceIds;
    }
    if (params.search) queryParams.search = params.search;
    if (params.minRating !== undefined)
      queryParams.minRating = params.minRating;
    if (params.hasWebsite !== undefined)
      queryParams.hasWebsite = params.hasWebsite;
    if (params.hasEmail !== undefined) queryParams.hasEmail = params.hasEmail;
    if (params.hasPhone !== undefined) queryParams.hasPhone = params.hasPhone;
  }

  return get<GetScrapedDataResponse>(url, {
    ...opts,
    params: queryParams,
  });
};

/**
 * Cancel a scraping job
 */
export const cancelJob = async (
  jobId: string,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<{ jobId: string; status: string; message: string }> => {
  return post<{ jobId: string; status: string; message: string }>(
    `/scraping/jobs/${jobId}/cancel`,
    {},
    opts
  );
};

/**
 * Export scraped data to Excel
 * @param jobId - Job ID (null for exporting across all jobs)
 * @param filters - Filter options
 */
export const exportToExcel = async (
  jobId: string | null,
  filters?: Filters,
  opts?: { signal?: AbortSignal; token?: string }
): Promise<Blob> => {
  // Use /scraping/export for all jobs, or /scraping/jobs/:jobId/export for specific job
  const url = jobId ? `/scraping/jobs/${jobId}/export` : "/scraping/export";

  // Build query params
  const queryParams: any = {};
  if (filters) {
    if (filters.keywords && filters.keywords.length > 0) {
      queryParams.keywords = filters.keywords;
    }
    if (filters.locationPlaceIds && filters.locationPlaceIds.length > 0) {
      queryParams.locationPlaceIds = filters.locationPlaceIds;
    }
    if (filters.search) queryParams.search = filters.search;
    if (filters.minRating !== undefined)
      queryParams.minRating = filters.minRating;
    if (filters.hasWebsite !== undefined)
      queryParams.hasWebsite = filters.hasWebsite;
    if (filters.hasEmail !== undefined) queryParams.hasEmail = filters.hasEmail;
    if (filters.hasPhone !== undefined) queryParams.hasPhone = filters.hasPhone;
  }

  const response = await client.get(url, {
    params: queryParams,
    responseType: "blob",
    signal: opts?.signal,
    ...(opts?.token
      ? { headers: { Authorization: `Bearer ${opts.token}` } as any }
      : {}),
  } as any);

  return response.data as Blob;
};
