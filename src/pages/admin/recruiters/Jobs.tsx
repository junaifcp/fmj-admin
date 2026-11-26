// src/pages/admin/recruiters/Jobs.tsx
// Recruiter admin 7.2: every job on FitMyJob, with a moderation queue.
// All filters live in the URL so other pages can link here pre-filtered
// (e.g. ?tab=all&posterStatus=failed&status=active, ?recruiterId=...).
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { adminJobsApi } from "@/api/adminJobs";
import type {
  AdminJobDetail,
  AdminJobFilters,
  AdminJobRow,
  AdminJobsResult,
  JobModerationStatus,
} from "@/types/recruiterAdmin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, ExternalLink, RefreshCw, Search, X } from "lucide-react";
import { CompanyVerificationBadge } from "@/components/admin/recruiters/RecruiterBits";
import {
  AutoFlagChips,
  JobActionsMenu,
  ModerationBadge,
} from "@/components/admin/recruiters/JobModeration";
import { fmtDate, fmtDateTime, personName } from "@/components/admin/recruiters/recruiterFormat";
import OwnerLink from "@/components/admin/hiring/OwnerLink";

type Tab = "flagged" | "removed" | "all";
const TABS: { value: Tab; label: string }[] = [
  { value: "flagged", label: "Flagged" },
  { value: "removed", label: "Removed" },
  { value: "all", label: "All" },
];
const PAGE_SIZE = 20;
const ALL = "all";

/** URL keys that are plain filters (sent to the API as-is). */
const FILTER_KEYS = [
  "status",
  "type",
  "posterStatus",
  "postedByRole",
  "companyVerified",
  "city",
  "from",
  "to",
  "minApplications",
  "recruiterId",
  "companyId",
] as const;

const SELECTS: { key: (typeof FILTER_KEYS)[number]; label: string; options: [string, string][] }[] = [
  { key: "status", label: "Status", options: [["active", "Active"], ["paused", "Paused"], ["closed", "Closed"]] },
  {
    key: "type",
    label: "Type",
    options: [["full-time", "Full-time"], ["part-time", "Part-time"], ["contract", "Contract"], ["internship", "Internship"], ["work-from-home", "Work from home"]],
  },
  { key: "postedByRole", label: "Posted by", options: [["recruiter", "Recruiters"], ["employer", "Employers"]] },
  {
    key: "companyVerified",
    label: "Company",
    options: [["pending", "Company pending"], ["verified", "Company verified"], ["rejected", "Company rejected"]],
  },
  { key: "posterStatus", label: "Poster", options: [["ready", "Poster ready"], ["pending", "Poster pending"], ["failed", "Poster failed"]] },
];

const ACTION_LABELS: Record<string, string> = {
  "job.flag": "Flagged",
  "job.unflag": "Unflagged",
  "job.remove": "Removed",
  "job.restore": "Restored",
  "job.close": "Closed",
  "job.poster_regenerate": "Poster regenerated",
};

const stripHtml = (html?: string) =>
  (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const money = (n?: number) => (n != null ? n.toLocaleString() : "");

const PersonLink: React.FC<{ p: { _id: string; email: string; name?: string; role?: string } | null }> = ({ p }) => {
  if (!p) return <span className="text-muted-foreground">—</span>;
  const label = p.name || p.email;
  return (
    <OwnerLink id={p._id} role={p.role}>
      {label}
    </OwnerLink>
  );
};

const JobsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: Tab = tabParam === "removed" || tabParam === "all" || tabParam === "flagged" ? tabParam : "flagged";
  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AdminJobsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // ?open=<jobId> opens the drawer (links from Applications and the Activity Log).
  const [openId, setOpenIdState] = useState<string | null>(params.get("open"));
  const setOpenId = (id: string | null) => {
    setOpenIdState(id);
    if (!id && params.get("open")) {
      const next = new URLSearchParams(params);
      next.delete("open");
      setParams(next, { replace: true });
    }
  };
  const [detail, setDetail] = useState<AdminJobDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const setParam = useCallback(
    (key: string, value?: string) => {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  // Debounced search into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== searchInput.trim()) setParam("q", searchInput.trim() || undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, params, setParam]);

  const filters: AdminJobFilters = useMemo(() => {
    const f: Record<string, string> = {};
    for (const k of FILTER_KEYS) {
      const v = params.get(k);
      if (v) f[k] = v;
    }
    const q = params.get("q");
    if (q) f.q = q;
    if (f.from) f.from = new Date(`${f.from}T00:00:00`).toISOString();
    if (f.to) f.to = new Date(`${f.to}T23:59:59.999`).toISOString();
    if (tab !== "all") f.moderation = tab as JobModerationStatus;
    return f as AdminJobFilters;
  }, [params, tab]);

  useEffect(() => setPage(1), [filters]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    adminJobsApi
      .list(page, PAGE_SIZE, filters, { signal: ctrl.signal })
      .then((r) => {
        setResult(r);
        // Flagged is the default only while something is flagged.
        if (!tabParam && tab === "flagged" && r.counts.flagged === 0) setParam("tab", "all");
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load jobs");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
    // setParam/tabParam are read at response time only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters, reloadKey]);

  const loadDetail = useCallback((id: string, signal?: AbortSignal) => {
    setDetailError(null);
    return adminJobsApi
      .get(id, { signal })
      .then(setDetail)
      .catch((e) => {
        if (!signal?.aborted) setDetailError(e instanceof Error ? e.message : "Failed to load");
      });
  }, []);

  useEffect(() => {
    if (!openId) return;
    const ctrl = new AbortController();
    setDetail(null);
    loadDetail(openId, ctrl.signal);
    return () => ctrl.abort();
  }, [openId, loadDetail]);

  const afterAction = () => {
    setReloadKey((n) => n + 1);
    if (openId) loadDetail(openId);
  };

  const rows = result?.data ?? [];
  const counts = result?.counts;
  const activeFilterCount = FILTER_KEYS.filter((k) => params.get(k)).length + (params.get("q") ? 1 : 0);
  const clearFilters = () => {
    const next = new URLSearchParams();
    if (tabParam) next.set("tab", tabParam);
    setSearchInput("");
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-extrabold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground mt-1">Every job on FitMyJob, and the moderation queue</p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Moderation</CardTitle>
              <CardDescription>
                Flagged jobs stay live. Removed jobs are hidden everywhere public.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReloadKey((n) => n + 1)}
              disabled={loading}
              aria-label="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <Tabs value={tab} onValueChange={(v) => setParam("tab", v)}>
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                  {counts && (
                    <span className="ml-1 text-muted-foreground">
                      ({t.value === "all" ? counts.all : counts[t.value]})
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Job title"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 w-52"
              />
            </div>
            {SELECTS.map((s) => (
              <Select
                key={s.key}
                value={params.get(s.key) ?? ALL}
                onValueChange={(v) => setParam(s.key, v === ALL ? undefined : v)}
              >
                <SelectTrigger className="w-40" aria-label={s.label}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{`${s.label}: all`}</SelectItem>
                  {s.options.map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            <Input
              key={`city-${params.get("city") ?? ""}`}
              placeholder="City"
              defaultValue={params.get("city") ?? ""}
              onBlur={(e) => setParam("city", e.target.value.trim() || undefined)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setParam("city", (e.target as HTMLInputElement).value.trim() || undefined);
              }}
              className="w-32"
              aria-label="City"
            />
            <Input
              key={`min-${params.get("minApplications") ?? ""}`}
              type="number"
              min={0}
              placeholder="Min apps"
              defaultValue={params.get("minApplications") ?? ""}
              onBlur={(e) => setParam("minApplications", e.target.value || undefined)}
              className="w-28"
              aria-label="Minimum applications"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Created
              <input
                type="date"
                aria-label="Created from"
                value={params.get("from") ?? ""}
                onChange={(e) => setParam("from", e.target.value || undefined)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              />
              to
              <input
                type="date"
                aria-label="Created to"
                value={params.get("to") ?? ""}
                onChange={(e) => setParam("to", e.target.value || undefined)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              />
            </div>
            {params.get("recruiterId") && (
              <Button variant="outline" size="sm" onClick={() => setParam("recruiterId")}>
                One recruiter <X className="h-4 w-4 ml-1" />
              </Button>
            )}
            {params.get("companyId") && (
              <Button variant="outline" size="sm" onClick={() => setParam("companyId")}>
                One company <X className="h-4 w-4 ml-1" />
              </Button>
            )}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
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
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className={loading ? "opacity-60" : undefined}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Posted by</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Moderation</TableHead>
                      <TableHead className="text-right">Apps</TableHead>
                      <TableHead>Poster</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          {tab === "flagged" ? "Nothing flagged" : "No jobs match these filters"}
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((j: AdminJobRow) => (
                      <TableRow key={j._id} className="cursor-pointer" onClick={() => setOpenId(j._id)}>
                        <TableCell>
                          <div className="font-medium flex items-center gap-1">
                            {j.title}
                            {j.publicUrl && j.moderation.status !== "removed" && (
                              <a
                                href={j.publicUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                aria-label="Open public job page"
                                className="text-muted-foreground hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {[j.city, j.type].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{j.company?.name ?? "—"}</div>
                          {j.company && <CompanyVerificationBadge value={j.company.verified} />}
                        </TableCell>
                        <TableCell className="text-sm">
                          <PersonLink p={j.postedBy} />
                          <div className="text-xs text-muted-foreground capitalize">
                            {j.postedBy?.role ?? ""}
                            {j.assignedRecruiter && (
                              <>
                                {" "}· claimed by <PersonLink p={j.assignedRecruiter} />
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize text-sm">{j.status}</TableCell>
                        <TableCell>
                          <ModerationBadge status={j.moderation.status} />
                          <AutoFlagChips flags={j.moderation.autoFlags} />
                        </TableCell>
                        <TableCell className="text-right">{j.applicationCount}</TableCell>
                        <TableCell className="text-sm capitalize">
                          {j.posterStatus === "failed" ? (
                            <span className="text-destructive">Failed</span>
                          ) : (
                            j.posterStatus ?? "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(j.createdAt)}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <JobActionsMenu
                            jobId={j._id}
                            jobTitle={j.title}
                            status={j.status}
                            moderationStatus={j.moderation.status}
                            posterStatus={j.posterStatus}
                            onDone={afterAction}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {result && result.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 text-sm">
                  <span className="text-muted-foreground">
                    Page {result.pagination.page} of {result.pagination.totalPages} · {result.pagination.total} jobs
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page <= 1 || loading}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= result.pagination.totalPages || loading}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Job drawer */}
      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detailError ? (
            <Alert variant="destructive" className="mt-8">
              <AlertDescription>{detailError}</AlertDescription>
            </Alert>
          ) : !detail ? (
            <div className="space-y-4 mt-8">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <SheetHeader className="text-left">
                <SheetTitle>{detail.title}</SheetTitle>
                <SheetDescription>
                  {detail.companyId?.name ?? "No company"} · created {fmtDate(detail.createdAt)} ·{" "}
                  {detail.applicationCount} application{detail.applicationCount === 1 ? "" : "s"}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {detail.status}
                </Badge>
                <ModerationBadge status={detail.moderation.status} />
                <div className="ml-auto">
                  <JobActionsMenu
                    jobId={detail._id}
                    jobTitle={detail.title}
                    status={detail.status}
                    moderationStatus={detail.moderation.status}
                    posterStatus={detail.posterStatus}
                    onDone={afterAction}
                    triggerLabel="Actions"
                  />
                </div>
              </div>

              {detail.moderation.status !== "none" && (
                <Alert variant={detail.moderation.status === "removed" ? "destructive" : "default"}>
                  <AlertDescription>
                    <div className="font-medium">
                      {detail.moderation.status === "removed" ? "Removed" : "Flagged"}{" "}
                      {fmtDateTime(detail.moderation.at)}
                      {detail.moderation.by ? ` by ${personName(detail.moderation.by)}` : " automatically"}
                    </div>
                    {detail.moderation.reason && <div>{detail.moderation.reason}</div>}
                  </AlertDescription>
                </Alert>
              )}
              <AutoFlagChips flags={detail.moderation.autoFlags} />

              <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Salary</dt>
                <dd className="col-span-2">
                  {detail.salary?.min || detail.salary?.max
                    ? `${detail.salary?.currency ?? ""} ${money(detail.salary?.min)}–${money(detail.salary?.max)}`.trim()
                    : "—"}
                </dd>
                <dt className="text-muted-foreground">Location</dt>
                <dd className="col-span-2">
                  {detail.location?.formattedAddress || detail.location?.city || "—"}
                </dd>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="col-span-2 capitalize">{detail.type ?? "—"}</dd>
                <dt className="text-muted-foreground">Experience</dt>
                <dd className="col-span-2">
                  {detail.experienceYears != null ? `${detail.experienceYears}+ years` : "—"}
                </dd>
                <dt className="text-muted-foreground">Posted by</dt>
                <dd className="col-span-2">
                  {detail.postedBy ? (
                    <PersonLink
                      p={{
                        _id: detail.postedBy._id,
                        email: detail.postedBy.email,
                        name: personName(detail.postedBy),
                        role: detail.postedBy.role,
                      }}
                    />
                  ) : (
                    "—"
                  )}
                  {detail.postedBy?.role && (
                    <span className="text-muted-foreground capitalize"> · {detail.postedBy.role}</span>
                  )}
                </dd>
                {detail.assignedRecruiterId && (
                  <>
                    <dt className="text-muted-foreground">Claimed by</dt>
                    <dd className="col-span-2">
                      <PersonLink
                        p={{
                          _id: detail.assignedRecruiterId._id,
                          email: detail.assignedRecruiterId.email,
                          name: personName(detail.assignedRecruiterId),
                          role: "recruiter",
                        }}
                      />
                    </dd>
                  </>
                )}
                <dt className="text-muted-foreground">Public link</dt>
                <dd className="col-span-2 break-all">
                  {detail.publicUrl ? (
                    <a
                      href={detail.publicUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {detail.publicUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    "—"
                  )}
                  {detail.moderation.status === "removed" && (
                    <div className="text-xs text-muted-foreground">Returns "not found" while removed</div>
                  )}
                </dd>
              </dl>

              {detail.skills && detail.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {detail.skills.map((s) => (
                    <Badge key={s._id} variant="outline">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              )}

              {(detail.summary || detail.description) && (
                <div className="space-y-2 text-sm">
                  {detail.summary && <p className="font-medium">{detail.summary}</p>}
                  {detail.description && (
                    <p className="text-muted-foreground whitespace-pre-line line-clamp-[12]">
                      {stripHtml(detail.description)}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2 border-t pt-4">
                <h4 className="text-sm font-medium">Moderation history</h4>
                {detail.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No admin actions yet</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.history.map((h) => (
                      <li key={h._id} className="text-sm">
                        <span className="font-medium">{ACTION_LABELS[h.action] ?? h.action}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {personName(h.actorId)} · {fmtDateTime(h.createdAt)}
                        </span>
                        {h.reason && <div className="text-muted-foreground">{h.reason}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default JobsPage;
