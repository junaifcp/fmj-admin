// src/pages/admin/recruiters/ActivityLog.tsx
// Recruiter admin 9.2: every admin action on the hiring side (AdminAuditLog).
// Read-only and append-only: there is no edit or delete here.
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminInsightsApi } from "@/api/adminInsights";
import type { AdminActivityRow, AuditLogFilters, Paged } from "@/types/recruiterAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, RefreshCw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { convertToCSV, downloadCSV } from "@/utils/csv";
import { fmtDateTime, personName } from "@/components/admin/recruiters/recruiterFormat";
import { PATHS, ownerDetailPath } from "@/routes/paths";

const PAGE_SIZE = 50;
const EXPORT_CAP = 5000;
const ALL = "all";

const ACTION_LABELS: Record<string, string> = {
  "recruiter.suspend": "Suspended recruiter",
  "recruiter.reactivate": "Reactivated recruiter",
  "recruiter.reonboard": "Sent back to onboarding",
  "recruiter.verify_profile": "Marked profile verified",
  "user.role_change": "Changed role",
  "company.verify": "Verified company",
  "company.reject": "Rejected company",
  "company.reset_pending": "Reset company to pending",
  "job.flag": "Flagged job",
  "job.unflag": "Unflagged job",
  "job.remove": "Removed job",
  "job.restore": "Restored job",
  "job.close": "Closed job",
  "job.poster_regenerate": "Regenerated poster",
  "jobdesk.assign": "Assigned employer job",
  "jobdesk.unassign": "Unassigned employer job",
  "jobdesk.set_plan": "Set job desk plan",
  "employer_share.revoke": "Revoked employer invite",
  "employer_share.resend": "Resent employer invite",
};

/** Prefix groups (the backend accepts a prefix or an exact action). */
const ACTION_GROUPS: [string, string][] = [
  ["recruiter", "Recruiters"],
  ["user", "Roles"],
  ["company", "Companies"],
  ["job", "Jobs"],
  ["jobdesk", "Job desk"],
  ["employer_share", "Employer invites"],
];

const TARGET_TYPES: [string, string][] = [
  ["recruiter", "Recruiter"],
  ["user", "User"],
  ["company", "Company"],
  ["job", "Job"],
  ["employerShare", "Employer invite"],
  ["employer", "Employer"],
  ["cvDrop", "CV drop"],
  ["careerPage", "Career page"],
  ["payment", "Payment"],
];

const R = PATHS.ADMIN.RECRUITERS_ADMIN;

/** Where a row's target opens. */
function targetHref(row: AdminActivityRow): string | null {
  const id = row.targetId;
  switch (row.targetType) {
    case "recruiter":
    case "user":
      return `${R.LIST}/${id}`;
    case "company":
      return `${PATHS.ADMIN.HIRING.COMPANIES}?tab=all&open=${id}`;
    case "job":
      return `${PATHS.ADMIN.HIRING.JOBS}?tab=all&open=${id}`;
    // Employer admin 4.1: employer targets. Their pages ship in 6.2 (employer),
    // 8.1 (cvDrop), 8.2 (careerPage) and 10.2 (payment); until then, no link.
    case "employer":
      return ownerDetailPath("employer", id);
    case "cvDrop":
    case "careerPage":
    case "payment":
      return null;
    case "employerShare":
      return R.EMPLOYER_INVITES;
    default:
      return null;
  }
}

const TARGET_LABELS = Object.fromEntries(TARGET_TYPES);

/** Spreadsheet-safe cell: a leading = + - @ would run as a formula. */
const safeCell = (v: unknown) => {
  const s = v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
};

const ChangeCell: React.FC<{ before: unknown; after: unknown }> = ({ before, after }) => (
  <div className="grid gap-2 sm:grid-cols-2 text-xs font-mono">
    <div>
      <div className="text-muted-foreground font-sans mb-1">Before</div>
      <pre className="whitespace-pre-wrap break-all rounded bg-muted/50 p-2">
        {before ? JSON.stringify(before, null, 2) : "—"}
      </pre>
    </div>
    <div>
      <div className="text-muted-foreground font-sans mb-1">After</div>
      <pre className="whitespace-pre-wrap break-all rounded bg-muted/50 p-2">
        {after ? JSON.stringify(after, null, 2) : "—"}
      </pre>
    </div>
  </div>
);

const ActivityLogPage: React.FC = () => {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paged<AdminActivityRow> | null>(null);
  const [actors, setActors] = useState<{ _id: string; email: string; name: string; actions: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters: AuditLogFilters = useMemo(() => {
    const f: AuditLogFilters = {};
    for (const k of ["actorId", "action", "targetType", "targetId"] as const) {
      const v = params.get(k);
      if (v) f[k] = v;
    }
    const from = params.get("from");
    const to = params.get("to");
    if (from) f.from = new Date(`${from}T00:00:00`).toISOString();
    if (to) f.to = new Date(`${to}T23:59:59.999`).toISOString();
    return f;
  }, [params]);

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => setPage(1), [filters]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    adminInsightsApi
      .auditLog(page, PAGE_SIZE, filters, { signal: ctrl.signal })
      .then(setResult)
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load the activity log");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [page, filters, reloadKey]);

  useEffect(() => {
    const ctrl = new AbortController();
    adminInsightsApi
      .auditActors({ signal: ctrl.signal })
      .then(setActors)
      .catch(() => {
        /* the filter just has no names */
      });
    return () => ctrl.abort();
  }, [reloadKey]);

  const exportCsv = async () => {
    try {
      setExporting(true);
      const rows: AdminActivityRow[] = [];
      for (let p = 1; rows.length < EXPORT_CAP; p++) {
        const res = await adminInsightsApi.auditLog(p, 100, filters);
        rows.push(...res.data);
        if (p >= res.pagination.totalPages || res.data.length === 0) break;
      }
      const capped = rows.slice(0, EXPORT_CAP);
      const csv = convertToCSV(
        capped.map((r) => ({
          time: safeCell(r.createdAt),
          admin: safeCell(r.actorId?.email ?? ""),
          adminRole: safeCell(r.actorRole),
          action: safeCell(r.action),
          targetType: safeCell(r.targetType),
          targetId: safeCell(r.targetId),
          reason: safeCell(r.reason ?? ""),
          before: safeCell(r.before ?? ""),
          after: safeCell(r.after ?? ""),
        }))
      );
      if (!csv) {
        toast({ title: "Nothing to export" });
        return;
      }
      downloadCSV(`activity-log-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      toast({
        title: `Exported ${capped.length} rows`,
        description: rows.length >= EXPORT_CAP ? `Capped at ${EXPORT_CAP}; narrow the filters for more.` : undefined,
      });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const rows = result?.data ?? [];
  const hasFilters = Array.from(params.keys()).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-extrabold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground mt-1">
          Every admin change on the hiring side: who did what, to whom, and why. Nothing here can be edited.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Admin actions</CardTitle>
              <CardDescription>{result ? `${result.pagination.total} entries` : "Loading…"}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReloadKey((n) => n + 1)}
                disabled={loading}
                aria-label="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button size="sm" variant="outline" onClick={exportCsv} disabled={exporting || !result?.pagination.total}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting…" : "Export CSV"}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={params.get("actorId") ?? ALL} onValueChange={(v) => setParam("actorId", v === ALL ? undefined : v)}>
              <SelectTrigger className="w-52" aria-label="Admin">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Admin: all</SelectItem>
                {actors.map((a) => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.name || a.email} ({a.actions})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={params.get("action") ?? ALL} onValueChange={(v) => setParam("action", v === ALL ? undefined : v)}>
              <SelectTrigger className="w-52" aria-label="Action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Action: all</SelectItem>
                {ACTION_GROUPS.map(([prefix, label]) => (
                  <SelectItem key={prefix} value={prefix}>
                    {label}: any
                  </SelectItem>
                ))}
                {Object.entries(ACTION_LABELS).map(([a, label]) => (
                  <SelectItem key={a} value={a}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={params.get("targetType") ?? ALL}
              onValueChange={(v) => setParam("targetType", v === ALL ? undefined : v)}
            >
              <SelectTrigger className="w-44" aria-label="Target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Target: all</SelectItem>
                {TARGET_TYPES.map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              From
              <input
                type="date"
                aria-label="From"
                value={params.get("from") ?? ""}
                onChange={(e) => setParam("from", e.target.value || undefined)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              />
              to
              <input
                type="date"
                aria-label="To"
                value={params.get("to") ?? ""}
                onChange={(e) => setParam("to", e.target.value || undefined)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              />
            </div>
            {params.get("targetId") && (
              <Button variant="outline" size="sm" onClick={() => setParam("targetId")}>
                One target <X className="h-4 w-4 ml-1" />
              </Button>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading && !result ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className={loading ? "opacity-60" : undefined}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead>When</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {hasFilters ? "No actions match these filters" : "No admin actions yet"}
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((r) => {
                      const open = expanded === r._id;
                      const href = targetHref(r);
                      return (
                        <React.Fragment key={r._id}>
                          <TableRow className="cursor-pointer" onClick={() => setExpanded(open ? null : r._id)}>
                            <TableCell>
                              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {fmtDateTime(r.createdAt)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {personName(r.actorId)}
                              {r.actorRole === "superadmin" && (
                                <span className="text-xs text-muted-foreground"> · super</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{ACTION_LABELS[r.action] ?? r.action}</TableCell>
                            <TableCell className="text-sm">
                              {href ? (
                                <Link
                                  to={href}
                                  className="text-primary hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {TARGET_LABELS[r.targetType] ?? r.targetType}
                                </Link>
                              ) : (
                                TARGET_LABELS[r.targetType] ?? r.targetType
                              )}
                              <button
                                type="button"
                                className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                                title="Show every action on this target"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setParam("targetId", r.targetId);
                                }}
                              >
                                history
                              </button>
                            </TableCell>
                            <TableCell className="text-sm max-w-xs truncate" title={r.reason ?? ""}>
                              {r.reason || <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          </TableRow>
                          {open && (
                            <TableRow>
                              <TableCell />
                              <TableCell colSpan={5}>
                                {r.reason && <p className="text-sm mb-2 whitespace-pre-line">{r.reason}</p>}
                                <ChangeCell before={r.before} after={r.after} />
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {result && result.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 text-sm">
                  <span className="text-muted-foreground">
                    Page {result.pagination.page} of {result.pagination.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1 || loading} aria-label="Previous page">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= result.pagination.totalPages || loading} aria-label="Next page">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogPage;
