// src/api/companyAdmin.ts
// Recruiter admin 6.1: /api/companies (admin-only) for the Companies verification queue.
// Returns the full payload so the per-tab `counts` survive.
import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";
import type {
  CompanyDetail,
  CompanyListResult,
  CompanyVerification,
} from "@/types/recruiterAdmin";

const client = createApiClient({
  baseURL: `${apiBaseUrl.replace(/\/$/, "")}/companies`,
  getAuthToken,
  onAuthError: () => clearTokenCache(),
});

type Opts = { signal?: AbortSignal };

export const companyAdminApi = {
  async list(
    params: {
      page: number;
      limit: number;
      verified?: CompanyVerification | "all";
      q?: string;
      ownerId?: string;
      sort?: "createdAt" | "name";
    },
    opts?: Opts
  ): Promise<CompanyListResult> {
    const qs = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
    if (params.verified && params.verified !== "all") qs.set("verified", params.verified);
    if (params.q) qs.set("q", params.q);
    if (params.ownerId) qs.set("ownerId", params.ownerId);
    if (params.sort) qs.set("sort", params.sort);
    const res = await client.get(`?${qs.toString()}`, { signal: opts?.signal });
    return res.data.data;
  },

  async get(id: string, opts?: Opts): Promise<CompanyDetail> {
    const res = await client.get(`/${encodeURIComponent(id)}`, { signal: opts?.signal });
    return res.data.data;
  },

  /** Reject needs notes of 5+ characters (backend enforces). */
  async setVerification(id: string, verified: CompanyVerification, notes: string): Promise<void> {
    await client.patch(`/${encodeURIComponent(id)}/verify`, { verified, notes });
  },

  /**
   * Company reference number (job fair code, e.g. "FMJ01"): null or "" clears it.
   * 400 on a bad format, 409 when another company has the code.
   */
  async setReference(id: string, referenceCode: string | null): Promise<CompanyDetail> {
    const res = await client.patch(`/${encodeURIComponent(id)}/reference`, { referenceCode });
    return res.data.data;
  },
};
