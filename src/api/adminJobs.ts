// src/api/adminJobs.ts
// Recruiter admin 7.2: /api/admin/jobs (list, detail, moderation).
import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";
import type {
  AdminJobDetail,
  AdminJobFilters,
  AdminJobsResult,
  JobModerationAction,
} from "@/types/recruiterAdmin";

const client = createApiClient({
  baseURL: `${apiBaseUrl.replace(/\/$/, "")}/admin/jobs`,
  getAuthToken,
  onAuthError: () => clearTokenCache(),
});

type Opts = { signal?: AbortSignal };

export const adminJobsApi = {
  async list(page: number, limit: number, filters: AdminJobFilters, opts?: Opts): Promise<AdminJobsResult> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, String(v));
    const res = await client.get(`?${qs.toString()}`, { signal: opts?.signal });
    return res.data.data;
  },

  async get(id: string, opts?: Opts): Promise<AdminJobDetail> {
    const res = await client.get(`/${encodeURIComponent(id)}`, { signal: opts?.signal });
    return res.data.data;
  },

  /** Every action except unflag needs a reason of 5+ characters. */
  async moderate(id: string, action: JobModerationAction, reason: string): Promise<void> {
    await client.post(`/${encodeURIComponent(id)}/${action}`, { reason });
  },

  async regeneratePoster(id: string): Promise<void> {
    await client.post(`/${encodeURIComponent(id)}/poster/regenerate`);
  },
};
