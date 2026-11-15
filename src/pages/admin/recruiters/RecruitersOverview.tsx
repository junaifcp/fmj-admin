// src/pages/admin/recruiters/RecruitersOverview.tsx
// Recruiter admin 4.2: replaces the "Coming Soon" Recruiter Dashboard.
// Data: GET /api/admin/recruiters/overview (4.1). Metric definitions are in
// docs/recruiter-admin/locked-decisions.md, "Overview metrics".
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  Send,
  Timer,
  UserCheck,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { recruiterAdminApi } from "@/api/recruiterAdmin";
import type { RecruiterOverview } from "@/types/recruiterAdmin";
import type { DateFilterPreset, DateRange } from "@/types/admin";
import {
  formatDateRangeForDisplay,
  formatNumber,
  getDateRangeFromPreset,
  getFilterPresetOptions,
} from "@/utils/dateFilters";
import { PATHS } from "@/routes/paths";

const COLORS = {
  jobs: "#3b82f6",
  applications: "#10b981",
  hires: "#f59e0b",
};

const DEFAULT_PRESET: DateFilterPreset = "last30days";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const weekLabel = (week: string) =>
  new Date(`${week}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** One number tile. `sub` is the small grey line under the value. */
const Kpi: React.FC<{
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  loading: boolean;
}> = ({ title, value, sub, icon, loading }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="text-navy-icon">{icon}</div>
    </CardHeader>
    <CardContent>
      {loading ? (
        <>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-4 w-28" />
        </>
      ) : (
        <>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </>
      )}
    </CardContent>
  </Card>
);

type ActionItem = { label: string; count: number; to?: string; hint?: string };

const RecruitersOverview: React.FC = () => {
  const [preset, setPreset] = useState<DateFilterPreset>(DEFAULT_PRESET);
  const [range, setRange] = useState<DateRange>(getDateRangeFromPreset(DEFAULT_PRESET));
  const [data, setData] = useState<RecruiterOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(
    async (signal: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);
        const res = await recruiterAdminApi.getOverview(range.from, range.to, { signal });
        setData(res);
      } catch (err) {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load the overview");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [range]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load, reloadKey]);

  const presetOptions = getFilterPresetOptions();
  const onPreset = (value: DateFilterPreset) => {
    setPreset(value);
    if (value !== "custom") setRange(getDateRangeFromPreset(value));
  };
  const onCustomDate = (field: "from" | "to", value: string) => {
    if (!value) return;
    const d = new Date(value);
    if (field === "to") d.setHours(23, 59, 59, 999);
    setRange((prev) => ({ ...prev, [field]: d.toISOString() }));
  };
  const rangeLabel =
    preset === "custom"
      ? formatDateRangeForDisplay(range.from, range.to)
      : presetOptions.find((o) => o.value === preset)?.label ?? "";

  const k = data?.kpis;
  const showSkeleton = loading && !data;

  // "Active" needs lastActive history as long as the window (3.3).
  const activeSub = (days: number) => {
    if (!k) return undefined;
    const since = k.lastActiveSince;
    if (!since) return "Collection date not set";
    const collectedDays = (Date.now() - new Date(since).getTime()) / 86400000;
    return collectedDays < days ? `Collecting since ${fmtDate(since)}` : `of ${formatNumber(k.totalRecruiters)} recruiters`;
  };

  const actions: ActionItem[] = data
    ? [
        {
          label: "Companies pending verification",
          count: data.needsAction.companiesPending,
          to: `${PATHS.ADMIN.HIRING.COMPANIES}?tab=pending`,
        },
        {
          label: "Jobs flagged",
          count: data.needsAction.jobsFlagged,
          to: `${PATHS.ADMIN.HIRING.JOBS}?tab=flagged`,
        },
        {
          label: "Employer jobs unclaimed for 48h+",
          count: data.needsAction.employerJobsUnclaimed48h,
          to: `${PATHS.ADMIN.EMPLOYERS_ADMIN.JOB_DESK}?tab=unclaimed`,
        },
        {
          label: "Active jobs with a failed poster",
          count: data.needsAction.posterFailed,
          to: `${PATHS.ADMIN.HIRING.JOBS}?tab=all&status=active&posterStatus=failed`,
        },
        {
          label: "Employer invites that failed to send",
          count: data.needsAction.invitesSendFailed,
          to: `${PATHS.ADMIN.RECRUITERS_ADMIN.EMPLOYER_INVITES}?status=send_failed`,
        },
        {
          label: "Recruiters with 20+ invites in 24h",
          count: data.needsAction.heavyInviteSenders,
          to: PATHS.ADMIN.RECRUITERS_ADMIN.EMPLOYER_INVITES,
        },
      ]
    : [];

  const funnelSteps = data
    ? [
        { label: "Signed up", value: data.funnel.signedUp },
        { label: "Onboarded", value: data.funnel.onboarded },
        { label: "Posted a job", value: data.funnel.postedJob },
        { label: "Got an application", value: data.funnel.gotApplication },
        { label: "Made a hire", value: data.funnel.hired },
      ]
    : [];
  const funnelMax = Math.max(1, funnelSteps[0]?.value ?? 0);

  const lookupsPct = data
    ? Math.min(100, (data.costs.googleCityLookupsToday / Math.max(1, data.costs.googleCityDailyCap)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header + range */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-sans font-extrabold tracking-tight">Recruiters Overview</h1>
          <p className="text-muted-foreground mt-1">
            Growth, activation and what needs attention on the hiring side
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={preset} onValueChange={(v) => onPreset(v as DateFilterPreset)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presetOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {preset === "custom" && (
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
        Showing <span className="font-medium">{rangeLabel}</span>
        {data && <> · updated {new Date(data.generatedAt).toLocaleTimeString()} (cached up to 5 min)</>}
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => setReloadKey((n) => n + 1)}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 1. KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          title="Recruiters"
          icon={<Users className="h-4 w-4" />}
          loading={showSkeleton}
          value={formatNumber(k?.totalRecruiters ?? 0)}
          sub={k && `+${formatNumber(k.newRecruiters)} new in range`}
        />
        <Kpi
          title="Active (7 days)"
          icon={<UserCheck className="h-4 w-4" />}
          loading={showSkeleton}
          value={formatNumber(k?.active7d ?? 0)}
          sub={activeSub(7)}
        />
        <Kpi
          title="Active (30 days)"
          icon={<UserCheck className="h-4 w-4" />}
          loading={showSkeleton}
          value={formatNumber(k?.active30d ?? 0)}
          sub={activeSub(30)}
        />
        <Kpi
          title="Onboarded"
          icon={<CheckCircle className="h-4 w-4" />}
          loading={showSkeleton}
          value={`${k?.onboardedPct ?? 0}%`}
          sub="finished company onboarding"
        />
        <Kpi
          title="Active jobs"
          icon={<Briefcase className="h-4 w-4" />}
          loading={showSkeleton}
          value={formatNumber(k?.activeJobs ?? 0)}
          sub="posted or claimed by recruiters"
        />
        <Kpi
          title="Applications"
          icon={<FileText className="h-4 w-4" />}
          loading={showSkeleton}
          value={formatNumber(k?.applicationsInRange ?? 0)}
          sub="in range, on recruiter jobs"
        />
        <Kpi
          title="Hires"
          icon={<CheckCircle className="h-4 w-4" />}
          loading={showSkeleton}
          value={formatNumber(k?.hiresInRange ?? 0)}
          sub="in range (recorded since stage tracking)"
        />
        <Kpi
          title="Time to first application"
          icon={<Timer className="h-4 w-4" />}
          loading={showSkeleton}
          value={
            data?.medianHoursToFirstApplication == null
              ? "—"
              : `${data.medianHoursToFirstApplication} h`
          }
          sub={
            data &&
            `median · ${data.avgApplicationsPerJob ?? 0} applications per job`
          }
        />
      </div>

      {/* 2. Needs action */}
      <Card>
        <CardHeader>
          <CardTitle>Needs action</CardTitle>
          <CardDescription>Platform-wide, right now (not limited to the range)</CardDescription>
        </CardHeader>
        <CardContent>
          {showSkeleton ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {actions.map((a) => {
                const body = (
                  <div
                    className={`rounded-lg border p-4 h-full ${
                      a.count > 0 ? "border-amber-300 bg-amber-50/50" : ""
                    } ${a.to ? "hover:shadow-md transition-shadow" : ""}`}
                  >
                    <div className="text-2xl font-bold">{formatNumber(a.count)}</div>
                    <div className="text-sm text-muted-foreground">{a.label}</div>
                    {a.hint && <div className="text-xs text-muted-foreground mt-1">{a.hint}</div>}
                  </div>
                );
                return a.to ? (
                  <Link key={a.label} to={a.to} className="block">
                    {body}
                  </Link>
                ) : (
                  <div key={a.label}>{body}</div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 3. Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Activation funnel</CardTitle>
            <CardDescription>Recruiters who signed up in the range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {showSkeleton
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              : funnelSteps.map((step, i) => {
                  const prev = i === 0 ? null : funnelSteps[i - 1].value;
                  const ofPrev =
                    prev == null ? null : prev === 0 ? 0 : Math.round((step.value / prev) * 100);
                  return (
                    <div key={step.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{step.label}</span>
                        <span className="font-medium">
                          {formatNumber(step.value)}
                          {ofPrev != null && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              · {ofPrev}% of previous
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-3 rounded bg-muted overflow-hidden">
                        <div
                          className="h-full rounded bg-primary"
                          style={{ width: `${(step.value / funnelMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
          </CardContent>
        </Card>

        {/* 4. Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly trend</CardTitle>
            <CardDescription>Jobs posted, applications and hires per week</CardDescription>
          </CardHeader>
          <CardContent>
            {showSkeleton ? (
              <Skeleton className="h-[260px] w-full" />
            ) : data && data.trends.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.trends.map((w) => ({ ...w, label: weekLabel(w.week) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="jobsPosted" name="Jobs posted" stroke={COLORS.jobs} strokeWidth={2} />
                  <Line type="monotone" dataKey="applications" name="Applications" stroke={COLORS.applications} strokeWidth={2} />
                  <Line type="monotone" dataKey="hires" name="Hires" stroke={COLORS.hires} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">No activity in this range</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Costs</CardTitle>
          <CardDescription>Paid calls the hiring side makes</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {showSkeleton ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : data ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Google city lookups today
                  <span className="ml-auto font-medium">
                    {formatNumber(data.costs.googleCityLookupsToday)} /{" "}
                    {formatNumber(data.costs.googleCityDailyCap)}
                  </span>
                </div>
                <Progress value={lookupsPct} />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Hiring posters generated in range
                <span className="ml-auto font-medium">
                  {formatNumber(data.costs.postersGeneratedInRange)}
                </span>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* 6. Top recruiters */}
      <Card>
        <CardHeader>
          <CardTitle>Top recruiters</CardTitle>
          <CardDescription>By applications in the range on the jobs they own</CardDescription>
        </CardHeader>
        <CardContent>
          {showSkeleton ? (
            <Skeleton className="h-40 w-full" />
          ) : data && data.topRecruiters.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recruiter</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Jobs</TableHead>
                    <TableHead className="text-right">Applications</TableHead>
                    <TableHead className="text-right">Hires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topRecruiters.map((r) => (
                    <TableRow key={r.userId}>
                      <TableCell>
                        <div className="font-medium">{r.name || r.email}</div>
                        {r.name && <div className="text-xs text-muted-foreground">{r.email}</div>}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {r.company || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(r.jobs)}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.applications)}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.hires)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center flex items-center justify-center gap-2">
              <Send className="h-4 w-4" />
              No applications on recruiter jobs in this range
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecruitersOverview;
