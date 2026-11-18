// src/types/verificationReview.ts
// Candidate verification approval: one submitted identity document.
// The API never sends a file key or URL; files are streamed by id.

/** Stored status. The screen labels `verified` as Approved. */
export type VerificationReviewStatus = "pending" | "verified";

/** The list filter sent as `status`. */
export type VerificationReviewFilter = "pending" | "verified" | "all";

export type VerificationSide = "front" | "back";

/** A stream the admin can open: a stored side, or `photo` (the DigiLocker Aadhaar photo). */
export type VerificationFileSide = VerificationSide | "photo";

export type VerificationSource = "manual" | "digilocker";

/** DigiLocker rows only. `name` is the DigiLocker name; the row's `name` is the profile name. */
export interface VerificationDigilockerDetails {
  /** '' when DigiLocker gave none. */
  name: string;
  /** YYYY-MM-DD, or '' */
  dob: string;
  gender?: "M" | "F" | "T";
  /** Last 4 characters of the document number, or ''. */
  last4: string;
  /** Issuing body, e.g. "Income Tax Department". */
  issuer?: string;
  hasPhoto: boolean;
  /** The e-Aadhaar XML is stored (it is not when it held a full Aadhaar number). */
  hasXml: boolean;
}

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
  source: VerificationSource;
  digilocker?: VerificationDigilockerDetails;
}

export interface VerificationReviewList {
  data: VerificationReviewRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
