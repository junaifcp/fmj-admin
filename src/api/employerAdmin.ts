// src/api/employerAdmin.ts
// Employer admin: /api/admin/employers/*.
import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";
import type { AdminActivityRow, AdminNoteRow, Paged } from "@/types/recruiterAdmin";
import type {
  EmployerApplicationsRow,
  EmployerCvDropRow,
  EmployerDetail,
  EmployerDraftRow,
  EmployerJobRow,
  EmployerListFilters,
  EmployerListRow,
  EmployerOverview,
  EmployerPaymentRow,
  EmployerSharedJobRow,
  EmployerWhatsappRow,
  AdminCvDropRow,
  CareerPageFilters,
  CareerPageRow,
  CvDropFilters,
  CvDropSummaryRow,
  FunnelFilters,
  FunnelResult,
} from "@/types/employerAdmin";

type Opts = { signal?: AbortSignal };

const client = createApiClient({
  baseURL: `${apiBaseUrl.replace(/\/$/, "")}/admin/employers`,
  getAuthToken,
  onAuthError: () => clearTokenCache(),
});

const enc = encodeURIComponent;

// Employer admin 8.1 / 8.2: sibling admin resources.
const adminBase = `${apiBaseUrl.replace(/\/$/, "")}/admin`;
const cvDropsClient = createApiClient({
  baseURL: `${adminBase}/cv-drops`,
  getAuthToken,
  onAuthError: () => clearTokenCache(),
});
const careerPagesClient = createApiClient({
  baseURL: `${adminBase}/career-pages`,
  getAuthToken,
  onAuthError: () => clearTokenCache(),
});

const toParams = (o: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== "") p.set(k, String(v));
  return p.toString();
};

const tabGet =
  <T>(path: string) =>
  async (id: string, page = 1, limit = 20, opts?: Opts): Promise<Paged<T>> => {
    const res = await client.get(`/${enc(id)}/${path}?page=${page}&limit=${limit}`, {
      signal: opts?.signal,
    });
    return res.data.data;
  };

export const employerAdminApi = {
  /** Employer admin 5.1: Overview for a date range (cached 5 min on the server). */
  async getOverview(from?: string, to?: string, opts?: Opts): Promise<EmployerOverview> {
    const qs = toParams({ from, to });
    const res = await client.get(qs ? `/overview?${qs}` : "/overview", { signal: opts?.signal });
    return res.data.data;
  },

  /** 6.1: All Employers with filters. */
  async list(
    page: number,
    limit: number,
    filters: EmployerListFilters,
    opts?: Opts
  ): Promise<Paged<EmployerListRow>> {
    const res = await client.get(`/?${toParams({ page, limit, ...filters })}`, {
      signal: opts?.signal,
    });
    return res.data.data;
  },

  /** CSV of the selected ids, or of every employer matching the filters. */
  async exportCsv(ids: string[], filters: EmployerListFilters): Promise<void> {
    const qs = ids.length ? toParams({ ids: ids.join(",") }) : toParams({ ...filters });
    const res = await client.request({ method: "get", url: `/export?${qs}`, responseType: "blob" } as any);
    const url = window.URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async getDetail(id: string, opts?: Opts): Promise<EmployerDetail> {
    const res = await client.get(`/${enc(id)}`, { signal: opts?.signal });
    return res.data.data;
  },

  jobs: tabGet<EmployerJobRow>("jobs"),
  applications: tabGet<EmployerApplicationsRow>("applications"),
  drafts: tabGet<EmployerDraftRow>("drafts"),
  cvDrops: tabGet<EmployerCvDropRow>("cv-drops"),
  sharedJobs: tabGet<EmployerSharedJobRow>("shared-jobs"),
  whatsapp: tabGet<EmployerWhatsappRow>("whatsapp"),
  payments: tabGet<EmployerPaymentRow>("payments"),
  activity: tabGet<AdminActivityRow>("activity"),
  notes: tabGet<AdminNoteRow>("notes"),

  async addNote(id: string, body: string): Promise<AdminNoteRow> {
    const res = await client.post(`/${enc(id)}/notes`, { body });
    return res.data.data;
  },

  // ---- Actions (each one is audited on the server) ----
  async setActive(id: string, isActive: boolean, reason: string) {
    await client.patch(`/${enc(id)}/status`, { isActive, reason });
  },
  async revokeSessions(id: string, reason: string) {
    await client.post(`/${enc(id)}/revoke-sessions`, { reason });
  },
  async reonboard(id: string, reason: string) {
    await client.post(`/${enc(id)}/reonboard`, { reason });
  },
  async setWhatsappOptOut(id: string, optOut: boolean, reason: string) {
    await client.patch(`/${enc(id)}/whatsapp`, { optOut, reason });
  },
  async setCvDrop(id: string, enabled: boolean, reason: string) {
    await client.patch(`/${enc(id)}/cv-drop`, { enabled, reason });
  },
  async rotateCvDrop(id: string, reason: string): Promise<{ code: string; publicUrl: string }> {
    const res = await client.post(`/${enc(id)}/cv-drop/rotate`, { reason });
    return res.data.data;
  },
  async setCareerPage(id: string, enabled: boolean, reason: string) {
    await client.patch(`/${enc(id)}/career-page`, { enabled, reason });
  },
  async changeRole(id: string, role: string, reason: string) {
    await client.put(`/${enc(id)}/role`, { role, reason });
  },

  // ---- 7.1: Post-a-Job Funnel ----
  async funnel(page: number, limit: number, filters: FunnelFilters, opts?: Opts): Promise<FunnelResult> {
    const res = await client.get(`/drafts?${toParams({ page, limit, ...filters })}`, { signal: opts?.signal });
    return res.data.data;
  },
  async markDraftContacted(draftId: string, note: string): Promise<AdminNoteRow> {
    const res = await client.post(`/drafts/${enc(draftId)}/contacted`, { note });
    return res.data.data;
  },
};

/** Employer admin 8.1: CV drops across employers. */
export const cvDropsAdminApi = {
  async list(page: number, limit: number, filters: CvDropFilters, opts?: Opts): Promise<Paged<AdminCvDropRow>> {
    const res = await cvDropsClient.get(`/?${toParams({ page, limit, ...filters })}`, { signal: opts?.signal });
    return res.data.data;
  },
  async summary(opts?: Opts): Promise<CvDropSummaryRow[]> {
    const res = await cvDropsClient.get("/summary", { signal: opts?.signal });
    return res.data.data;
  },
  /** Fetches the file with the admin's token (audited on the server) and opens it in a new tab. */
  async openFile(id: string): Promise<void> {
    // Open the tab first so pop-up blockers allow it, then point it at the file.
    const tab = window.open("", "_blank");
    try {
      const res = await cvDropsClient.request({ method: "get", url: `/${enc(id)}/file`, responseType: "blob" } as any);
      const url = window.URL.createObjectURL(res.data as Blob);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      tab?.close();
      throw e;
    }
  },
  async remove(id: string, reason: string): Promise<void> {
    await cvDropsClient.delete(`/${enc(id)}`, { data: { reason } });
  },
};

/** Employer admin 8.2: career pages across employers (toggle via employerAdminApi.setCareerPage). */
export const careerPagesAdminApi = {
  async list(page: number, limit: number, filters: CareerPageFilters, opts?: Opts): Promise<Paged<CareerPageRow>> {
    const res = await careerPagesClient.get(`/?${toParams({ page, limit, ...filters })}`, { signal: opts?.signal });
    return res.data.data;
  },
};
