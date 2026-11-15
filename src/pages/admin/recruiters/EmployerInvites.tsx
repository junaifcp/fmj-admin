// src/pages/admin/recruiters/EmployerInvites.tsx
// Recruiter admin 8.2: every employer invite recruiters have sent, delivery,
// heavy senders, revoke and resend. Filters live in the URL
// (?status=send_failed, ?recruiterId=, ?jobId=).
import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { employerInvitesApi } from "@/api/hiringDeskAdmin";
import type { AdminInviteRow, HeavySender, Paged } from "@/types/recruiterAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { InviteActionsMenu } from "@/components/admin/recruiters/DeskActions";
import { INVITE_STATUS_LABELS } from "@/components/admin/recruiters/deskLabels";
import { fmtDate, fmtDateTime } from "@/components/admin/recruiters/recruiterFormat";
import OwnerLink from "@/components/admin/hiring/OwnerLink";

const PAGE_SIZE = 20;
const ALL = "all";

const STATUS_OPTIONS = Object.entries(INVITE_STATUS_LABELS);
const WHATSAPP_OPTIONS: [string, string][] = [
  ["sent", "WhatsApp sent"],
  ["queued", "WhatsApp queued"],
  ["failed", "WhatsApp failed"],
  ["skipped", "WhatsApp skipped"],
  ["none", "No WhatsApp"],
];

const EmployerInvitesPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paged<AdminInviteRow> | null>(null);
  const [heavy, setHeavy] = useState<HeavySender[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const setParam = useCallback(
    (key: string, value?: string) => {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== searchInput.trim()) setParam("q", searchInput.trim() || undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, params, setParam]);

  const status = params.get("status") || undefined;
  const whatsappStatus = params.get("whatsappStatus") || undefined;
  const recruiterId = params.get("recruiterId") || undefined;
  const jobId = params.get("jobId") || undefined;
  const q = params.get("q") || undefined;
  const from = params.get("from") || undefined;
  const to = params.get("to") || undefined;

  useEffect(() => setPage(1), [status, whatsappStatus, recruiterId, jobId, q, from, to]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    employerInvitesApi
      .list(
        {
          page,
          limit: PAGE_SIZE,
          status,
          whatsappStatus,
          recruiterId,
          jobId,
          q,
          from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
          to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
        },
        { signal: ctrl.signal }
      )
      .then(setResult)
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load invites");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [page, status, whatsappStatus, recruiterId, jobId, q, from, to, reloadKey]);

  useEffect(() => {
    const ctrl = new AbortController();
    employerInvitesApi
      .heavySenders(24, 20, { signal: ctrl.signal })
      .then((r) => setHeavy(r.data))
      .catch(() => {
        if (!ctrl.signal.aborted) setHeavy([]);
      });
    return () => ctrl.abort();
  }, [reloadKey]);

  const rows = result?.data ?? [];
  const hasFilters = !!(status || whatsappStatus || recruiterId || jobId || q || from || to);
  const clear = () => {
    setSearchInput("");
    setParams(new URLSearchParams(), { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-extrabold tracking-tight">Employer Invites</h1>
        <p className="text-muted-foreground mt-1">
          Jobs recruiters shared with employers by email or WhatsApp. Each invite can create an employer account.
        </p>
      </div>

      {heavy && heavy.length > 0 && (
        <Alert className="border-amber-300 bg-amber-50/60">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">More than 20 invites in the last 24 hours</div>
            <div className="flex flex-wrap gap-2">
              {heavy.map((h) => (
                <Button
                  key={h.recruiterId}
                  variant="outline"
                  size="sm"
                  onClick={() => setParam("recruiterId", h.recruiterId)}
                >
                  {h.name || h.email}: {h.invites}
                </Button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All invites</CardTitle>
              <CardDescription>
                {result ? `${result.pagination.total} invites` : "Loading…"} · WhatsApp numbers show the last 4 digits
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Invited email"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 w-56"
              />
            </div>
            <Select value={status ?? ALL} onValueChange={(v) => setParam("status", v === ALL ? undefined : v)}>
              <SelectTrigger className="w-40" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Status: all</SelectItem>
                {STATUS_OPTIONS.map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={whatsappStatus ?? ALL}
              onValueChange={(v) => setParam("whatsappStatus", v === ALL ? undefined : v)}
            >
              <SelectTrigger className="w-44" aria-label="WhatsApp">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>WhatsApp: all</SelectItem>
                {WHATSAPP_OPTIONS.map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Sent
              <input
                type="date"
                aria-label="Sent from"
                value={from ?? ""}
                onChange={(e) => setParam("from", e.target.value || undefined)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              />
              to
              <input
                type="date"
                aria-label="Sent to"
                value={to ?? ""}
                onChange={(e) => setParam("to", e.target.value || undefined)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              />
            </div>
            {recruiterId && (
              <Button variant="outline" size="sm" onClick={() => setParam("recruiterId")}>
                One recruiter <X className="h-4 w-4 ml-1" />
              </Button>
            )}
            {jobId && (
              <Button variant="outline" size="sm" onClick={() => setParam("jobId")}>
                One job <X className="h-4 w-4 ml-1" />
              </Button>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clear}>
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
                      <TableHead>Invited</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Recruiter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {hasFilters ? "No invites match these filters" : "No invites yet"}
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm break-all">{s.email}</TableCell>
                        <TableCell className="text-sm">
                          {s.jobTitle || "—"}
                          {s.jobRemoved && (
                            <Badge variant="destructive" className="ml-1">
                              Job removed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.recruiter ? (
                            <OwnerLink id={s.recruiter._id} role="recruiter">
                              {s.recruiter.name || s.recruiter.email}
                            </OwnerLink>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.status === "send_failed" ? "destructive" : "outline"}>
                            {INVITE_STATUS_LABELS[s.status] ?? s.status}
                          </Badge>
                          {s.lastError && <div className="text-xs text-destructive mt-1">{s.lastError}</div>}
                          {s.status === "accepted" && s.acceptedAt && (
                            <div className="text-xs text-muted-foreground mt-1">{fmtDate(s.acceptedAt)}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.whatsapp ? `${s.whatsapp.number ?? ""} · ${s.whatsapp.status}` : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {fmtDateTime(s.sentAt ?? s.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <InviteActionsMenu
                            inviteId={s.id}
                            email={s.email}
                            status={s.status}
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

export default EmployerInvitesPage;
