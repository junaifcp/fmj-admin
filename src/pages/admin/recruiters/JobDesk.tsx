// src/pages/admin/recruiters/JobDesk.tsx
// Recruiter admin 8.1: every employer job on the desk; assign, unassign, set plan.
// ?tab=unclaimed|assigned|closed, ?recruiterId= narrows to one assignee.
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { jobDeskApi } from "@/api/hiringDeskAdmin";
import type { DeskResult, DeskTab } from "@/types/recruiterAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { DeskJobActionsMenu } from "@/components/admin/recruiters/DeskActions";
import { PLAN_LABELS } from "@/components/admin/recruiters/deskLabels";
import { fmtDate } from "@/components/admin/recruiters/recruiterFormat";
import OwnerLink from "@/components/admin/hiring/OwnerLink";

const TABS: { value: DeskTab; label: string }[] = [
  { value: "unclaimed", label: "Unclaimed" },
  { value: "assigned", label: "Assigned" },
  { value: "closed", label: "Closed" },
];
const PAGE_SIZE = 20;
const ALL = "all";

const ageLabel = (iso: string) => {
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  return h < 48 ? `${Math.max(0, Math.round(h))} h` : `${Math.round(h / 24)} days`;
};

const JobDeskPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: DeskTab = tabParam === "assigned" || tabParam === "closed" ? tabParam : "unclaimed";
  const recruiterId = params.get("recruiterId") || undefined;
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<DeskResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => setPage(1), [tab, search, plan, recruiterId]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    jobDeskApi
      .list(
        { tab, page, limit: PAGE_SIZE, q: search || undefined, plan: plan === ALL ? undefined : plan, recruiterId },
        { signal: ctrl.signal }
      )
      .then(setResult)
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load the job desk");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [tab, page, search, plan, recruiterId, reloadKey]);

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const rows = result?.data ?? [];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-extrabold tracking-tight">Job Desk</h1>
        <p className="text-muted-foreground mt-1">
          Jobs employers post for recruiters to fill. Assign, reassign or release them.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Employer jobs</CardTitle>
              <CardDescription>Nobody is notified when you assign or unassign.</CardDescription>
            </div>
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
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="w-40" aria-label="Plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Plan: all</SelectItem>
                  {Object.entries(PLAN_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={tab} onValueChange={(v) => setParam("tab", v)}>
              <TabsList>
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                    {result && <span className="ml-1 text-muted-foreground">({result.counts[t.value]})</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {recruiterId && (
              <Button variant="outline" size="sm" onClick={() => setParam("recruiterId")}>
                One recruiter <X className="h-4 w-4 ml-1" />
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
                      <TableHead>Employer</TableHead>
                      <TableHead>{tab === "unclaimed" ? "Waiting" : "Recruiter"}</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Applicants</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {tab === "unclaimed" ? "Every open employer job has a recruiter" : "No jobs here"}
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((j) => (
                      <TableRow key={j._id} className={j.unclaimedOver48h ? "bg-amber-50/70" : undefined}>
                        <TableCell>
                          <div className="font-medium">{j.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {[j.company, j.city].filter(Boolean).join(" · ") || "—"}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {j.status !== "active" && (
                              <Badge variant="outline" className="capitalize">
                                {j.status}
                              </Badge>
                            )}
                            {j.removed && <Badge variant="destructive">Removed</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {j.employer ? (
                            <>
                              <div>
                                <OwnerLink id={j.employer._id} role="employer">
                                  {j.employer.name || j.employer.email}
                                </OwnerLink>
                              </div>
                              {j.employer.name && (
                                <div className="text-xs text-muted-foreground">{j.employer.email}</div>
                              )}
                              {(j.employer.phone || j.employer.whatsappNumber) && (
                                <div className="text-xs text-muted-foreground">
                                  {j.employer.phone ?? ""}
                                  {j.employer.whatsappNumber ? ` · WA ${j.employer.whatsappNumber}` : ""}
                                </div>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {j.assignedRecruiter ? (
                            <>
                              <OwnerLink id={j.assignedRecruiter._id} role="recruiter">
                                {j.assignedRecruiter.name || j.assignedRecruiter.email}
                              </OwnerLink>
                              <div className="text-xs text-muted-foreground">
                                {fmtDate(j.assignedAt)}
                                {j.hoursToClaim != null && ` · claimed in ${j.hoursToClaim} h`}
                              </div>
                            </>
                          ) : (
                            <span className={j.unclaimedOver48h ? "font-medium text-amber-800" : "text-muted-foreground"}>
                              {ageLabel(j.createdAt)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{PLAN_LABELS[j.fulfillmentPlan] ?? j.fulfillmentPlan}</TableCell>
                        <TableCell className="text-right">{j.applicationCount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(j.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DeskJobActionsMenu
                            jobId={j._id}
                            jobTitle={j.title}
                            assignedRecruiterId={j.assignedRecruiter?._id ?? null}
                            plan={j.fulfillmentPlan}
                            closed={j.status === "closed"}
                            removed={j.removed}
                            onDone={() => setReloadKey((n) => n + 1)}
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

export default JobDeskPage;
