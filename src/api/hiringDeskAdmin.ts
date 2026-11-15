// src/api/hiringDeskAdmin.ts
// Recruiter admin 8.1 / 8.2: /api/admin/job-desk and /api/admin/employer-shares.
import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";
import type {
  AdminInviteRow,
  DeskResult,
  DeskTab,
  FulfillmentPlan,
  HeavySender,
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

export const jobDeskApi = {
  async list(
    params: { tab: DeskTab; page: number; limit: number; q?: string; plan?: string; recruiterId?: string },
    opts?: Opts
  ): Promise<DeskResult> {
    const res = await client.get(`/job-desk?${query(params)}`, { signal: opts?.signal });
    return res.data.data;
  },
  async assign(jobId: string, recruiterId: string, reason: string): Promise<void> {
    await client.post(`/job-desk/${encodeURIComponent(jobId)}/assign`, { recruiterId, reason });
  },
  /** Reason of 5+ characters required. */
  async unassign(jobId: string, reason: string): Promise<void> {
    await client.post(`/job-desk/${encodeURIComponent(jobId)}/unassign`, { reason });
  },
  async setPlan(jobId: string, plan: FulfillmentPlan, reason = ""): Promise<void> {
    await client.patch(`/job-desk/${encodeURIComponent(jobId)}/plan`, { plan, reason });
  },
};

export const employerInvitesApi = {
  async list(
    params: {
      page: number;
      limit: number;
      status?: string;
      whatsappStatus?: string;
      recruiterId?: string;
      jobId?: string;
      q?: string;
      from?: string;
      to?: string;
    },
    opts?: Opts
  ): Promise<Paged<AdminInviteRow>> {
    const res = await client.get(`/employer-shares?${query(params)}`, { signal: opts?.signal });
    return res.data.data;
  },
  async heavySenders(hours = 24, min = 20, opts?: Opts): Promise<{ hours: number; min: number; data: HeavySender[] }> {
    const res = await client.get(`/employer-shares/heavy-senders?${query({ hours, min })}`, {
      signal: opts?.signal,
    });
    return res.data.data;
  },
  /** Reason of 5+ characters required. */
  async revoke(id: string, reason: string): Promise<void> {
    await client.post(`/employer-shares/${encodeURIComponent(id)}/revoke`, { reason });
  },
  async resend(id: string, reason = ""): Promise<void> {
    await client.post(`/employer-shares/${encodeURIComponent(id)}/resend`, { reason });
  },
};
