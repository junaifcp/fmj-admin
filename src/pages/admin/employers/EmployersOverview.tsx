// src/pages/admin/employers/EmployersOverview.tsx
// Employer admin 5.2: the Employers landing page. Data: GET /api/admin/employers/overview
// (5.1). Metric definitions are in docs/employer-admin/locked-decisions.md, "Overview metrics".
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertTriangle,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  FileText,
  IndianRupee,
  Inbox,
  RefreshCw,
  UserCheck,
  Users,
} from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { employerAdminApi } from "@/api/employerAdmin";
import type { EmployerOverview } from "@/types/employerAdmin";
import type { DateFilterPreset, DateRange } from "@/types/admin";
import {
  formatDateRangeForDisplay,
  formatNumber,
  getDateRangeFromPreset,
  getFilterPresetOptions,
} from "@/utils/dateFilters";
import { PATHS } from "@/routes/paths";
import OwnerLink from "@/components/admin/hiring/OwnerLink";

const COLORS = {
  signups: "#8b5cf6",
  jobs: "#3b82f6",
  applications: "#10b981",
};

const DEFAULT_PRESET: DateFilterPreset = "last30days";

const SOURCE_LABELS: Record<string, string> = {
  ad_landing: "Ad landing (/post-a-job)",
  dashboard: "Dashboard sign-up",
  invite: "Recruiter invite",
  unknown: "Not recorded",
};

const CHANNEL_LABELS: Record<string, string> = {
  meta_paid: "Meta ads",
  direct: "Direct",
  organic: "Organic",
  unknown: "Not recorded",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const weekLabel = (week: string) =>
  new Date(`${week}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

const rupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const pctOf = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

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

/** Signups → posted → got an application, as counts and % of signups. */
const ConversionCells: React.FC<{ signups: number; posted: number; withApplication: number }> = ({
  signups,
  posted,
  withApplication,
}) => (
  <>
    <TableCell className="text-right">{formatNumber(signups)}</TableCell>
    <TableCell className="text-right">
      {formatNumber(posted)}
      <span className="text-xs text-muted-foreground"> · {pctOf(posted, signups)}%</span>
    </TableCell>
    <TableCell className="text-right">
      {formatNumber(withApplication)}
      <span className="text-xs text-muted-foreground"> · {pctOf(withApplication, signups)}%</span>
    </TableCell>
  </>
);

const EmployersOverview: React.FC = () => {
  const [preset, setPreset] = useState<DateFilterPreset>(DEFAULT_PRESET);
  const [range, setRange] = useState<DateRange>(getDateRangeFromPreset(DEFAULT_PRESET));
  const [data, setData] = useState<EmployerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(
    async (signal: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);
        setData(await employerAdminApi.getOverview(range.from, range.to, { signal }));
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

  // "Active" needs lastActive history as long as the window (from the 2.2 deploy).
  const activeSub = (days: number) => {
    if (!k) return undefined;
    const since = k.lastActiveSince;
    if (!since) return "Collection date not set";
    const collectedDays = (Date.now() - new Date(since).getTime()) / 86400000;
    return collectedDays < days
      ? `Collecting since ${fmtDate(since)}`
      : `of ${formatNumber(k.totalEmployers)} employers`;
  };

  const actions: ActionItem[] = data
    ? [
        {
          label: "Post-a-job drafts abandoned for 24h+",
          count: data.needsAction.abandonedDrafts24h,
          to: `${PATHS.ADMIN.EMPLOYERS_ADMIN.FUNNEL}?olderThanHours=24`,
        },
        {
          label: "Employer companies pending verification",
          count: data.needsAction.companiesPending,
          to: `${PATHS.ADMIN.HIRING.COMPANIES}?tab=pending`,
        },
        {
          label: "CV drops not contacted for 7+ days",
          count: data.needsAction.cvDropsUncontacted7d,
          to: `${PATHS.ADMIN.EMPLOYERS_ADMIN.CV_DROPS}?status=new&olderThanDays=7`,
        },
        {
          label: "Job desk jobs unclaimed for 48h+",
          count: data.needsAction.jobDeskUnclaimed48h,
          to: `${PATHS.ADMIN.EMPLOYERS_ADMIN.JOB_DESK}?tab=unclaimed`,
        },
        {
          label: "WhatsApp messages to employers failed (7 days)",
          count: data.needsAction.whatsappFailed7d,
          to: `${PATHS.ADMIN.EMPLOYERS_ADMIN.WHATSAPP}?status=failed`,
        },
        {
          label: "Employer jobs flagged",
          count: data.needsAction.employerJobsFlagged,
          to: `${PATHS.ADMIN.HIRING.JOBS}?tab=flagged&postedByRole=employer`,
        },
      ]
    : [];

  const funnelSteps = data
    ? [
        { label: "Signed up", value: data.adFunnel.signedUp },
        { label: "WhatsApp step done", value: data.adFunnel.whatsappDone },
        { label: "Picked a company", value: data.adFunnel.company },
        { label: "Saved job basics", value: data.adFunnel.basics },
        { label: "Posted the job", value: data.adFunnel.posted },
        { label: "Got an application", value: data.adFunnel.gotApplication },
        { label: "Made a hire", value: data.adFunnel.hired },
      ]
    : [];
  const funnelMax = Math.max(1, funnelSteps[0]?.value ?? 0);
  const sourceUnrecorded =
    !!data && data.bySource.length > 0 && data.bySource.every((s) => s.source === "unknown");

  return (
    <div className="space-y-6">
      {/* Header + range */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-sans font-extrabold tracking-tight">Employers Overview</h1>
          <p className="text-muted-foreground mt-1">
            Are ads turning into posted jobs and hires, and who needs a call?
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
          title="Employers"
          icon={<Users className="h-4 w-4" />}
          loading={showSkeleton}
          value={formatNumber(k?.totalEmployers ?? 0)}
          sub={k && `+${formatNumber(k.newEmployers)} new in range`}
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
          title="Have a company"
          icon={<Building className="h-4 w-4" />}
          loading={showSkeleton}
          value={`${k?.withCompanyPct ?? 0}%`}
          sub={k && `${k.postedPct}% have posted a job`}
        />
        <Kpi
          title="Jobs posted"
          icon={<Briefcase className="h-4 w-4" />}
          loading={showSkeleton}
          value={formatNumber(k?.jobsPostedInRange ?? 0)}
          sub="in range, by employers"
        />
        <Kpi
          title="Applications"
          icon={<FileText className="h-4 w-4" />}
          loading={showSkeleton}
          value={formatNumber(k?.applicationsInRange ?? 0)}
          sub="in range, on employer jobs"
        />
        <Kpi
          title="Hires"
          icon={<CheckCircle className="h-4 w-4" />}
          loading={showSkeleton}
          value={formatNumber(k?.hiresInRange ?? 0)}
          sub="in range, on employer jobs"
        />
        <Link to={PATHS.ADMIN.EMPLOYERS_ADMIN.PAYMENTS} className="block hover:shadow-md transition-shadow rounded-lg">
          <Kpi
            title="Paid services"
            icon={<IndianRupee className="h-4 w-4" />}
            loading={showSkeleton}
            value={rupees(k?.revenueInRangePaise ?? 0)}
            sub="recorded in range (refunds excluded) · open Paid Services"
          />
        </Link>
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
        {/* 3. Ad funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Ad funnel</CardTitle>
            <CardDescription>
              Employers who signed up through /post-a-job in the range. Each step counts everyone who
              reached it or a later one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {showSkeleton ? (
              Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : funnelSteps[0]?.value ? (
              funnelSteps.map((step, i) => {
                const prev = i === 0 ? null : funnelSteps[i - 1].value;
                const kept = prev == null ? null : pctOf(step.value, prev);
                return (
                  <div key={step.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{step.label}</span>
                      <span className="font-medium">
                        {formatNumber(step.value)}
                        {kept != null && (
                          <span className="text-muted-foreground font-normal"> · {kept}% kept</span>
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
              })
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {sourceUnrecorded
                  ? "No sign-up source is recorded for these employers yet. Run the acquisition backfill to fill it."
                  : "No ad landing sign-ups in this range"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 4. Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly trend</CardTitle>
            <CardDescription>Sign-ups, jobs posted and applications per week</CardDescription>
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
                  <Line type="monotone" dataKey="signups" name="Sign-ups" stroke={COLORS.signups} strokeWidth={2} />
                  <Line type="monotone" dataKey="jobsPosted" name="Jobs posted" stroke={COLORS.jobs} strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    name="Applications"
                    stroke={COLORS.applications}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">No activity in this range</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Source and campaign */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By source</CardTitle>
            <CardDescription>Where employers who signed up in the range came from</CardDescription>
          </CardHeader>
          <CardContent>
            {showSkeleton ? (
              <Skeleton className="h-32 w-full" />
            ) : data && data.bySource.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Sign-ups</TableHead>
                      <TableHead className="text-right">Posted</TableHead>
                      <TableHead className="text-right">Got an application</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.bySource.map((s) => (
                      <TableRow key={s.source}>
                        <TableCell>
                          {s.source === "unknown" ? (
                            SOURCE_LABELS[s.source]
                          ) : (
                            <Link
                              to={`${PATHS.ADMIN.EMPLOYERS_ADMIN.LIST}?source=${s.source}`}
                              className="text-primary hover:underline"
                            >
                              {SOURCE_LABELS[s.source] ?? s.source}
                            </Link>
                          )}
                        </TableCell>
                        <ConversionCells {...s} />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No sign-ups in this range</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By campaign</CardTitle>
            <CardDescription>Top 20 by sign-ups, from first-touch UTMs</CardDescription>
          </CardHeader>
          <CardContent>
            {showSkeleton ? (
              <Skeleton className="h-32 w-full" />
            ) : data && data.byCampaign.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead className="text-right">Sign-ups</TableHead>
                      <TableHead className="text-right">Posted</TableHead>
                      <TableHead className="text-right">Got an application</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byCampaign.map((c) => (
                      <TableRow key={`${c.channel}|${c.utmSource}|${c.utmCampaign}`}>
                        <TableCell>
                          <div className="font-medium">
                            {c.utmCampaign ? (
                              <Link
                                to={`${PATHS.ADMIN.EMPLOYERS_ADMIN.LIST}?${new URLSearchParams({
                                  utmCampaign: c.utmCampaign,
                                  ...(c.channel !== "unknown" ? { channel: c.channel } : {}),
                                }).toString()}`}
                                className="text-primary hover:underline"
                              >
                                {c.utmCampaign}
                              </Link>
                            ) : (
                              "(no campaign)"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {CHANNEL_LABELS[c.channel] ?? c.channel}
                            {c.utmSource && ` · ${c.utmSource}`}
                          </div>
                        </TableCell>
                        <ConversionCells {...c} />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No sign-ups in this range</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6. CV drops */}
      <Card>
        <CardHeader>
          <CardTitle>CV drops</CardTitle>
          <CardDescription>CVs walk-ins sent through employer QR codes in the range</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          {showSkeleton ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : data ? (
            <>
              <div className="flex items-center gap-3">
                <Inbox className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{formatNumber(data.cvDrops.receivedInRange)}</div>
                  <div className="text-sm text-muted-foreground">received</div>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">{data.cvDrops.contactedPct}%</div>
                <div className="text-sm text-muted-foreground">marked contacted by the employer</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {data.cvDrops.medianHoursToContact == null ? "—" : `${data.cvDrops.medianHoursToContact} h`}
                </div>
                <div className="text-sm text-muted-foreground">median time to contact</div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* 7. Top employers */}
      <Card>
        <CardHeader>
          <CardTitle>Top employers</CardTitle>
          <CardDescription>By applications in the range on the jobs they posted</CardDescription>
        </CardHeader>
        <CardContent>
          {showSkeleton ? (
            <Skeleton className="h-40 w-full" />
          ) : data && data.topEmployers.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Jobs</TableHead>
                    <TableHead className="text-right">Applications</TableHead>
                    <TableHead className="text-right">Hires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topEmployers.map((r) => (
                    <TableRow key={r.userId}>
                      <TableCell>
                        <OwnerLink id={r.userId} role="employer" className="font-medium">
                          {r.name || r.email}
                        </OwnerLink>
                        {r.name && <div className="text-xs text-muted-foreground">{r.email}</div>}
                      </TableCell>
                      <TableCell className="text-sm max-w-[260px] truncate" title={r.company}>
                        {r.company || "—"}
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
            <p className="text-sm text-muted-foreground py-8 text-center">
              No applications on employer jobs in this range
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployersOverview;
