// src/types/entryProofReview.ts
// Candidate full view 6.2: one career proof (a job, degree or course) in the
// admin queue. The API never sends a file key or URL; files stream by row.

export type ProofKind = "experience" | "education";
export type ProofQueueStatus = "pending" | "rejected" | "verified";

export type ProofType =
  | "offer_letter"
  | "relieving_letter"
  | "experience_letter"
  | "promotion_letter"
  | "payslip"
  | "company_hr_email"
  | "company_id_card"
  | "degree_certificate"
  | "marksheet"
  | "provisional_certificate"
  | "course_certificate"
  | "fms_certificate";

export interface ProofQueueItem {
  kind: ProofKind;
  rowId: string;
  candidateId: string;
  candidateName: string;
  email: string | null;
  title: string;
  startDate: string | null;
  endDate: string | null;
  isPresent: boolean;
  type: ProofType | null;
  allowedTypes: ProofType[];
  status: ProofQueueStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  hasFile: boolean;
  fileName: string | null;
  fms: {
    serialNumber: string;
    certName: string;
    course: string;
    imageUrl: string | null;
    nameMatch: boolean;
  } | null;
}

export interface ProofQueueList {
  data: ProofQueueItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  pendingCounts: { experience: number; education: number };
}
