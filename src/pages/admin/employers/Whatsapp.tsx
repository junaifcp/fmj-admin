// src/pages/admin/employers/Whatsapp.tsx
// Employer admin 9.1: WhatsApp messages to employers and their consent.
// Numbers show the last 4 digits; message text is never stored or shown.
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { whatsappAdminApi } from "@/api/paidServicesAdmin";
import { employerAdminApi } from "@/api/employerAdmin";
import type { Paged } from "@/types/recruiterAdmin";
import type {
  ConsentState,
  WhatsappConsentRow,
  WhatsappMessageFilters,
  WhatsappMessagesResult,
  WhatsappStatus,
  WhatsappSummary,
} from "@/types/employerAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fmtDate, fmtDateTime } from "@/components/admin/recruiters/recruiterFormat";
import { ReasonDialog } from "@/components/admin/recruiters/RecruiterBits";
import OwnerLink from "@/components/admin/hiring/OwnerLink";
import { WHATSAPP_TEMPLATE_LABELS } from "@/components/admin/employers/employerLabels";
import { PATHS } from "@/routes/paths";

const PAGE_SIZE = 25;
const ALL = "all";

const STATUS_BADGE: Record<WhatsappStatus, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "outline",
  queued: "secondary",
  skipped: "secondary",
  failed: "destructive",
};

const CONSENT_LABELS: Record<ConsentState, string> = {
  consented: "Consented",
  opted_out: "Opted out",
  skipped: "Skipped",
  none: "No number",
};

function Pager({
  page,
  totalPages,
  loading,
  onPage,
}: {
  page: number;
  totalPages: number;
  loading: boolean;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 mt-4 text-sm">
      <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      Page {page} of {totalPages}
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages || loading}
        onClick={() => onPage(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

const Whatsapp: React.FC = () => {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "consent" ? "consent" : "messages";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [summary, setSummary] = useState<WhatsappSummary | null>(null);
  const [messages, setMessages] = useState<WhatsappMessagesResult | null>(null);
  const [consent, setConsent] = useState<Paged<WhatsappConsentRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");
  const [toggle, setToggle] = useState<WhatsappConsentRow | null>(null);

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

  const messageFilters: WhatsappMessageFilters = useMemo(
    () => ({
      status: (params.get("status") as WhatsappStatus) || undefined,
      template: params.get("template") || undefined,
      userId: params.get("userId") || undefined,
    }),
    [params]
  );
  const consentFilters = useMemo(
    () => ({ state: (params.get("state") as ConsentState) || undefined, q: params.get("q") || undefined }),
    [params]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    whatsappAdminApi
      .summary({}, { signal: ctrl.signal })
      .then(setSummary)
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [reloadKey]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    const p =
      tab === "messages"
        ? whatsappAdminApi.messages(page, PAGE_SIZE, messageFilters, { signal: ctrl.signal }).then(setMessages)
        : whatsappAdminApi.consent(page, PAGE_SIZE, consentFilters, { signal: ctrl.signal }).then(setConsent);
    p.catch((e) => {
      if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load");
    }).finally(() => {
      if (!ctrl.signal.aborted) setLoading(false);
    });
    return () => ctrl.abort();
  }, [tab, page, messageFilters, consentFilters, reloadKey]);

  const runToggle = async (reason: string) => {
    if (!toggle) return;
    const optOut = toggle.state !== "opted_out";
    try {
      await employerAdminApi.setWhatsappOptOut(toggle.employer._id, optOut, reason);
      toast({
        title: optOut ? "WhatsApp turned off" : "WhatsApp turned back on",
        description: "Recorded in the activity log",
      });
      setToggle(null);
      setReloadKey((n) => n + 1);
    } catch (e) {
      toast({ title: "Action failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  const providerOff = summary?.providerConfigured === false || messages?.providerConfigured === false;
  const t = summary?.totals;
  const userFilter = params.get("userId");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-sans font-extrabold tracking-tight">WhatsApp</h1>
          <p className="text-muted-foreground mt-1">
            Messages to employers and who agreed to them. Numbers show the last 4 digits; message text is not stored.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setReloadKey((n) => n + 1)} disabled={loading} aria-label="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {providerOff && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>WhatsApp provider not configured</AlertTitle>
          <AlertDescription>TECRON_API_KEY is missing: messages are queued but not sent.</AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {(["sent", "failed", "skipped", "queued"] as WhatsappStatus[]).map((s) => (
          <Card
            key={s}
            className={`cursor-pointer hover:shadow-md transition-shadow ${s === "failed" && (t?.failed ?? 0) > 0 ? "border-destructive/40" : ""}`}
            onClick={() => update({ tab: undefined, status: s })}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground capitalize">{s}</CardTitle>
            </CardHeader>
            <CardContent>
              {summary ? <div className="text-2xl font-bold">{t?.[s] ?? 0}</div> : <Skeleton className="h-8 w-16" />}
            </CardContent>
          </Card>
        ))}
      </div>

      {summary && summary.topErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top errors</CardTitle>
            <CardDescription>Failed and skipped messages, all time</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {summary.topErrors.map((e) => (
                <li key={e.error} className="flex items-start justify-between gap-4">
                  <code className="text-xs break-all">{e.error}</code>
                  <span className="font-medium whitespace-nowrap">{e.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => update({ tab: v === "messages" ? undefined : v, status: undefined, state: undefined })}>
            <TabsList>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="consent">Consent</TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === "messages" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={params.get("status") === "failed" ? "destructive" : "outline"}
                onClick={() => update({ status: params.get("status") === "failed" ? undefined : "failed" })}
              >
                Failed only
              </Button>
              <Select value={params.get("status") ?? ALL} onValueChange={(v) => update({ status: v === ALL ? undefined : v })}>
                <SelectTrigger className="w-40" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any status</SelectItem>
                  {(["sent", "failed", "skipped", "queued"] as WhatsappStatus[]).map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={params.get("template") ?? ALL} onValueChange={(v) => update({ template: v === ALL ? undefined : v })}>
                <SelectTrigger className="w-48" aria-label="Message">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any message</SelectItem>
                  {Object.entries(WHATSAPP_TEMPLATE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userFilter && (
                <Badge variant="secondary" className="gap-1">
                  One employer
                  <button type="button" aria-label="Remove employer filter" onClick={() => update({ userId: undefined })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Employer name or email"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 w-60"
                />
              </div>
              <Select value={params.get("state") ?? ALL} onValueChange={(v) => update({ state: v === ALL ? undefined : v })}>
                <SelectTrigger className="w-44" aria-label="Consent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any consent</SelectItem>
                  {(Object.keys(CONSENT_LABELS) as ConsentState[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {CONSENT_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {tab === "messages" ? (
            loading && !messages ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className={loading ? "opacity-60" : undefined}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Employer</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(messages?.data ?? []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No messages match
                          </TableCell>
                        </TableRow>
                      )}
                      {(messages?.data ?? []).map((m) => (
                        <TableRow key={m._id}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDateTime(m.createdAt)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{WHATSAPP_TEMPLATE_LABELS[m.template] ?? m.template}</div>
                            {m.job && (
                              <Link
                                to={`${PATHS.ADMIN.HIRING.JOBS}?tab=all&open=${m.job._id}`}
                                className="text-xs text-primary hover:underline"
                              >
                                {m.job.title}
                              </Link>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {m.employer ? (
                              <OwnerLink id={m.employer._id} role="employer">
                                {m.employer.name || m.employer.email}
                              </OwnerLink>
                            ) : (
                              <span className="text-muted-foreground">Not linked</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{m.to ?? "—"}</TableCell>
                          <TableCell className="max-w-[320px]">
                            <Badge variant={STATUS_BADGE[m.status]} className="capitalize">
                              {m.error === "opted_out" ? "Skipped (opted out)" : m.status}
                            </Badge>
                            {m.error && m.error !== "opted_out" && (
                              <div className="text-xs text-destructive mt-1 line-clamp-2" title={m.error}>
                                {m.error}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pager
                  page={page}
                  totalPages={messages?.pagination.totalPages ?? 0}
                  loading={loading}
                  onPage={(p) => update({ page: String(p) }, true)}
                />
                <p className="text-xs text-muted-foreground mt-3">
                  Rows from before 12 Nov 2026 link to an employer once the log backfill runs.
                </p>
              </>
            )
          ) : loading && !consent ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className={loading ? "opacity-60" : undefined}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employer</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Consent</TableHead>
                      <TableHead>Last message</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(consent?.data ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No employers match
                        </TableCell>
                      </TableRow>
                    )}
                    {(consent?.data ?? []).map((c) => (
                      <TableRow key={c.employer._id}>
                        <TableCell className="text-sm">
                          <OwnerLink id={c.employer._id} role="employer">
                            {c.employer.name || c.employer.email}
                          </OwnerLink>
                          {c.employer.name && <div className="text-xs text-muted-foreground">{c.employer.email}</div>}
                        </TableCell>
                        <TableCell className="text-sm">{c.number ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={c.state === "opted_out" ? "destructive" : c.state === "consented" ? "outline" : "secondary"}>
                            {CONSENT_LABELS[c.state]}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {fmtDate(c.optOutAt ?? c.consentAt ?? c.skippedAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.lastMessage ? (
                            <button
                              type="button"
                              className="text-left hover:underline"
                              onClick={() => update({ tab: undefined, state: undefined, q: undefined, userId: c.employer._id })}
                            >
                              <span className="capitalize">{c.lastMessage.status}</span>
                              <div className="text-xs text-muted-foreground">{fmtDateTime(c.lastMessage.at)}</div>
                            </button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {(c.state === "opted_out" || c.number) && (
                            <Button size="sm" variant="outline" onClick={() => setToggle(c)}>
                              {c.state === "opted_out" ? "Opt back in…" : "Opt out…"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pager
                page={page}
                totalPages={consent?.pagination.totalPages ?? 0}
                loading={loading}
                onPage={(p) => update({ page: String(p) }, true)}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ReasonDialog
        open={!!toggle}
        title={toggle?.state === "opted_out" ? "Turn WhatsApp back on" : "Turn off WhatsApp"}
        description={
          toggle?.state === "opted_out"
            ? "Only do this if the employer asked for WhatsApp messages again."
            : "No WhatsApp message will be sent to this employer. They still get emails."
        }
        confirmLabel={toggle?.state === "opted_out" ? "Turn on" : "Turn off"}
        destructive={toggle?.state !== "opted_out"}
        reasonRequired={toggle?.state !== "opted_out"}
        onCancel={() => setToggle(null)}
        onConfirm={runToggle}
      />
    </div>
  );
};

export default Whatsapp;
