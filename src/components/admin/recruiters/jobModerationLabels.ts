// Recruiter admin 7.2: labels for job moderation.
import type { JobAutoFlag, JobModerationAction, JobModerationStatus } from "@/types/recruiterAdmin";

export const AUTO_FLAG_LABELS: Record<JobAutoFlag, string> = {
  unverified_company: "Unverified company",
  salary_outlier: "Salary outlier",
  duplicate_recent: "Recent duplicate",
};

/** Flags that put a job in the Flagged queue (unverified company is shown only). */
export const QUEUE_FLAGS: JobAutoFlag[] = ["salary_outlier", "duplicate_recent"];

export const MODERATION_LABELS: Record<JobModerationStatus, string> = {
  none: "OK",
  flagged: "Flagged",
  removed: "Removed",
};

export const JOB_ACTIONS: Record<
  JobModerationAction | "poster",
  { label: string; title: string; description: string; confirm: string; destructive?: boolean; reason: boolean }
> = {
  flag: {
    label: "Flag…",
    title: "Flag job",
    description: "The job stays live and appears in the Flagged queue for review.",
    confirm: "Flag",
    reason: true,
  },
  unflag: {
    label: "Unflag",
    title: "Unflag job",
    description: "Marks the job as reviewed. Nightly auto-flags won't put it back in the queue.",
    confirm: "Unflag",
    reason: false,
  },
  remove: {
    label: "Remove from FitMyJob…",
    title: "Remove job",
    description:
      "The job disappears from the public site, search, career pages and the job desk. The recruiter sees it with your reason and can't make it active again.",
    confirm: "Remove",
    destructive: true,
    reason: true,
  },
  restore: {
    label: "Restore…",
    title: "Restore job",
    description: "The job is public again if its own status is active.",
    confirm: "Restore",
    reason: true,
  },
  close: {
    label: "Close…",
    title: "Close job",
    description: "Sets the job to closed, as if the recruiter closed it. It stops taking applications.",
    confirm: "Close job",
    destructive: true,
    reason: true,
  },
  poster: {
    label: "Regenerate poster",
    title: "Regenerate poster",
    description: "Queues the hiring poster again. The 'job posted' message is not sent twice.",
    confirm: "Regenerate",
    reason: false,
  },
};

export type ActionKey = JobModerationAction | "poster";

/** Which actions make sense for a job right now. */
export function availableJobActions(job: {
  status: string;
  moderationStatus: JobModerationStatus;
  posterStatus?: string | null;
}): ActionKey[] {
  const out: ActionKey[] = [];
  if (job.moderationStatus === "none") out.push("flag");
  if (job.moderationStatus === "flagged") out.push("unflag");
  if (job.moderationStatus !== "removed") out.push("remove");
  if (job.moderationStatus === "removed") out.push("restore");
  if (job.status !== "closed") out.push("close");
  if (job.posterStatus === "failed") out.push("poster");
  return out;
}

