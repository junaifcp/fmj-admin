// src/pages/admin/employers/EmployersPage.tsx
// Employer admin 6.2: All Employers. Every filter lives in the URL, so links
// from the Overview (e.g. a campaign row) open the list already filtered.
// Row click opens Employer Detail, where every employer action happens.
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { employerAdminApi } from "@/api/employerAdmin";
import type { Paged } from "@/types/recruiterAdmin";
import type { EmployerListFilters, EmployerListRow } from "@/types/employerAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CompanyVerificationBadge, RecruiterStatusBadge } from "@/components/admin/recruiters/RecruiterBits";
import { fmtDate } from "@/components/admin/recruiters/recruiterFormat";
import {
  CHANNEL_LABELS,
  DRAFT_STEP_LABELS,
} from "@/components/admin/employers/employerLabels";
import SourceBadge from "@/components/admin/employers/SourceBadge";
import { PATHS } from "@/routes/paths";
import { HiringAccountActions } from "@/components/admin/hiring/HiringAccountActions";

const PAGE_SIZE = 20;
const ALL = "all";

type SelectKey =
  | "status"
  | "source"
  | "channel"
  | "hasCompany"
  | "posted"
  | "companyVerified"
  | "lastActiveWithin";

const FILTER_SELECTS: { key: SelectKey; placeholder: string; options: [string, string][] }[] = [
  { key: "status", placeholder: "Status", options: [["active", "Active"], ["suspended", "Deactivated"], ["deleted", "Deleted"]] },
  {
    key: "source",
    placeholder: "Source",
    options: [["ad_landing", "Ad landing"], ["dashboard", "Dashboard"], ["invite", "Invite"]],
  },
  {
    key: "channel",
    placeholder: "Channel",
    options: [["meta_paid", "Meta ads"], ["direct", "Direct"]],
  },
  { key: "hasCompany", placeholder: "Company", options: [["true", "Has a company"], ["false", "No company"]] },
  {
    key: "companyVerified",
    placeholder: "Verification",
    options: [["pending", "Company pending"], ["verified", "Company verified"], ["rejected", "Company rejected"]],
  },
  { key: "posted", placeholder: "Posted", options: [["true", "Posted a job"], ["false", "Never posted"]] },
  {
    key: "lastActiveWithin",
    placeholder: "Last active",
    options: [["7", "Active in 7 days"], ["30", "Active in 30 days"], ["90", "Active in 90 days"]],
  },
];

const SORTS: [string, string][] = [
  ["createdAt:desc", "Newest first"],
  ["createdAt:asc", "Oldest first"],
  ["lastActive:desc", "Recently active"],
  ["applications:desc", "Most applications"],
  ["jobs:desc", "Most jobs"],
];

const URL_KEYS = [...FILTER_SELECTS.map((f) => f.key), "search", "utmCampaign", "joinedFrom", "joinedTo"];

const EmployersPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<Paged<EmployerListRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const page = Math.max(1, Number(params.get("page")) || 1);
  const sort = params.get("sort") ?? SORTS[0][0];

  /** Set or clear URL params; any filter change goes back to page 1. */
  const update = (changes: Record<string, string | undefined>, keepPage = false) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!keepPage) next.delete("page");
    setParams(next, { replace: true });
  };

  // Debounce the search box into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      const v = searchInput.trim();
      if (v !== (params.get("search") ?? "")) update({ search: v || undefined });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const filters: EmployerListFilters = useMemo(() => {
    const [sortBy, sortOrder] = sort.split(":") as [
      EmployerListFilters["sortBy"],
      EmployerListFilters["sortOrder"],
    ];
    const f: Record<string, string> = {};
    for (const k of URL_KEYS) {
      const v = params.get(k);
      if (v) f[k] = v;
    }
    if (f.joinedFrom) f.joinedFrom = new Date(`${f.joinedFrom}T00:00:00`).toISOString();
    if (f.joinedTo) f.joinedTo = new Date(`${f.joinedTo}T23:59:59.999`).toISOString();
    return { ...(f as EmployerListFilters), sortBy, sortOrder };
  }, [params, sort]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setResult(await employerAdminApi.list(page, PAGE_SIZE, filters, { signal: ctrl.signal }));
        setSelected([]);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load employers");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [page, filters, reloadKey]);

  const rows = result?.data ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r._id));
  const hasFilters = URL_KEYS.some((k) => !!params.get(k));

  const clearFilters = () => {
    setSearchInput("");
    update(Object.fromEntries(URL_KEYS.map((k) => [k, undefined])));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await employerAdminApi.exportCsv(selected, filters);
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const openRow = (id: string) => navigate(`${PATHS.ADMIN.EMPLOYERS_ADMIN.LIST}/${id}`);
  const campaign = params.get("utmCampaign");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-extrabold tracking-tight">Employers</h1>
        <p className="text-muted-foreground mt-1">Employer accounts on FitMyJob</p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Employers</CardTitle>
              <CardDescription>
                {result ? `${result.pagination.total} employers` : "Loading employers..."}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={sort} onValueChange={(v) => update({ sort: v === SORTS[0][0] ? undefined : v })}>
                <SelectTrigger className="w-44" aria-label="Sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setReloadKey((n) => n + 1)}
                size="sm"
                variant="outline"
                disabled={loading}
                aria-label="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button onClick={handleExport} size="sm" variant="outline" disabled={exporting || !result?.pagination.total}>
                <Download className="h-4 w-4 mr-2" />
                {selected.length ? `Export (${selected.length})` : "Export filtered"}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Name, email or company"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            {FILTER_SELECTS.map((f) => (
              <Select
                key={f.key}
                value={params.get(f.key) ?? ALL}
                onValueChange={(v) => update({ [f.key]: v === ALL ? undefined : v })}
              >
                <SelectTrigger className="w-44" aria-label={f.placeholder}>
                  <SelectValue placeholder={f.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{`${f.placeholder}: all`}</SelectItem>
                  {f.options.map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Joined
              <input
                type="date"
                aria-label="Joined from"
                value={params.get("joinedFrom") ?? ""}
                onChange={(e) => update({ joinedFrom: e.target.value || undefined })}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              />
              to
              <input
                type="date"
                aria-label="Joined to"
                value={params.get("joinedTo") ?? ""}
                onChange={(e) => update({ joinedTo: e.target.value || undefined })}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              />
            </div>
            {campaign && (
              <Badge variant="secondary" className="gap-1">
                Campaign: {campaign}
                <button
                  type="button"
                  aria-label="Remove campaign filter"
                  onClick={() => update({ utmCampaign: undefined })}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {hasFilters && (
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
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className={loading ? "opacity-60" : undefined}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          aria-label="Select all"
                          checked={allSelected}
                          disabled={rows.length === 0}
                          onCheckedChange={(c) => setSelected(c ? rows.map((r) => r._id) : [])}
                        />
                      </TableHead>
                      <TableHead>Employer</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Jobs</TableHead>
                      <TableHead className="text-right">Applications</TableHead>
                      <TableHead>Draft</TableHead>
                      <TableHead className="text-right">CV drops</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last active</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-16 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                          {hasFilters ? "No employers match these filters" : "No employers yet"}
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((r) => (
                      <TableRow key={r._id} className="cursor-pointer" onClick={() => openRow(r._id)}>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            aria-label={`Select ${r.email}`}
                            checked={selected.includes(r._id)}
                            onCheckedChange={(c) =>
                              setSelected((prev) => (c ? [...prev, r._id] : prev.filter((id) => id !== r._id)))
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{r.name || r.email}</div>
                          {r.name && <div className="text-xs text-muted-foreground">{r.email}</div>}
                          {(r.phone || r.whatsapp) && (
                            <div className="text-xs text-muted-foreground">
                              {r.phone ?? ""}
                              {r.whatsapp ? `${r.phone ? " · " : ""}WA ${r.whatsapp}` : ""}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-[220px] truncate" title={r.company?.name}>
                            {r.company?.name || "—"}
                          </div>
                          {r.company && <CompanyVerificationBadge value={r.company.verified} />}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {r.stats.activeJobs}/{r.stats.jobs}
                          <div className="text-xs text-muted-foreground">active/total</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {r.stats.applications}
                          {r.stats.hires > 0 && (
                            <div className="text-xs text-muted-foreground">{r.stats.hires} hired</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.openDraftStep ? (
                            <span className="text-amber-700">{DRAFT_STEP_LABELS[r.openDraftStep]}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {r.cvDrops.total ? (
                            <>
                              {r.cvDrops.total}
                              {r.cvDrops.new > 0 && (
                                <div className="text-xs text-amber-700">{r.cvDrops.new} new</div>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <SourceBadge source={r.source} />
                          {(r.utmCampaign || r.channel) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {r.utmCampaign || CHANNEL_LABELS[r.channel ?? ""] || r.channel}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(r.createdAt)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(r.lastActive)}</TableCell>
                        <TableCell>
                          <RecruiterStatusBadge isActive={r.isActive} deletedAt={r.deletedAt} />
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <HiringAccountActions
                            kind="employer"
                            id={r._id}
                            email={r.email}
                            isActive={r.isActive}
                            deletedAt={r.deletedAt}
                            onDone={() => setReloadKey((n) => n + 1)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {result && result.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(result.pagination.page - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(result.pagination.page * PAGE_SIZE, result.pagination.total)} of{" "}
                    {result.pagination.total}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => update({ page: String(page - 1) }, true)}
                      disabled={page <= 1 || loading}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Page {result.pagination.page} of {result.pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => update({ page: String(page + 1) }, true)}
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
    </div>
  );
};

export default EmployersPage;

