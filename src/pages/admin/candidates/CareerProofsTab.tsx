// src/pages/admin/candidates/CareerProofsTab.tsx
// Candidate full view 6.2: Candidates → Verification → Career proofs. A
// candidate's proof for one job, degree or course. View the file (or the Fit My
// Skill certificate record), Approve with the final proof type, or Reject with a
// reason the candidate sees. Decided rows leave the Pending list in place.
// Decisions: docs/candidate-full-view/locked-decisions.md ("Proof per entry").
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Eye, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { entryProofReviewApi } from "@/api/entryProofReview";
import type { ProofKind, ProofQueueItem, ProofQueueStatus, ProofType } from "@/types/entryProofReview";

const PAGE_SIZE = 20;
const REASON_MAX = 200;

const STATUSES: { value: ProofQueueStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "verified", label: "Approved" },
];

const PROOF_TYPE_LABELS: Record<ProofType, string> = {
  offer_letter: "Offer letter",
  relieving_letter: "Relieving letter",
  experience_letter: "Experience letter",
  promotion_letter: "Promotion letter",
  payslip: "Payslip",
  company_hr_email: "Company HR email",
  company_id_card: "Company ID card",
  degree_certificate: "Degree certificate",
  marksheet: "Marksheet",
  provisional_certificate: "Provisional certificate",
  course_certificate: "Course certificate",
  fms_certificate: "Fit My Skill certificate",
};

const REJECT_PRESETS = [
  "File unreadable",
  "Name doesn't match",
  "Doesn't prove this job",
  "Dates don't match",
];

const when = (iso: string | null, pattern = "d MMM yyyy, h:mm a") => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(d, pattern);
};

const dates = (r: ProofQueueItem) =>
  [when(r.startDate, "MMM yyyy"), r.isPresent ? "Present" : when(r.endDate, "MMM yyyy")]
    .filter((x) => x !== "—")
    .join(" – ");

const StatusPill: React.FC<{ status: ProofQueueStatus }> = ({ status }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
      status === "verified" && "bg-primary/10 text-primary",
      status === "pending" && "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
      status === "rejected" && "bg-destructive/10 text-destructive"
    )}
  >
    {status === "verified" ? "Approved" : status === "pending" ? "Pending" : "Rejected"}
  </span>
);

/** The stored file, streamed as a blob: an image inline, a PDF in a frame. */
const ProofFile: React.FC<{ row: ProofQueueItem }> = ({ row }) => {
  const [state, setState] = useState<
    { s: "loading" } | { s: "ready"; url: string; type: string } | { s: "error"; message: string }
  >({ s: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    let url: string | null = null;
    setState({ s: "loading" });
    entryProofReviewApi
      .getFile(row.kind, row.rowId, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setState({ s: "ready", url, type: blob.type });
      })
      .catch((e: Error) => {
        if (!controller.signal.aborted) setState({ s: "error", message: e.message });
      });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [row.kind, row.rowId]);

  if (state.s === "loading") return <Skeleton className="h-96 w-full" />;
  if (state.s === "error") return <p className="text-sm text-destructive">{state.message}</p>;
  if (state.type === "application/pdf") {
    return <iframe title={row.fileName ?? "Proof"} src={state.url} className="h-[70vh] w-full rounded-md border" />;
  }
  if (state.type.startsWith("image/") && !/heic|heif/.test(state.type)) {
    return <img src={state.url} alt={row.fileName ?? "Proof"} className="max-h-[70vh] w-full rounded-md border object-contain" />;
  }
  return (
    <a href={state.url} download={row.fileName ?? "proof"} className="text-sm font-medium underline">
      Download {row.fileName ?? "the file"} (this file type can't be shown here)
    </a>
  );
};

const FmsDetails: React.FC<{ fms: NonNullable<ProofQueueItem["fms"]>; candidateName: string }> = ({
  fms,
  candidateName,
}) => (
  <div className="space-y-3">
    <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Serial</dt>
      <dd className="font-medium">{fms.serialNumber}</dd>
      <dt className="text-muted-foreground">Name on certificate</dt>
      <dd className="font-medium">{fms.certName}</dd>
      <dt className="text-muted-foreground">Profile name</dt>
      <dd className="font-medium">{candidateName}</dd>
      <dt className="text-muted-foreground">Course</dt>
      <dd className="font-medium">{fms.course}</dd>
    </dl>
    <p
      className={cn(
        "flex items-center gap-1.5 text-sm font-semibold",
        fms.nameMatch ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
      )}
    >
      {fms.nameMatch ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {fms.nameMatch ? "Name matches" : "Name doesn't match"}
    </p>
    {fms.imageUrl && (
      <img src={fms.imageUrl} alt="Certificate" className="max-h-[60vh] w-full rounded-md border object-contain" />
    )}
  </div>
);

export const CareerProofsTab: React.FC = () => {
  const [status, setStatus] = useState<ProofQueueStatus>("pending");
  const [kind, setKind] = useState<ProofKind>("experience");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ProofQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pending, setPending] = useState({ experience: 0, education: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const [viewing, setViewing] = useState<ProofQueueItem | null>(null);
  const [approving, setApproving] = useState<ProofQueueItem | null>(null);
  const [approveType, setApproveType] = useState<ProofType | "">("");
  const [rejecting, setRejecting] = useState<ProofQueueItem | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    entryProofReviewApi
      .list({ status, kind, page, limit: PAGE_SIZE }, controller.signal)
      .then((r) => {
        setRows(r.data);
        setTotal(r.pagination?.total ?? r.data.length);
        setTotalPages(r.pagination?.totalPages ?? 1);
        setPending(r.pendingCounts);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (controller.signal.aborted) return;
        setError(e.message || "Could not load career proofs.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [status, kind, page, reload]);

  /** A decided row leaves Pending without a reload. */
  const dropRow = (row: ProofQueueItem) => {
    const remaining = rows.filter((r) => r.rowId !== row.rowId);
    setRows(remaining);
    setTotal((t) => Math.max(0, t - 1));
    setPending((p) => ({ ...p, [row.kind]: Math.max(0, p[row.kind] - 1) }));
    if (remaining.length === 0) {
      if (page > 1) setPage(page - 1);
      else setReload((n) => n + 1);
    }
  };

  const openApprove = (row: ProofQueueItem) => {
    setApproving(row);
    setApproveType(row.type && row.allowedTypes.includes(row.type) ? row.type : "");
  };

  const approve = async () => {
    if (!approving || !approveType || busy) return;
    setBusy(true);
    try {
      await entryProofReviewApi.approve(approving.kind, approving.rowId, approveType);
      toast.success("Proof approved. The entry now shows as verified.");
      dropRow(approving);
      setApproving(null);
    } catch (e) {
      toast.error((e as Error).message || "Could not approve this proof.");
      setApproving(null);
      setReload((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    const text = reason.trim();
    if (!rejecting || !text || busy) return;
    setBusy(true);
    try {
      await entryProofReviewApi.reject(rejecting.kind, rejecting.rowId, text);
      toast.success("Proof rejected. The candidate sees the reason and can upload again.");
      dropRow(rejecting);
      setRejecting(null);
      setReason("");
    } catch (e) {
      toast.error((e as Error).message || "Could not reject this proof.");
      setRejecting(null);
      setReload((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Proof candidates sent for a job, degree or course. Approving marks that entry verified for
        hirers.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={kind}
          onValueChange={(v) => {
            setKind(v as ProofKind);
            setPage(1);
          }}
        >
          <TabsList aria-label="Entry type">
            <TabsTrigger value="experience">Jobs ({pending.experience} pending)</TabsTrigger>
            <TabsTrigger value="education">Education ({pending.education} pending)</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs
          value={status}
          onValueChange={(v) => {
            setStatus(v as ProofQueueStatus);
            setPage(1);
          }}
        >
          <TabsList aria-label="Filter by status">
            {STATUSES.map((s) => (
              <TabsTrigger key={s.value} value={s.value}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="flex items-center justify-between gap-4 p-6 text-sm">
              <span className="text-destructive">{error}</span>
              <Button variant="outline" size="sm" onClick={() => setReload((n) => n + 1)}>
                Try again
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>{status === "pending" ? "Sent" : "Reviewed"}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : rows.length === 0
                    ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                            {status === "pending" ? "No proofs waiting." : "Nothing here yet."}
                          </TableCell>
                        </TableRow>
                      )
                    : rows.map((r) => (
                        <TableRow key={r.rowId}>
                          <TableCell>
                            <div className="font-medium">{r.candidateName}</div>
                            <div className="text-xs text-muted-foreground">{r.email ?? "—"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{r.title || "—"}</div>
                            <div className="text-xs text-muted-foreground">{dates(r) || "—"}</div>
                          </TableCell>
                          <TableCell>
                            {r.type ? PROOF_TYPE_LABELS[r.type] : "—"}
                            {r.fms && (
                              <div
                                className={cn(
                                  "text-xs",
                                  r.fms.nameMatch ? "text-emerald-700" : "text-amber-700"
                                )}
                              >
                                {r.fms.nameMatch ? "Name matches" : "Name doesn't match"}
                              </div>
                            )}
                            {r.status === "rejected" && r.rejectReason && (
                              <div className="text-xs text-destructive">{r.rejectReason}</div>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {when(status === "pending" ? r.submittedAt : r.reviewedAt)}
                          </TableCell>
                          <TableCell>
                            <StatusPill status={r.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {(r.hasFile || r.fms) && (
                                <Button variant="outline" size="sm" onClick={() => setViewing(r)}>
                                  <Eye className="mr-1.5 h-4 w-4" />
                                  View
                                </Button>
                              )}
                              {r.status === "pending" && (
                                <>
                                  <Button size="sm" onClick={() => openApprove(r)}>
                                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setRejecting(r);
                                      setReason("");
                                    }}
                                  >
                                    <XCircle className="mr-1.5 h-4 w-4" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {from}–{to} of {total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
            <DialogDescription>
              {viewing ? `${viewing.candidateName} · ${dates(viewing)} · sent ${when(viewing.submittedAt)}` : ""}
            </DialogDescription>
          </DialogHeader>
          {viewing?.fms && <FmsDetails fms={viewing.fms} candidateName={viewing.candidateName} />}
          {viewing?.hasFile && <ProofFile row={viewing} />}
        </DialogContent>
      </Dialog>

      {/* Approve */}
      <Dialog open={!!approving} onOpenChange={(o) => !o && !busy && setApproving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve this proof?</DialogTitle>
            <DialogDescription>
              {approving ? `${approving.title} — ${approving.candidateName}. The entry will show as verified to hirers.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="approve-type" className="text-sm font-medium">
              Proof type
            </label>
            <Select value={approveType} onValueChange={(v) => setApproveType(v as ProofType)}>
              <SelectTrigger id="approve-type">
                <SelectValue placeholder="Choose what this proves" />
              </SelectTrigger>
              <SelectContent>
                {(approving?.allowedTypes ?? []).map((t) => (
                  <SelectItem key={t} value={t}>
                    {PROOF_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {approving?.type && (
              <p className="text-xs text-muted-foreground">
                The candidate said: {PROOF_TYPE_LABELS[approving.type]}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void approve()} disabled={!approveType || busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject */}
      <Dialog open={!!rejecting} onOpenChange={(o) => !o && !busy && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this proof?</DialogTitle>
            <DialogDescription>The candidate sees this reason and can upload again.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {REJECT_PRESETS.map((p) => (
                <Button key={p} type="button" variant="outline" size="sm" onClick={() => setReason(p)}>
                  {p}
                </Button>
              ))}
            </div>
            <Textarea
              aria-label="Reason"
              rows={3}
              maxLength={REASON_MAX}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why it can't be accepted"
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/{REASON_MAX}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void reject()} disabled={!reason.trim() || busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CareerProofsTab;
