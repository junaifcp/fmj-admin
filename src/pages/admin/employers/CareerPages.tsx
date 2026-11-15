// src/pages/admin/employers/CareerPages.tsx
// Employer admin 8.2: every employer career page, to spot empty or risky pages
// and turn them off. On/off uses the audited employer endpoint (6.1).
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { careerPagesAdminApi, employerAdminApi } from "@/api/employerAdmin";
import type { Paged } from "@/types/recruiterAdmin";
import type { CareerPageFilters, CareerPageRow } from "@/types/employerAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Info, MoreHorizontal, RefreshCw, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CompanyVerificationBadge, ReasonDialog } from "@/components/admin/recruiters/RecruiterBits";
import OwnerLink from "@/components/admin/hiring/OwnerLink";
import { PATHS } from "@/routes/paths";

const PAGE_SIZE = 25;
const ALL = "all";

const SELECTS: { key: keyof CareerPageFilters; label: string; options: [string, string][] }[] = [
  { key: "enabled", label: "Page", options: [["true", "On"], ["false", "Off"]] },
  {
    key: "companyVerified",
    label: "Company",
    options: [["verified", "Verified (indexed)"], ["pending", "Pending (not indexed)"], ["rejected", "Rejected (404)"]],
  },
  { key: "hasJobs", label: "Jobs", options: [["true", "Has listed jobs"], ["false", "No listed jobs"]] },
];

const CareerPages: React.FC = () => {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<Paged<CareerPageRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");
  const [toggle, setToggle] = useState<CareerPageRow | null>(null);
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

  const filters: CareerPageFilters = useMemo(() => {
    const f: Record<string, string> = {};
    for (const k of ["enabled", "companyVerified", "hasJobs", "q"]) {
      const v = params.get(k);
      if (v) f[k] = v;
    }
    return f as CareerPageFilters;
  }, [params]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    careerPagesAdminApi
      .list(page, PAGE_SIZE, filters, { signal: ctrl.signal })
      .then(setResult)
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load career pages");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [page, filters, reloadKey]);

  const runToggle = async (reason: string) => {
    if (!toggle) return;
    try {
      await employerAdminApi.setCareerPage(toggle.employer._id, !toggle.enabled, reason);
      toast({
        title: toggle.enabled ? "Career page turned off" : "Career page turned on",
        description: "Recorded in the activity log",
      });
      setToggle(null);
      setReloadKey((n) => n + 1);
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const rows = result?.data ?? [];
  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-extrabold tracking-tight">Career Pages</h1>
        <p className="text-muted-foreground mt-1">Every employer's public career page on the candidate app</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          A rejected company's page 404s; pending companies' pages are live but not indexed. To take down a fake
          company, reject it in Hiring → Companies.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All career pages</CardTitle>
              <CardDescription>
                {result ? `${result.pagination.total} pages` : "Loading..."} · Listed jobs follow the public 90-day rule
              </CardDescription>
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
                placeholder="Company, employer or link"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 w-60"
              />
            </div>
            {SELECTS.map((s) => (
              <Select
                key={s.key}
                value={params.get(s.key) ?? ALL}
                onValueChange={(v) => update({ [s.key]: v === ALL ? undefined : v })}
              >
                <SelectTrigger className="w-48" aria-label={s.label}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{`${s.label}: all`}</SelectItem>
                  {s.options.map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  update({ enabled: undefined, companyVerified: undefined, hasJobs: undefined, q: undefined });
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
                    <TableHead>Company</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead className="text-right">Listed jobs</TableHead>
                    <TableHead className="text-right">Hidden old</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {hasFilters ? "No career pages match these filters" : "No career pages yet"}
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((r) => (
                    <TableRow key={r.slug}>
                      <TableCell>
                        <div className="font-medium max-w-[220px] truncate" title={r.company?.name}>
                          {r.company?.name || "No company"}
                        </div>
                        {r.company && <CompanyVerificationBadge value={r.company.verified} />}
                      </TableCell>
                      <TableCell className="text-sm">
                        <OwnerLink id={r.employer._id} role="employer">
                          {r.employer.name || r.employer.email}
                        </OwnerLink>
                        {r.suspended && (
                          <div>
                            <Badge variant="destructive">Suspended</Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge variant={r.enabled ? "outline" : "destructive"}>{r.enabled ? "On" : "Off"}</Badge>
                          {r.live ? (
                            <Badge variant="outline" className="border-success/30 text-success">
                              Live
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not reachable</Badge>
                          )}
                        </div>
                        <a
                          href={r.publicUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          /careers/{r.slug}
                        </a>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className={r.company?.hasLogo ? "" : "text-amber-700"}>
                          {r.company?.hasLogo ? "Logo" : "No logo"}
                        </div>
                        <div className={r.company?.hasAbout ? "" : "text-amber-700"}>
                          {r.company?.hasAbout ? "About text" : "No about text"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{r.listedJobs}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{r.hiddenOldJobs}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label="Career page actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={r.publicUrl} target="_blank" rel="noreferrer noopener">
                                Open public page
                              </a>
                            </DropdownMenuItem>
                            {r.company && (
                              <DropdownMenuItem asChild>
                                <Link to={`${PATHS.ADMIN.HIRING.COMPANIES}?tab=all&ownerId=${r.employer._id}`}>
                                  Open company in Hiring → Companies
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link to={`${PATHS.ADMIN.EMPLOYERS_ADMIN.LIST}/${r.employer._id}`}>Open employer</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={r.enabled ? "text-destructive" : undefined}
                              onSelect={() => setToggle(r)}
                            >
                              {r.enabled ? "Turn page off…" : "Turn page on…"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      <ReasonDialog
        open={!!toggle}
        title={toggle?.enabled ? "Turn off the career page" : "Turn on the career page"}
        description={
          toggle?.enabled
            ? `The public page for ${toggle.company?.name || toggle.slug} shows “not found” until turned back on.`
            : `The public page for ${toggle?.company?.name || toggle?.slug} is visible again.`
        }
        confirmLabel={toggle?.enabled ? "Turn off" : "Turn on"}
        destructive={toggle?.enabled}
        reasonRequired={toggle?.enabled}
        onCancel={() => setToggle(null)}
        onConfirm={runToggle}
      />
    </div>
  );
};

export default CareerPages;
