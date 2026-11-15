// Employer job flow 2.3: the backend Application.status set with the staff
// labels (docs/employer-job-flow/locked-decisions.md, "Statuses"). Admin pages
// only read statuses. Company and taxonomy `rejected` are not application
// statuses and are not here.

export type ApplicationStatus =
  | "applied"
  | "fit"
  | "not_fit"
  | "shortlisted"
  | "hired"
  | "withdrawn";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "New",
  fit: "Fit",
  not_fit: "Not fit",
  shortlisted: "Shortlisted",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

/** Chart colours (recharts needs a colour value, not a class). */
export const APPLICATION_STATUS_CHART_COLORS: Record<
  ApplicationStatus,
  string
> = {
  applied: "#94a3b8",
  fit: "#3b82f6",
  shortlisted: "#8b5cf6",
  hired: "#10b981",
  not_fit: "#ef4444",
  withdrawn: "#f59e0b",
};

/** Values stored before the 2.2 migration, mapped like the backend. Removed in 7.1. */
const LEGACY_STATUS_MAP: Record<string, ApplicationStatus> = {
  pending: "applied",
  reviewed: "shortlisted",
  screened: "shortlisted",
  interview: "shortlisted",
  offer: "shortlisted",
  rejected: "not_fit",
};

/** A stored value as a status in the new set, or null when it is not a status. */
export function toApplicationStatus(
  value: string | undefined | null,
): ApplicationStatus | null {
  const v = (value || "").toLowerCase();
  if (v in APPLICATION_STATUS_LABELS) return v as ApplicationStatus;
  return LEGACY_STATUS_MAP[v] ?? null;
}

/** The label for a stored value; an unknown value is shown as it is. */
export function applicationStatusLabel(
  value: string | undefined | null,
): string {
  const s = toApplicationStatus(value);
  return s ? APPLICATION_STATUS_LABELS[s] : value || "—";
}

export function applicationStatusChartColor(
  value: string | undefined | null,
): string {
  const s = toApplicationStatus(value);
  return s ? APPLICATION_STATUS_CHART_COLORS[s] : "#94a3b8";
}
