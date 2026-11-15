// src/pages/admin/employers/Funnel.tsx
// Employer admin 7.1: every /post-a-job draft as a call list. Open drafts are
// employers who stopped before posting. Tab, step, age and campaign live in
// the URL so the Overview "abandoned drafts" tile links straight here.
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { employerAdminApi } from "@/api/employerAdmin";
import type { DraftStep, FunnelDraftRow, FunnelFilters, FunnelResult, FunnelTab } from "@/types/employerAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ExternalLink, MessageCircle, Phone, RefreshCw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fmtDateTime } from "@/components/admin/recruiters/recruiterFormat";
import { CHANNEL_LABELS, DRAFT_STEP_LABELS } from "@/components/admin/employers/employerLabels";
import SourceBadge from "@/components/admin/employers/SourceBadge";
import OwnerLink from "@/components/admin/hiring/OwnerLink";

const PAGE_SIZE = 25;
const ALL = "all";
const OPEN_STEPS: DraftStep[] = ["whatsapp", "company", "basics", "generate", "review"];
const AGE_OPTIONS: [string, string][] = [
  ["24", "Last saved 24h+ ago"],
  ["72", "Last saved 3 days+ ago"],
  ["168", "Last saved 7 days+ ago"],
];

/** wa.me wants digits only, with the country code. */
const waLink = (n: string) => `https://wa.me/${n.replace(/\D/g, "")}`;
const telLink = (n: string) => `tel:${n.replace(/[^\d+]/g, "")}`;

const ageLabel = (h: number) => (h < 48 ? `${h} h` : `${Math.round(h / 24)} days`);

const Funnel: React.FC = () => {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<FunnelResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [campaignInput, setCampaignInput] = useState(params.get("utmCampaign") ?? "");
  const [contactFor, setContactFor] = useState<FunnelDraftRow | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const tab = (["open", "posted", "all"].includes(params.get("tab") ?? "") ? params.get("tab") : "open") as FunnelTab;
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
      const v = campaignInput.trim();
      if (v !== (params.get("utmCampaign") ?? "")) update({ utmCampaign: v || undefined });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignInput]);

  const filters: FunnelFilters = useMemo(
    () => ({
      tab,
      step: (params.get("step") as DraftStep) || undefined,
      olderThanHours: params.get("olderThanHours") || undefined,
      channel: params.get("channel") || undefined,
      utmCampaign: params.get("utmCampaign") || undefined,
    }),
    [params, tab]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    employerAdminApi
      .funnel(page, PAGE_SIZE, filters, { signal: ctrl.signal })
      .then(setResult)
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load drafts");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [page, filters, reloadKey]);

  const saveContacted = async () => {
    if (!contactFor) return;
    try {
      setSaving(true);
      await employerAdminApi.markDraftContacted(contactFor._id, note.trim());
      toast({ title: "Marked contacted", description: "Saved as a note on the employer" });
      setContactFor(null);
      setNote("");
      setReloadKey((n) => n + 1);
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const rows = result?.data ?? [];
  const counts = result?.stepCounts;
  const stepChips: DraftStep[] = tab === "posted" ? ["posted"] : tab === "open" ? OPEN_STEPS : [...OPEN_STEPS, "posted"];
  const activeStep = params.get("step");
  const hasFilters = !!(activeStep || params.get("olderThanHours") || params.get("channel") || params.get("utmCampaign"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-extrabold tracking-tight">Post-a-Job Funnel</h1>
        <p className="text-muted-foreground mt-1">
          Every /post-a-job draft. Open drafts are employers who stopped before posting: call them.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={tab} onValueChange={(v) => update({ tab: v === "open" ? undefined : v, step: undefined })}>
              <TabsList>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="posted">Posted</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
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

          {/* Step chips with counts */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={activeStep ? "outline" : "default"}
              onClick={() => update({ step: undefined })}
            >
              All steps
              {counts && (
                <span className="ml-1 opacity-80">({stepChips.reduce((a, s) => a + (counts[s] ?? 0), 0)})</span>
              )}
            </Button>
            {stepChips.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={activeStep === s ? "default" : "outline"}
                onClick={() => update({ step: activeStep === s ? undefined : s })}
              >
                {DRAFT_STEP_LABELS[s]}
                {counts && <span className="ml-1 opacity-80">({counts[s] ?? 0})</span>}
              </Button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={params.get("olderThanHours") ?? ALL}
              onValueChange={(v) => update({ olderThanHours: v === ALL ? undefined : v })}
            >
              <SelectTrigger className="w-52" aria-label="Age">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any age</SelectItem>
                {AGE_OPTIONS.map(([v, label]) => (
                  <SelectItem key={v} value={v}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={params.get("channel") ?? ALL}
              onValueChange={(v) => update({ channel: v === ALL ? undefined : v })}
            >
              <SelectTrigger className="w-44" aria-label="Channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any channel</SelectItem>
                <SelectItem value="meta_paid">Meta ads</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Campaign (utm_campaign)"
              value={campaignInput}
              onChange={(e) => setCampaignInput(e.target.value)}
              className="w-56"
            />
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCampaignInput("");
                  update({ step: undefined, olderThanHours: undefined, channel: undefined, utmCampaign: undefined });
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <CardDescription>
            {result ? `${result.pagination.total} drafts` : "Loading drafts..."} · WhatsApp numbers show only when
            the employer agreed to WhatsApp messages.
          </CardDescription>
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
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className={loading ? "opacity-60" : undefined}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employer</TableHead>
                    <TableHead>Draft</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead>Last saved</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {hasFilters ? "No drafts match these filters" : "No drafts here"}
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>
                        <OwnerLink id={r.employer._id} role={r.employer.role ?? "employer"} className="font-medium">
                          {r.employer.name || r.employer.email}
                        </OwnerLink>
                        {r.employer.name && <div className="text-xs text-muted-foreground">{r.employer.email}</div>}
                        {!r.employer.isActive && <Badge variant="destructive">Suspended</Badge>}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {r.employer.phone && (
                            <Button asChild size="sm" variant="outline" className="h-7 px-2">
                              <a href={telLink(r.employer.phone)}>
                                <Phone className="h-3.5 w-3.5 mr-1" />
                                {r.employer.phone}
                              </a>
                            </Button>
                          )}
                          {r.employer.whatsapp.number ? (
                            <Button asChild size="sm" variant="outline" className="h-7 px-2">
                              <a href={waLink(r.employer.whatsapp.number)} target="_blank" rel="noreferrer noopener">
                                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                WhatsApp
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground self-center">
                              {r.employer.whatsapp.status === "opted_out" ? "WhatsApp opted out" : "No WhatsApp consent"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{r.title || "(no title yet)"}</div>
                        <div className="text-xs text-muted-foreground">{r.company || "No company yet"}</div>
                        {r.postedJob && (
                          <div className="text-xs mt-1">
                            {r.postedJob.publicUrl ? (
                              <a
                                href={r.postedJob.publicUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                Posted job <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              "Posted"
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "posted" ? "default" : "secondary"}>{DRAFT_STEP_LABELS[r.step]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {fmtDateTime(r.lastSavedAt)}
                        <div className={`text-xs ${r.status === "open" && r.ageHours >= 24 ? "text-amber-700" : "text-muted-foreground"}`}>
                          {ageLabel(r.ageHours)} ago
                        </div>
                      </TableCell>
                      <TableCell>
                        <SourceBadge source={r.acquisition.source} />
                        {(r.acquisition.utmCampaign || r.acquisition.channel) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {r.acquisition.utmCampaign ||
                              CHANNEL_LABELS[r.acquisition.channel ?? ""] ||
                              r.acquisition.channel}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm max-w-[260px]">
                        {r.latestNote ? (
                          <>
                            <div className="line-clamp-2" title={r.latestNote.body}>
                              {r.latestNote.body}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {r.latestNote.by} · {fmtDateTime(r.latestNote.createdAt)}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.employer.role === "employer" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNote("");
                              setContactFor(r);
                            }}
                          >
                            Mark contacted
                          </Button>
                        )}
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

      <Dialog open={!!contactFor} onOpenChange={(o) => !o && !saving && setContactFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark contacted</DialogTitle>
            <DialogDescription>
              Saved as a note on {contactFor?.employer.name || contactFor?.employer.email}, starting “Funnel
              follow-up:”. It also shows on Employer Detail → Notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="funnel-note">What happened (optional)</Label>
            <Textarea
              id="funnel-note"
              value={note}
              maxLength={1900}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Called, will post tomorrow; needs help with the job description"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactFor(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveContacted} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        Steps are worked out from what the employer saved. Admins never edit drafts.{" "}
        <Link to="/admin/employers/overview" className="text-primary hover:underline">
          Back to Overview
        </Link>
      </p>
    </div>
  );
};

export default Funnel;
