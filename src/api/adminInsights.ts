// src/api/adminInsights.ts
// Recruiter admin 9.1 / 9.2: applications summary and the admin audit log (read-only).
import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";
import type {
  AdminActivityRow,
  ApplicationsSummary,
  AuditLogFilters,
  Paged,
} from "@/types/recruiterAdmin";

const client = createApiClient({
  baseURL: `${apiBaseUrl.replace(/\/$/, "")}/admin`,
  getAuthToken,
  onAuthError: () => clearTokenCache(),
});

type Opts = { signal?: AbortSignal };
const query = (o: Record<string, string | number | undefined>) => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== "") qs.set(k, String(v));
  return qs.toString();
};

export const adminInsightsApi = {
  async applicationsSummary(
    params: { from?: string; to?: string; recruiterId?: string; jobId?: string; owner?: string },
    opts?: Opts
  ): Promise<ApplicationsSummary> {
    const res = await client.get(`/applications/summary?${query(params)}`, { signal: opts?.signal });
    return res.data.data;
  },

  /** limit is capped at 100 by the backend. */
  async auditLog(
    page: number,
    limit: number,
    filters: AuditLogFilters,
    opts?: Opts
  ): Promise<Paged<AdminActivityRow>> {
    const res = await client.get(`/audit-log?${query({ page, limit, ...filters })}`, {
      signal: opts?.signal,
    });
    return res.data.data;
  },

  /** Admins who appear in the log, most active first. */
  async auditActors(opts?: Opts): Promise<
    { _id: string; email: string; name: string; role: string | null; actions: number }[]
  > {
    const res = await client.get(`/audit-log/actors`, { signal: opts?.signal });
    return res.data.data;
  },
};
