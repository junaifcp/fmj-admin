// src/api/entryProofReview.ts
// Candidate full view 6.2: the admin career proofs queue (list, approve,
// reject, file stream).
import { createApiClient } from "./apiClient";
import { API_BASE_ADMIN } from "./admin";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import type {
  ProofKind,
  ProofQueueItem,
  ProofQueueList,
  ProofQueueStatus,
  ProofType,
} from "@/types/entryProofReview";

const client = createApiClient({
  baseURL: `${API_BASE_ADMIN}/candidates/entry-proofs`,
  getAuthToken,
  onAuthError: () => clearTokenCache(),
});

/** Only the fields the screen shows. */
const pickItem = (r: ProofQueueItem): ProofQueueItem => ({
  kind: r.kind,
  rowId: r.rowId,
  candidateId: r.candidateId,
  candidateName: r.candidateName,
  email: r.email ?? null,
  title: r.title,
  startDate: r.startDate ?? null,
  endDate: r.endDate ?? null,
  isPresent: r.isPresent === true,
  type: r.type ?? null,
  allowedTypes: Array.isArray(r.allowedTypes) ? r.allowedTypes : [],
  status: r.status,
  submittedAt: r.submittedAt ?? null,
  reviewedAt: r.reviewedAt ?? null,
  rejectReason: r.rejectReason ?? null,
  hasFile: r.hasFile === true,
  fileName: r.fileName ?? null,
  fms: r.fms
    ? {
        serialNumber: r.fms.serialNumber,
        certName: r.fms.certName,
        course: r.fms.course,
        imageUrl: r.fms.imageUrl ?? null,
        nameMatch: r.fms.nameMatch === true,
      }
    : null,
});

const path = (kind: ProofKind, rowId: string) =>
  `/${encodeURIComponent(kind)}/${encodeURIComponent(rowId)}`;

/** A failed blob request carries its JSON error as a Blob; read the server's message. */
async function blobErrorMessage(e: unknown): Promise<string> {
  const err = e as Error & { original?: { response?: { data?: unknown } } };
  const data = err.original?.response?.data;
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text()) as { message?: unknown };
      if (typeof body.message === "string" && body.message.trim()) return body.message;
    } catch {
      // not JSON
    }
  }
  return err.message || "Could not load this file.";
}

export const entryProofReviewApi = {
  async list(
    params: { status: ProofQueueStatus; kind: ProofKind; page: number; limit: number },
    signal?: AbortSignal
  ): Promise<ProofQueueList> {
    const res = await client.get("", {
      params: {
        status: params.status,
        kind: params.kind,
        page: String(params.page),
        limit: String(params.limit),
      },
      signal,
    });
    return {
      data: (res.data.data ?? []).map(pickItem),
      pagination: res.data.pagination,
      pendingCounts: res.data.pendingCounts ?? { experience: 0, education: 0 },
    };
  },

  async approve(kind: ProofKind, rowId: string, proofType: ProofType): Promise<void> {
    await client.post(`${path(kind, rowId)}/approve`, { proofType });
  },

  async reject(kind: ProofKind, rowId: string, reason: string): Promise<void> {
    await client.post(`${path(kind, rowId)}/reject`, { reason });
  },

  async getFile(kind: ProofKind, rowId: string, signal?: AbortSignal): Promise<Blob> {
    try {
      const res = await client.get(`${path(kind, rowId)}/file`, { responseType: "blob", signal });
      return res.data as Blob;
    } catch (e) {
      throw new Error(await blobErrorMessage(e));
    }
  },
};
