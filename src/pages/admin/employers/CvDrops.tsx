// src/pages/admin/employers/CvDrops.tsx
// Employer admin 8.1: CV drops across all employers. Contact details are
// masked; the file opens only through the audited stream (row menu).
// Filters live in the URL (the Overview tile links to ?status=new&olderThanDays=7).
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cvDropsAdminApi } from "@/api/employerAdmin";
import type { Paged } from "@/types/recruiterAdmin";
import type { AdminCvDropRow, CvDropFilters, CvDropSummaryRow } from "@/types/employerAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { fmtDateTime } from "@/components/admin/recruiters/recruiterFormat";
import OwnerLink from "@/components/admin/hiring/OwnerLink";
import CvDropRowMenu from "@/components/admin/employers/CvDropRowMenu";

const PAGE_SIZE = 25;
const ALL = "all";

const CvDrops: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<Paged<AdminCvDropRow> | null>(null);
  const [summary, setSummary] = useState<CvDropSummaryRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");
  const page = Math.max(1, Number(params.get("page")) || 1);

  const update = (changes: Record<string, string | undefined>, keepPage = false) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!keepPage) next.delete("page");
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      const v = searchInput.trim();
      if (v !== (params.get("q") ?? "")) update({ q: v || undefined });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const filters: CvDropFilters = useMemo(
    () => ({
      status: (params.get("status") as CvDropFilters["status"]) || undefined,
      employerId: params.get("employerId") || undefined,
      olderThanDays: params.get("olderThanDays") || undefined,
      q: params.get("q") || undefined,
    }),
    [params]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    cvDropsAdminApi
      .list(page, PAGE_SIZE, filters, { signal: ctrl.signal })
      .then(setResult)
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load CV drops");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [page, filters, reloadKey]);

  useEffect(() => {
    const ctrl = new AbortController();
    cvDropsAdminApi
      .summary({ signal: ctrl.signal })
      .then(setSummary)
      .catch(() => {
        if (!ctrl.signal.aborted) setSummary([]);
      });
    return () => ctrl.abort();
  }, [reloadKey]);

  const rows = result?.data ?? [];
  const chasing = (summary ?? []).filter((s) => s.uncontacted7d > 0 || s.new > 0).slice(0, 8);
  const employerFilter = params.get("employerId");
  const employerName = summary?.find((s) => s.employer._id === employerFilter);
  const hasFilters = !!(params.get("status") || employerFilter || params.get("olderThanDays") || params.get("q"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-extrabold tracking-tight">CV Drops</h1>
        <p className="text-muted-foreground mt-1">
          CVs walk-ins sent through employer QR codes. Contact details are masked; opening a file is logged.
        </p>
      </div>

      {/* Employers to chase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employers with CVs waiting</CardTitle>
          <CardDescription>Most CVs not contacted for 7+ days first</CardDescription>
        </CardHeader>
        <CardContent>
          {summary === null ? (
            <Skeleton className="h-16 w-full" />
          ) : chasing.length === 0 ? (
            <p className="text-sm text-muted-foreground">Every CV has been contacted.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {chasing.map((s) => (
                <button
                  key={s.employer._id}
                  type="button"
                  onClick={() => update({ employerId: s.employer._id, status: "new" })}
                  className={`rounded-lg border p-3 text-left hover:shadow-md transition-shadow ${
                    s.uncontacted7d > 0 ? "border-amber-300 bg-amber-50/50" : ""
                  }`}
                >
                  <div className="font-medium truncate" title={s.company || s.employer.email}>
                    {s.company || s.employer.name || s.employer.email}
                  </div>
                  <div className="text-sm">
                    <span className="font-bold">{s.uncontacted7d}</span> waiting 7+ days ·{" "}
                    <span className="font-bold">{s.new}</span> new of {s.total}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Median time to contact:{" "}
                    {s.medianHoursToContact == null ? "—" : `${s.medianHoursToContact} h`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All CV drops</CardTitle>
              <CardDescription>{result ? `${result.pagination.total} CVs` : "Loading..."}</CardDescription>
            </div>
            <Button
              onClick={() => setReloadKey((n) => n + 1)}
              size="sm"
              variant="outline"
              disabled={loading}
              aria-label="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Candidate name or role"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 w-60"
              />
            </div>
            <Select value={params.get("status") ?? ALL} onValueChange={(v) => update({ status: v === ALL ? undefined : v })}>
              <SelectTrigger className="w-40" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={params.get("olderThanDays") ?? ALL}
              onValueChange={(v) => update({ olderThanDays: v === ALL ? undefined : v })}
            >
              <SelectTrigger className="w-44" aria-label="Age">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any age</SelectItem>
                <SelectItem value="3">Older than 3 days</SelectItem>
                <SelectItem value="7">Older than 7 days</SelectItem>
                <SelectItem value="30">Older than 30 days</SelectItem>
              </SelectContent>
            </Select>
            {employerFilter && (
              <Badge variant="secondary" className="gap-1">
                Employer: {employerName?.company || employerName?.employer.email || "selected"}
                <button type="button" aria-label="Remove employer filter" onClick={() => update({ employerId: undefined })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  update({ status: undefined, employerId: undefined, olderThanDays: undefined, q: undefined });
                }}
              >
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
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table className={loading ? "opacity-60" : undefined}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Role / job</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {hasFilters ? "No CV drops match these filters" : "No CV drops yet"}
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {[r.phone, r.email].filter(Boolean).join(" · ")}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.job?.title || r.roleInterest || "—"}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" title={r.company?.name}>
                        {r.company?.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.employer ? (
                          <OwnerLink id={r.employer._id} role="employer">
                            {r.employer.name || r.employer.email}
                          </OwnerLink>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "new" ? "secondary" : "outline"}>
                          {r.status === "new" ? "New" : "Contacted"}
                        </Badge>
                        {r.hoursToContact != null && (
                          <div className="text-xs text-muted-foreground mt-1">in {r.hoursToContact} h</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {fmtDateTime(r.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <CvDropRowMenu
                          id={r._id}
                          candidateName={r.name}
                          employerId={r.employer?._id}
                          onDeleted={() => setReloadKey((n) => n + 1)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {result && result.pagination.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4 text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => update({ page: String(page - 1) }, true)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              Page {result.pagination.page} of {result.pagination.totalPages}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= result.pagination.totalPages || loading}
                onClick={() => update({ page: String(page + 1) }, true)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CvDrops;
