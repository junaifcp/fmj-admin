// src/api/fitmyskillLeads.ts
import { createApiClient } from "./apiClient";
import { API_BASE_ADMIN } from "./admin";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import type {
  Assignee,
  ExportStatus,
  LeadFilterValue,
  SavedFilter,
  LeadBulkBody,
  LeadDetail,
  LeadPatchBody,
  LeadListResponse,
  LeadOptionsCatalog,
  OptionSearchField,
  SearchOption,
} from "@/types/fitmyskillLeads";

const client = createApiClient({
  baseURL: `${API_BASE_ADMIN}/candidates/fitmyskill-leads`,
  getAuthToken,
  onAuthError: () => clearTokenCache(),
});

export const fitmyskillLeadsApi = {
  // The list body has `pagination` next to `data`, not inside it.
  async list(
    params: Record<string, string>,
    signal?: AbortSignal
  ): Promise<LeadListResponse> {
    const res = await client.get("", { params, signal });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  async getAssignees(signal?: AbortSignal): Promise<Assignee[]> {
    const res = await client.get("/assignees", { signal });
    return res.data.data;
  },

  async getLead(candidateId: string, signal?: AbortSignal): Promise<LeadDetail> {
    const res = await client.get(`/${candidateId}`, { signal });
    return res.data.data;
  },

  async updateLead(candidateId: string, body: LeadPatchBody): Promise<LeadDetail> {
    const res = await client.patch(`/${candidateId}`, body);
    return res.data.data;
  },

  async bulkUpdate(body: LeadBulkBody): Promise<{ updated: number }> {
    const res = await client.post("/bulk", body);
    return res.data.data;
  },

  async listSavedFilters(): Promise<SavedFilter[]> {
    const res = await client.get("/saved-filters");
    return res.data.data;
  },

  async createSavedFilter(
    name: string,
    filters: Record<string, LeadFilterValue>
  ): Promise<SavedFilter> {
    const res = await client.post("/saved-filters", { name, filters });
    return res.data.data;
  },

  async renameSavedFilter(id: string, name: string): Promise<SavedFilter> {
    const res = await client.patch(`/saved-filters/${id}`, { name });
    return res.data.data;
  },

  async deleteSavedFilter(id: string): Promise<void> {
    await client.delete(`/saved-filters/${id}`);
  },

  async startExport(filters: Record<string, LeadFilterValue>): Promise<string> {
    const res = await client.post("/export", { filters });
    return res.data.data.jobId;
  },

  async getExportStatus(jobId: string): Promise<ExportStatus> {
    const res = await client.get(`/export/${jobId}`);
    return res.data.data;
  },

  async downloadExport(jobId: string): Promise<Blob> {
    const res = await client.get(`/export/${jobId}`, {
      params: { download: "1" },
      responseType: "blob",
    });
    return res.data;
  },

  async getOptions(signal?: AbortSignal): Promise<LeadOptionsCatalog> {
    const res = await client.get("/options", { signal });
    return res.data.data;
  },

  async searchOptions(
    field: OptionSearchField,
    q: string,
    signal?: AbortSignal
  ): Promise<SearchOption[]> {
    const res = await client.get("/options", { params: { field, q }, signal });
    return res.data.data.items;
  },
};
