// src/pages/admin/recruiters/Applications.tsx
// Recruiter admin 9.1: are recruiters working their pipelines? Read-only,
// aggregates only (no candidate personal data). Data:
// GET /api/admin/applications/summary. ?recruiterId= narrows to one recruiter.
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminInsightsApi } from "@/api/adminInsights";
import type { ApplicationsOwnerScope, ApplicationsSummary } from "@/types/recruiterAdmin";
import OwnerLink from "@/components/admin/hiring/OwnerLink";
import type { DateFilterPreset, DateRange } from "@/types/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Calendar, RefreshCw, X } from "lucide-react";
import {
  formatDateRangeForDisplay,
  formatNumber,
  getDateRangeFromPreset,
  getFilterPresetOptions,
} from "@/utils/dateFilters";
import { fmtDate } from "@/components/admin/recruiters/recruiterFormat";
import { PATHS } from "@/routes/paths";
import { applicationStatusChartColor, applicationStatusLabel } from "@/constants/applicationStatus";

const DEFAULT_PRESET: DateFilterPreset = "last30days";

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  "website-unregistered": "Website (no account)",
  blog: "Blog",
  "pipeline-link": "Pipeline link",
  "pipeline-database": "Pipeline database",
  "recruiter-search": "Find candidates",
};

// Employer admin 4.1: recruiter pipelines, employer pipelines (unclaimed employer jobs), or both.
const OWNER_OPTIONS: [ApplicationsOwnerScope, string][] = [
  ["all", "All owners"],
  ["recruiters", "Recruiters"],
  ["employers", "Employers"],
];
const toOwnerScope = (v: string | null): ApplicationsOwnerScope =>
  v === "recruiters" || v === "employers" ? v : "all";
const jobHref = (id: string) => `${PATHS.ADMIN.HIRING.JOBS}?tab=all&open=${id}`;

const Stat: React.FC<{ label: string; value: React.ReactNode; sub?: string; loading: boolean }> = ({
  label,
  value,
  sub,
  loading,
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{value}</div>}
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

const ApplicationsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const recruiterId = params.get("recruiterId") || undefined;
  const owner = toOwnerScope(params.get("owner"));
  const setOwner = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "all") next.delete("owner");
    else next.set("owner", v);
    setParams(next, { replace: true });
  };
  const [preset, setPreset] = useState<DateFilterPreset>(DEFAULT_PRESET);
  const [range, setRange] = useState<DateRange>(getDateRangeFromPreset(DEFAULT_PRESET));
  const [allTime, setAllTime] = useState(false);
  const [data, setData] = useState<ApplicationsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    adminInsightsApi
      .applicationsSummary(
        {
          ...(allTime ? {} : { from: range.from, to: range.to }),
          recruiterId,
          ...(recruiterId ? {} : { owner }),
        },
        { signal: ctrl.signal }
      )
      .then(setData)
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [range, allTime, recruiterId, owner, reloadKey]);

  const presetOptions = getFilterPresetOptions();
  const ALL_TIME = "alltime";
  const onPreset = (v: string) => {
    if (v === ALL_TIME) {
      setAllTime(true);
      return;
    }
    setAllTime(false);
    setPreset(v as DateFilterPreset);
    if (v !== "custom") setRange(getDateRangeFromPreset(v as DateFilterPreset));
  };
  const onCustomDate = (field: "from" | "to", value: string) => {
    if (!value) return;
    const d = new Date(value);
    if (field === "to") d.setHours(23, 59, 59, 999);
    setRange((prev) => ({ ...prev, [field]: d.toISOString() }));
  };
  const rangeLabel = allTime
    ? "All time"
    : preset === "custom"
      ? formatDateRangeForDisplay(range.from, range.to)
      : presetOptions.find((o) => o.value === preset)?.label ?? "";

  const showSkeleton = loading && !data;
  const statusData = data
    ? Object.entries(data.byStatus)
        .filter(([, n]) => n > 0)
        .map(([status, value]) => ({ name: applicationStatusLabel(status), status, value }))
    : [];
  const sourceData = data
    ? data.bySource.map((s) => ({ name: SOURCE_LABELS[s.source] ?? s.source, count: s.count }))
    : [];
  const workedPct = data && data.total ? Math.round((data.worked / data.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-sans font-extrabold tracking-tight">Applications</h1>
          <p className="text-muted-foreground mt-1">
            Are applicants being moved along? Recruiter pipelines are jobs recruiters posted or
            claimed; employer pipelines are employer jobs no recruiter has claimed. Read-only.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!recruiterId && (
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger className="w-[150px]" aria-label="Owner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OWNER_OPTIONS.map(([v, label]) => (
                  <SelectItem key={v} value={v}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={allTime ? ALL_TIME : preset} onValueChange={onPreset}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presetOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
              <SelectItem value={ALL_TIME}>All time</SelectItem>
            </SelectContent>
          </Select>
          {!allTime && preset === "custom" && (
            <>
              <input
                type="date"
                aria-label="From"
                value={range.from.split("T")[0]}
                onChange={(e) => onCustomDate("from", e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="date"
                aria-label="To"
                value={range.to.split("T")[0]}
                onChange={(e) => onCustomDate("to", e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background"
              />
            </>
          )}
          {recruiterId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("recruiterId");
                setParams(next, { replace: true });
              }}
            >
              One recruiter <X className="h-4 w-4 ml-1" />
            </Button>
          )}
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
      <p className="text-sm text-muted-foreground">
        Applied in <span className="font-medium">{rangeLabel}</span>
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && data.invalidStatus > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{data.invalidStatus} applications have a status outside the list</AlertTitle>
          <AlertDescription>
            Run <code>npm run applications:audit-status</code> in the backend (dry run) to see them.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat label="Applications" value={formatNumber(data?.total ?? 0)} loading={showSkeleton} />
        <Stat
          label="Moved past Applied"
          value={`${workedPct}%`}
          sub={data ? `${formatNumber(data.worked)} marked fit, shortlisted, hired or not fit` : undefined}
          loading={showSkeleton}
        />
        <Stat label="Hires" value={formatNumber(data?.byStatus.hired ?? 0)} loading={showSkeleton} />
        <Stat
          label={`Waiting ${data?.stuckDays ?? 14}+ days`}
          value={formatNumber((data?.stuck ?? []).reduce((a, s) => a + s.count, 0))}
          sub={data ? `on ${data.stuck.length} job${data.stuck.length === 1 ? "" : "s"}` : undefined}
          loading={showSkeleton}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By stage</CardTitle>
          </CardHeader>
          <CardContent>
            {showSkeleton ? (
              <Skeleton className="h-[260px] w-full" />
            ) : statusData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                    {statusData.map((d) => (
                      <Cell key={d.status} fill={applicationStatusChartColor(d.status)} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">No applications in this range</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By source</CardTitle>
          </CardHeader>
          <CardContent>
            {showSkeleton ? (
              <Skeleton className="h-[260px] w-full" />
            ) : sourceData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sourceData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} fontSize={12} />
                  <YAxis type="category" dataKey="name" width={130} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name="Applications" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">No applications in this range</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stuck pipelines</CardTitle>
          <CardDescription>
            Jobs with applicants still at Applied {data?.stuckDays ?? 14}+ days after they applied (top 50)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showSkeleton ? (
            <Skeleton className="h-40 w-full" />
          ) : data && data.stuck.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Waiting</TableHead>
                    <TableHead>Oldest</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.stuck.map((s) => (
                    <TableRow key={s.jobId}>
                      <TableCell>
                        <Link to={jobHref(s.jobId)} className="font-medium text-primary hover:underline">
                          {s.title || "—"}
                        </Link>
                        {s.jobStatus && s.jobStatus !== "active" && (
                          <span className="ml-2 text-xs text-muted-foreground capitalize">{s.jobStatus}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.recruiter ? (
                          <OwnerLink id={s.recruiter._id} role={s.recruiter.ownerRole ?? "recruiter"}>
                            {s.recruiter.name || s.recruiter.email}
                          </OwnerLink>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">{s.count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(s.oldestAppliedAt)} · {s.daysWaiting} days
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Nothing stuck</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By recruiter</CardTitle>
          <CardDescription>
            Time to first stage change counts only status changes made after stage tracking went live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showSkeleton ? (
            <Skeleton className="h-40 w-full" />
          ) : data && data.byRecruiter.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Applications</TableHead>
                    <TableHead className="text-right">Moved past Applied</TableHead>
                    <TableHead className="text-right">Hires</TableHead>
                    <TableHead className="text-right">Median days to first change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byRecruiter.map((r) => (
                    <TableRow key={r.recruiter._id}>
                      <TableCell>
                        <OwnerLink
                          id={r.recruiter._id}
                          role={r.recruiter.ownerRole ?? "recruiter"}
                          className={r.recruiter.ownerRole === "employer" ? "font-medium" : undefined}
                        >
                          {r.recruiter.name || r.recruiter.email}
                        </OwnerLink>
                        {r.recruiter.ownerRole === "employer" && (
                          <span className="ml-2 text-xs text-muted-foreground">Employer</span>
                        )}
                        {r.recruiter.company && (
                          <div className="text-xs text-muted-foreground">{r.recruiter.company}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{r.total}</TableCell>
                      <TableCell className={`text-right ${r.workedPct === 0 && r.total >= 5 ? "text-destructive" : ""}`}>
                        {r.workedPct}%
                      </TableCell>
                      <TableCell className="text-right">{r.hires}</TableCell>
                      <TableCell className="text-right">
                        {r.medianDaysToFirstChange == null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <>
                            {r.medianDaysToFirstChange}
                            <span className="text-xs text-muted-foreground"> ({r.measured})</span>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No applications in this range</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationsPage;
