// src/api/candidateMetrics.ts
import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";
import type {
  CandidateOverviewMetrics,
  ApplicationMetrics,
  AtsMetrics,
  ActivityTrends,
  TemplateMetrics,
} from "@/types/candidateMetrics";

const API_BASE = `${apiBaseUrl.replace(/\/$/, "")}/admin/candidates/metrics`;

const client = createApiClient({
  baseURL: API_BASE,
  getAuthToken,
  onAuthError: () => clearTokenCache(),
});

export const candidateMetricsApi = {
  async getOverview(
    from?: string,
    to?: string
  ): Promise<CandidateOverviewMetrics> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const url = params.toString() ? `/overview?${params}` : "/overview";
    const res = await client.get(url);
    return res.data.data;
  },

  async getApplicationMetrics(): Promise<ApplicationMetrics> {
    const res = await client.get("/applications");
    return res.data.data;
  },

  async getAtsMetrics(): Promise<AtsMetrics> {
    const res = await client.get("/ats");
    return res.data.data;
  },

  async getActivityTrends(days: number = 30): Promise<ActivityTrends> {
    const res = await client.get(`/trends?days=${days}`);
    return res.data.data;
  },

  async getTopTemplates(): Promise<TemplateMetrics[]> {
    const res = await client.get("/templates");
    return res.data.data;
  },
};
