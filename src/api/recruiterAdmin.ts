// src/api/recruiterAdmin.ts
// Recruiter admin: /api/admin/recruiters/* beyond the list (see api/admin.ts).
import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";
import type {
  AdminActivityRow,
  AdminNoteRow,
  Paged,
  RecruiterApplicationsRow,
  RecruiterDetail,
  RecruiterInviteRow,
  RecruiterJobDeskRow,
  RecruiterJobRow,
  RecruiterListFilters,
  RecruiterListRow,
  RecruiterOverview,
} from "@/types/recruiterAdmin";

type Opts = { signal?: AbortSignal };

const tabGet =
  <T>(path: string) =>
  async (id: string, page = 1, limit = 20, opts?: Opts): Promise<Paged<T>> => {
    const res = await client.get(
      `/${encodeURIComponent(id)}/${path}?page=${page}&limit=${limit}`,
      { signal: opts?.signal }
    );
    return res.data.data;
  };

const client = createApiClient({
  baseURL: `${apiBaseUrl.replace(/\/$/, "")}/admin/recruiters`,
  getAuthToken,
  onAuthError: () => clearTokenCache(),
});

export const recruiterAdminApi = {
  async getOverview(
    from?: string,
    to?: string,
    opts?: { signal?: AbortSignal }
  ): Promise<RecruiterOverview> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    const res = await client.get(qs ? `/overview?${qs}` : "/overview", {
      signal: opts?.signal,
    });
    return res.data.data;
  },

  /** Recruiter admin 5.1: list with filters. */
  async list(
    page: number,
    limit: number,
    filters: RecruiterListFilters,
    opts?: Opts
  ): Promise<Paged<RecruiterListRow>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    for (const [k, v] of Object.entries(filters)) {
      if (v) params.set(k, String(v));
    }
    const res = await client.get(`?${params.toString()}`, { signal: opts?.signal });
    return res.data.data;
  },

  async getDetail(id: string, opts?: Opts): Promise<RecruiterDetail> {
    const res = await client.get(`/${encodeURIComponent(id)}`, { signal: opts?.signal });
    return res.data.data;
  },

  jobs: tabGet<RecruiterJobRow>("jobs"),
  applications: tabGet<RecruiterApplicationsRow>("applications"),
  jobDesk: tabGet<RecruiterJobDeskRow>("job-desk"),
  invites: tabGet<RecruiterInviteRow>("employer-invites"),
  activity: tabGet<AdminActivityRow>("activity"),
  notes: tabGet<AdminNoteRow>("notes"),

  async addNote(id: string, body: string): Promise<AdminNoteRow> {
    const res = await client.post(`/${encodeURIComponent(id)}/notes`, { body });
    return res.data.data;
  },

  /** Suspend (reason required, 5+ chars) or reactivate. */
  async setActive(id: string, isActive: boolean, reason: string): Promise<void> {
    await client.patch(`/${encodeURIComponent(id)}/status`, { isActive, reason });
  },

  async reonboard(id: string, reason: string): Promise<void> {
    await client.post(`/${encodeURIComponent(id)}/reonboard`, { reason });
  },

  async verifyProfile(id: string, reason: string): Promise<void> {
    await client.post(`/${encodeURIComponent(id)}/verify-profile`, { reason });
  },

  /** Superadmin only on the backend. */
  async changeRole(id: string, role: string, reason: string): Promise<void> {
    await client.put(`/${encodeURIComponent(id)}/role`, { role, reason });
  },
};
