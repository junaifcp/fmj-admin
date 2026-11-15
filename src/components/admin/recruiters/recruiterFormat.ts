// Recruiter admin 5.2: formatting helpers shared by the recruiter pages.

export const MIN_REASON = 5;

export const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const personName = (p?: { firstName?: string; lastName?: string; email?: string } | null) =>
  p ? [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email || "—" : "—";
