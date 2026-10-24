// src/api/verificationReview.ts
// Candidate verification approval: list, approve, and the admin file stream.
import { createApiClient } from "./apiClient";
import { API_BASE_ADMIN } from "./admin";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import type {
  VerificationReviewFilter,
  VerificationReviewList,
  VerificationReviewRow,
  VerificationSide,
} from "@/types/verificationReview";

const client = createApiClient({
  baseURL: `${API_BASE_ADMIN}/candidates/verifications`,
  getAuthToken,
  onAuthError: () => clearTokenCache(),
});

/** Only the fields the screen shows, so nothing else in a response is kept or rendered. */
const pickRow = (r: VerificationReviewRow): VerificationReviewRow => ({
  candidateId: r.candidateId,
  userId: r.userId,
  name: r.name,
  email: r.email,
  type: r.type,
  typeLabel: r.typeLabel,
  status: r.status,
  submittedAt: r.submittedAt,
  sides: r.sides,
  frontFileName: r.frontFileName,
  ...(r.backFileName ? { backFileName: r.backFileName } : {}),
});

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

export const verificationReviewApi = {
  async list(
    params: { status: VerificationReviewFilter; page: number; limit: number },
    signal?: AbortSignal
  ): Promise<VerificationReviewList> {
    const res = await client.get("", {
      params: { status: params.status, page: String(params.page), limit: String(params.limit) },
      signal,
    });
    return { data: (res.data.data ?? []).map(pickRow), pagination: res.data.pagination };
  },

  async approve(candidateId: string, type: string): Promise<VerificationReviewRow> {
    const res = await client.post(
      `/${encodeURIComponent(candidateId)}/${encodeURIComponent(type)}/approve`
    );
    return pickRow(res.data.data);
  },

  /** The stored file for the admin, as bytes. Never a URL from the server. */
  async getFile(
    candidateId: string,
    type: string,
    side: VerificationSide,
    signal?: AbortSignal
  ): Promise<Blob> {
    try {
      const res = await client.get(
        `/${encodeURIComponent(candidateId)}/${encodeURIComponent(type)}/${side}`,
        { responseType: "blob", signal }
      );
      return res.data as Blob;
    } catch (e) {
      throw new Error(await blobErrorMessage(e));
    }
  },
};
