// src/types/verificationReview.ts
// Candidate verification approval: one submitted identity document.
// The API never sends a file key or URL; files are streamed by id.

/** Stored status. The screen labels `verified` as Approved. */
export type VerificationReviewStatus = "pending" | "verified";

/** The list filter sent as `status`. */
export type VerificationReviewFilter = "pending" | "verified" | "all";

export type VerificationSide = "front" | "back";

export interface VerificationReviewRow {
  candidateId: string;
  userId: string;
  name: string;
  email: string;
  type: string;
  typeLabel: string;
  status: VerificationReviewStatus;
  submittedAt: string;
  sides: VerificationSide[];
  frontFileName: string;
  backFileName?: string;
}

export interface VerificationReviewList {
  data: VerificationReviewRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
