// src/pages/admin/employers/Payments.tsx
// Employer admin 10.2: Paid Services. Log job desk payments made outside the
// app and see revenue. Recording sets the job's plan; refunds are superadmin only.
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { paymentsAdminApi } from "@/api/paidServicesAdmin";
import type { Paged } from "@/types/recruiterAdmin";
import type { DateFilterPreset, DateRange } from "@/types/admin";
import type { EmployerPaymentRow, PaymentFilters, PaymentsSummary } from "@/types/employerAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Calendar, ChevronLeft, ChevronRight, MoreHorizontal, Plus, RefreshCw, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth";
import { getDateRangeFromPreset, getFilterPresetOptions } from "@/utils/dateFilters";
import { ReasonDialog } from "@/components/admin/recruiters/RecruiterBits";
import { fmtDate, personName } from "@/components/admin/recruiters/recruiterFormat";
import OwnerLink from "@/components/admin/hiring/OwnerLink";
import RecordPaymentDialog from "@/components/admin/employers/RecordPaymentDialog";
import { PAID_PLAN_LABELS, PAYMENT_METHOD_LABELS, formatRupees } from "@/components/admin/employers/paymentLabels";
import { CHANNEL_LABELS } from "@/components/admin/employers/employerLabels";
import { PATHS } from "@/routes/paths";

const PAGE_SIZE = 25;
const ALL = "all";
const ALL_TIME = "alltime";
const DEFAULT_PRESET: DateFilterPreset = "last30days";

const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" });

const Payments: React.FC = () => {
  const { toast } = useToast();
  const { user: me } = useAuth();
  const isSuperadmin = me?.role === "superadmin";
  const [params, setParams] = useSearchParams();
  const [preset, setPreset] = useState<string>(DEFAULT_PRESET);
  const [range, setRange] = useState<DateRange>(getDateRangeFromPreset(DEFAULT_PRESET));
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [result, setResult] = useState<Paged<EmployerPaymentRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [recordOpen, setRecordOpen] = useState(false);
  const [refundFor, setRefundFor] = useState<EmployerPaymentRow | null>(null);
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

  const rangeParams = useMemo(
    () => (preset === ALL_TIME ? {} : { from: range.from, to: range.to }),
    [preset, range]
  );

  const filters: PaymentFilters = useMemo(
    () => ({
      ...rangeParams,
      status: (params.get("status") as PaymentFilters["status"]) || undefined,
      plan: (params.get("plan") as PaymentFilters["plan"]) || undefined,
      method: (params.get("method") as PaymentFilters["method"]) || undefined,
      employerId: params.get("employerId") || undefined,
    }),
    [params, rangeParams]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      paymentsAdminApi.summary(rangeParams, { signal: ctrl.signal }),
      paymentsAdminApi.list(page, PAGE_SIZE, filters, { signal: ctrl.signal }),
    ])
      .then(([s, l]) => {
        setSummary(s);
        setResult(l);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load payments");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [page, filters, rangeParams, reloadKey]);

  const onPreset = (v: string) => {
    setPreset(v);
    if (v !== ALL_TIME && v !== "custom") setRange(getDateRangeFromPreset(v as DateFilterPreset));
    update({});
  };

  const runRefund = async (reason: string) => {
    if (!refundFor) return;
    try {
      await paymentsAdminApi.refund(refundFor._id, reason);
      toast({ title: "Payment refunded", description: "The job keeps its plan. Recorded in the activity log." });
      setRefundFor(null);
      setReloadKey((n) => n + 1);
    } catch (e) {
      toast({
        title: "Refund failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const rows = result?.data ?? [];
  const presetOptions = getFilterPresetOptions().filter((o) => o.value !== "custom");
  const hasFilters = !!(params.get("status") || params.get("plan") || params.get("method") || params.get("employerId"));
  const showSkeleton = loading && !summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-sans font-extrabold tracking-tight">Paid Services</h1>
          <p className="text-muted-foreground mt-1">
            Smart Hire and Hire Assist payments made outside the app. Recording one sets the job's plan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={preset} onValueChange={onPreset}>
            <SelectTrigger className="w-[180px]" aria-label="Range">
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
          <Button size="sm" variant="outline" onClick={() => setReloadKey((n) => n + 1)} aria-label="Refresh" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => setRecordOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Record payment
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {[
          {
            label: "Revenue",
            value: summary ? formatRupees(summary.revenuePaise) : "—",
            sub: summary ? `${summary.payments} payments recorded (refunds excluded)` : "",
          },
          {
            label: "Paid jobs",
            value: summary ? String(summary.paidJobs) : "—",
            sub: summary
              ? `Prices: ${formatRupees(summary.prices.smart_hire)} / ${formatRupees(summary.prices.hire_assist)}`
              : "",
          },
          {
            label: "Conversion",
            value: summary ? `${summary.conversionPct}%` : "—",
            sub: summary ? `of ${summary.assignedJobs} employer jobs assigned on the job desk` : "",
          },
        ].map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {showSkeleton ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{c.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by month</CardTitle>
            <CardDescription>By the date paid, India time</CardDescription>
          </CardHeader>
          <CardContent>
            {showSkeleton ? (
              <Skeleton className="h-[240px] w-full" />
            ) : summary && summary.byMonth.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={summary.byMonth.map((m) => ({ ...m, label: monthLabel(m.month), rupees: m.revenuePaise / 100 }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => formatRupees(Math.round(v * 100))} />
                  <Bar dataKey="rupees" name="Revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">No payments in this range</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By plan and channel</CardTitle>
            <CardDescription>Channel is the employer's first touch</CardDescription>
          </CardHeader>
          <CardContent>
            {showSkeleton ? (
              <Skeleton className="h-32 w-full" />
            ) : summary && summary.payments ? (
              <Table>
                <TableBody>
                  {summary.byPlan.map((p) => (
                    <TableRow key={p.plan}>
                      <TableCell>{PAID_PLAN_LABELS[p.plan] ?? p.plan}</TableCell>
                      <TableCell className="text-right">{p.count}</TableCell>
                      <TableCell className="text-right font-medium">{formatRupees(p.revenuePaise)}</TableCell>
                    </TableRow>
                  ))}
                  {summary.byChannel.map((c) => (
                    <TableRow key={c.channel}>
                      <TableCell className="text-muted-foreground">
                        {CHANNEL_LABELS[c.channel] ?? (c.channel === "unknown" ? "Not recorded" : c.channel)}
                      </TableCell>
                      <TableCell className="text-right">{c.count}</TableCell>
                      <TableCell className="text-right">{formatRupees(c.revenuePaise)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Nothing yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payments table */}
      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Payments</CardTitle>
            <CardDescription>{result ? `${result.pagination.total} in this range` : "Loading..."}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={params.get("status") ?? ALL} onValueChange={(v) => update({ status: v === ALL ? undefined : v })}>
              <SelectTrigger className="w-40" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any status</SelectItem>
                <SelectItem value="recorded">Recorded</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={params.get("plan") ?? ALL} onValueChange={(v) => update({ plan: v === ALL ? undefined : v })}>
              <SelectTrigger className="w-40" aria-label="Plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any plan</SelectItem>
                {Object.entries(PAID_PLAN_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={params.get("method") ?? ALL} onValueChange={(v) => update({ method: v === ALL ? undefined : v })}>
              <SelectTrigger className="w-44" aria-label="Method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any method</SelectItem>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => update({ status: undefined, plan: undefined, method: undefined, employerId: undefined })}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading && !result ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table className={loading ? "opacity-60" : undefined}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paid</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Recorded by</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No payments recorded {hasFilters ? "for these filters" : "in this range"}
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="text-sm whitespace-nowrap">{fmtDate(p.paidAt)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{p.job?.title ?? "—"}</div>
                        {p.job?.company && <div className="text-xs text-muted-foreground">{p.job.company}</div>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.employer ? (
                          <OwnerLink id={p.employer._id} role="employer">
                            {p.employer.name || p.employer.email}
                          </OwnerLink>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{PAID_PLAN_LABELS[p.plan] ?? p.plan}</TableCell>
                      <TableCell className="text-right font-medium">{formatRupees(p.amountPaise)}</TableCell>
                      <TableCell className="text-sm">
                        {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                        {p.reference && <div className="text-xs text-muted-foreground">{p.reference}</div>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{personName(p.recordedBy)}</TableCell>
                      <TableCell>
                        {p.status === "refunded" ? (
                          <>
                            <Badge variant="destructive">Refunded</Badge>
                            <div className="text-xs text-muted-foreground mt-1" title={p.refundReason ?? ""}>
                              {fmtDate(p.refundedAt)}
                            </div>
                          </>
                        ) : (
                          <Badge variant="outline">Recorded</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label="Payment actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {p.job && (
                              <DropdownMenuItem asChild>
                                <Link to={`${PATHS.ADMIN.HIRING.JOBS}?tab=all&open=${p.job._id}`}>Open job</Link>
                              </DropdownMenuItem>
                            )}
                            {p.employer && (
                              <DropdownMenuItem asChild>
                                <Link to={`${PATHS.ADMIN.EMPLOYERS_ADMIN.LIST}/${p.employer._id}`}>Open employer</Link>
                              </DropdownMenuItem>
                            )}
                            {isSuperadmin && p.status === "recorded" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onSelect={() => setRefundFor(p)}>
                                  Refund…
                                </DropdownMenuItem>
                              </>
                            )}
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

      <RecordPaymentDialog open={recordOpen} onOpenChange={setRecordOpen} onRecorded={() => setReloadKey((n) => n + 1)} />

      <ReasonDialog
        open={!!refundFor}
        title="Refund payment"
        description={
          refundFor
            ? `${formatRupees(refundFor.amountPaise)} for ${refundFor.job?.title ?? "this job"}. The job keeps its plan; change it on the Job Desk if needed.`
            : ""
        }
        confirmLabel="Refund"
        destructive
        reasonRequired
        onCancel={() => setRefundFor(null)}
        onConfirm={runRefund}
      />
    </div>
  );
};

export default Payments;
