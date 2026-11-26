// src/pages/admin/candidates/VerificationPage.tsx
// Candidate verification approval 5.1: Candidates → Verification.
// One row per submitted identity document. Pending first; Approved and All on
// the filter. View streams the private file; Approve sets the candidate verified.
// DigiLocker verification: a Source column, and View on a DigiLocker row shows
// what DigiLocker said beside the profile name. PAN and driving licence
// (2026-11-18) also show their stored file; an Aadhaar (paused) shows its photo
// and XML download. DigiLocker rows are verified already: no Approve.
// Decisions: docs/candidate-verification-approval/locked-decisions.md,
// docs/digilocker-verification/locked-decisions.md (Admin UI)
import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { CheckCircle2, Download, Eye, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { verificationReviewApi } from "@/api/verificationReview";
import { CareerProofsTab } from "./CareerProofsTab";
import type {
  VerificationDigilockerDetails,
  VerificationReviewFilter,
  VerificationReviewRow,
  VerificationSide,
} from "@/types/verificationReview";

const PAGE_SIZE = 20;
const CONFIRM_TEXT = "Approve this document? This candidate will show as verified.";

const FILTERS: { value: VerificationReviewFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Approved" },
  { value: "all", label: "All" },
];

const EMPTY_TEXT: Record<VerificationReviewFilter, string> = {
  pending: "No pending verifications.",
  verified: "No approved verifications.",
  all: "No verifications yet.",
};

const isFilter = (v: string | null): v is VerificationReviewFilter =>
  v === "pending" || v === "verified" || v === "all";

const rowKey = (r: VerificationReviewRow) => `${r.candidateId}:${r.type}`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "d MMM yyyy, h:mm a");
};

/** 1 … 4 5 6 … 12 */
const pageWindow = (page: number, totalPages: number): (number | "…")[] => {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const nums = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
};

const StatusPill: React.FC<{ status: VerificationReviewRow["status"] }> = ({ status }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
      status === "verified"
        ? "bg-primary/10 text-primary"
        : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
    )}
  >
    {status === "verified" ? "Approved" : "Pending"}
  </span>
);

const SourcePill: React.FC<{ source: VerificationReviewRow["source"] }> = ({ source }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
      source === "digilocker"
        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
        : "bg-muted text-muted-foreground"
    )}
  >
    {source === "digilocker" && <ShieldCheck className="h-3.5 w-3.5" aria-hidden />}
    {source === "digilocker" ? "DigiLocker" : "Manual"}
  </span>
);

// ---------------------------------------------------------------------------
// DigiLocker details: what the e-Aadhaar said, beside the profile name.
// ---------------------------------------------------------------------------

const GENDER_LABELS: Record<VerificationDigilockerDetails["gender"], string> = {
  M: "Male",
  F: "Female",
  T: "Transgender",
};

/** YYYY-MM-DD → "15 Aug 1995", without a time-zone shift. */
const formatDob = (dob: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  return m ? format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])), "d MMM yyyy") : dob || "—";
};

type PhotoState = { state: "none" } | { state: "loading" } | { state: "ready"; url: string } | { state: "error" };

const DigilockerDetailsView: React.FC<{ row: VerificationReviewRow }> = ({ row }) => {
  const details = row.digilocker;
  const isAadhaar = row.type === "aadhaar";
  const [photo, setPhoto] = useState<PhotoState>({ state: "none" });
  const [downloading, setDownloading] = useState(false);

  // The photo streams through the admin route as a blob; revoked on close.
  useEffect(() => {
    if (!details?.hasPhoto) {
      setPhoto({ state: "none" });
      return;
    }
    const controller = new AbortController();
    let url: string | null = null;
    setPhoto({ state: "loading" });
    verificationReviewApi
      .getFile(row.candidateId, row.type, "photo", controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setPhoto({ state: "ready", url });
      })
      .catch(() => {
        if (!controller.signal.aborted) setPhoto({ state: "error" });
      });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [row.candidateId, row.type, details?.hasPhoto]);

  const downloadXml = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await verificationReviewApi.getFile(row.candidateId, row.type, "front");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = row.frontFileName || "e-aadhaar.xml";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (e) {
      toast.error((e as Error).message || "Could not download the e-Aadhaar XML.");
    } finally {
      setDownloading(false);
    }
  };

  if (!details) {
    return <p className="rounded-md bg-muted p-4 text-sm text-destructive">DigiLocker details are missing.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4" aria-hidden />
        Verified via DigiLocker
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {(isAadhaar || details.hasPhoto) && (
          <div className="flex h-40 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {photo.state === "ready" ? (
              <img src={photo.url} alt="Aadhaar photo" className="h-full w-full object-cover" />
            ) : photo.state === "loading" ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div className="flex flex-col items-center gap-1 px-2 text-center text-xs text-muted-foreground">
                <UserRound className="h-8 w-8" aria-hidden />
                {photo.state === "error" ? "Photo couldn't load" : "No photo"}
              </div>
            )}
          </div>
        )}

        <dl className="grid flex-1 grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{isAadhaar ? "Aadhaar name" : "DigiLocker name"}</dt>
            <dd className="break-words font-medium">{details.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Profile name</dt>
            <dd className="break-words font-medium">{row.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Date of birth</dt>
            <dd className="font-medium">{formatDob(details.dob)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Gender</dt>
            <dd className="font-medium">{(details.gender && GENDER_LABELS[details.gender]) || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{row.typeLabel}</dt>
            <dd className="font-medium tabular-nums">
              {!details.last4 ? "—" : isAadhaar ? `XXXX XXXX ${details.last4}` : `Ending in ${details.last4}`}
            </dd>
          </div>
          {details.issuer && (
            <div>
              <dt className="text-muted-foreground">Issued by</dt>
              <dd className="break-words font-medium">{details.issuer}</dd>
            </div>
          )}
        </dl>
      </div>

      {!isAadhaar ? null : details.hasXml ? (
        <Button type="button" variant="outline" onClick={downloadXml} disabled={downloading}>
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="mr-2 h-4 w-4" aria-hidden />
          )}
          Download e-Aadhaar XML
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          The e-Aadhaar XML wasn't stored because it held a full Aadhaar number.
        </p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// View dialog: each side loaded from the admin stream as a blob.
// ---------------------------------------------------------------------------

type SideState =
  | { state: "loading" }
  | { state: "ready"; url: string; mimeType: string }
  | { state: "error"; message: string };

const SidePreview: React.FC<{ label: string; fileName?: string; side: SideState }> = ({
  label,
  fileName,
  side,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        {fileName && (
          <span className="truncate text-xs text-muted-foreground" title={fileName}>
            {fileName}
          </span>
        )}
      </div>
      {side.state === "loading" && <Skeleton className="h-72 w-full" />}
      {side.state === "error" && (
        <p className="rounded-md bg-muted p-4 text-sm text-destructive">{side.message}</p>
      )}
      {side.state === "ready" &&
        (side.mimeType === "application/pdf" ? (
          <iframe
            src={side.url}
            title={`${label} preview`}
            className="h-[28rem] w-full rounded-md border bg-muted"
          />
        ) : side.mimeType.startsWith("image/") && !imageFailed ? (
          <img
            src={side.url}
            alt={`${label} of the document`}
            onError={() => setImageFailed(true)}
            className="max-h-[28rem] w-full rounded-md border bg-muted object-contain"
          />
        ) : (
          <div className="space-y-2 rounded-md bg-muted p-4 text-sm">
            <p className="text-muted-foreground">Preview isn't available for this file.</p>
            <a
              href={side.url}
              download={fileName || `${label.toLowerCase()}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Download file
            </a>
          </div>
        ))}
    </div>
  );
};

const ViewDialog: React.FC<{ row: VerificationReviewRow | null; onClose: () => void }> = ({
  row,
  onClose,
}) => {
  const [sides, setSides] = useState<Partial<Record<VerificationSide, SideState>>>({});

  useEffect(() => {
    // A DigiLocker Aadhaar shows its details instead (its front is XML, not an image).
    if (!row || (row.source === "digilocker" && row.type === "aadhaar")) return;
    const controller = new AbortController();
    const urls: string[] = [];
    setSides(Object.fromEntries(row.sides.map((s) => [s, { state: "loading" }])));
    for (const side of row.sides) {
      verificationReviewApi
        .getFile(row.candidateId, row.type, side, controller.signal)
        .then((blob) => {
          if (controller.signal.aborted) return;
          const url = URL.createObjectURL(blob);
          urls.push(url);
          setSides((prev) => ({ ...prev, [side]: { state: "ready", url, mimeType: blob.type } }));
        })
        .catch((e: Error) => {
          if (controller.signal.aborted) return;
          setSides((prev) => ({ ...prev, [side]: { state: "error", message: e.message } }));
        });
    }
    // Closing the dialog (or opening another row) revokes every blob URL.
    return () => {
      controller.abort();
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [row]);

  const twoSided = row?.sides.includes("back");

  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {row?.typeLabel}
            {row?.name ? ` · ${row.name}` : ""}
          </DialogTitle>
          <DialogDescription>
            {row ? `Submitted ${formatDate(row.submittedAt)}` : ""}
          </DialogDescription>
        </DialogHeader>
        {row?.source === "digilocker" && <DigilockerDetailsView row={row} />}
        {row && !(row.source === "digilocker" && row.type === "aadhaar") && (
          <div className={cn("grid gap-6", twoSided && "lg:grid-cols-2")}>
            {row.sides.map((side) => (
              <SidePreview
                key={side}
                label={twoSided ? (side === "front" ? "Front" : "Back") : "Document"}
                fileName={side === "front" ? row.frontFileName : row.backFileName}
                side={sides[side] ?? { state: "loading" }}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const IdDocumentsSection: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const statusParam = params.get("status");
  const filter: VerificationReviewFilter = isFilter(statusParam) ? statusParam : "pending";
  const pageParam = parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;

  const [rows, setRows] = useState<VerificationReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const [viewing, setViewing] = useState<VerificationReviewRow | null>(null);
  const [confirming, setConfirming] = useState<VerificationReviewRow | null>(null);
  const [approvingKey, setApprovingKey] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    verificationReviewApi
      .list({ status: filter, page, limit: PAGE_SIZE }, controller.signal)
      .then(({ data, pagination }) => {
        setRows(data);
        setTotal(pagination?.total ?? data.length);
        setTotalPages(pagination?.totalPages ?? 1);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (controller.signal.aborted) return;
        setError(e.message || "Could not load verifications.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [filter, page, reload]);

  const setFilter = (value: string) => {
    if (!isFilter(value) || value === filter) return;
    const next = new URLSearchParams(params);
    if (value === "pending") next.delete("status");
    else next.set("status", value);
    next.delete("page"); // a new filter starts on page 1
    setParams(next);
  };

  const goToPage = useCallback(
    (n: number) => {
      const next = new URLSearchParams(params);
      if (n <= 1) next.delete("page");
      else next.set("page", String(n));
      setParams(next);
    },
    [params, setParams]
  );

  const approve = async () => {
    const row = confirming;
    if (!row || approvingKey) return;
    const key = rowKey(row);
    setApprovingKey(key);
    try {
      const updated = await verificationReviewApi.approve(row.candidateId, row.type);
      toast.success("Document approved.");
      if (filter === "pending") {
        // It is no longer pending: drop it here instead of reloading the page.
        const remaining = rows.filter((r) => rowKey(r) !== key);
        setRows(remaining);
        setTotal((t) => Math.max(0, t - 1));
        if (remaining.length === 0 && total - 1 > 0) {
          if (page > 1) goToPage(page - 1);
          else setReload((n) => n + 1);
        }
      } else {
        setRows((prev) => prev.map((r) => (rowKey(r) === key ? updated : r)));
      }
      setConfirming(null);
    } catch (e) {
      toast.error((e as Error).message || "Could not approve this document.");
      setConfirming(null);
    } finally {
      setApprovingKey(null);
    }
  };

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verification</h1>
        <p className="text-sm text-muted-foreground">
          Identity documents candidates submitted. Approving one shows the candidate as verified.
        </p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList aria-label="Filter by status">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[13rem] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    <p className="text-sm text-destructive">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setReload((n) => n + 1)}
                    >
                      Try again
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    {EMPTY_TEXT[filter]}
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                rows.map((row) => {
                  const key = rowKey(row);
                  const busy = approvingKey === key;
                  return (
                    <TableRow key={key}>
                      <TableCell className="min-w-[200px]">
                        <div className="font-medium">{row.name || "—"}</div>
                        {row.email && (
                          <div className="text-xs text-muted-foreground">{row.email}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{row.typeLabel}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.source === "digilocker"
                            ? "e-Aadhaar"
                            : row.sides.includes("back")
                              ? "Front and back"
                              : "One file"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <SourcePill source={row.source} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(row.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <StatusPill status={row.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-[5.5rem]"
                            onClick={() => setViewing(row)}
                            aria-label={`View ${row.typeLabel} of ${row.name || "candidate"}`}
                          >
                            <Eye className="mr-1.5 h-4 w-4" />
                            View
                          </Button>
                          {row.status === "pending" && row.source !== "digilocker" ? (
                            // Opens the confirm dialog; nothing is sent until Approve there.
                            <Button
                              size="sm"
                              className="w-[6.5rem]"
                              disabled={approvingKey !== null}
                              onClick={() => setConfirming(row)}
                              aria-label={`Approve ${row.typeLabel} of ${row.name || "candidate"}`}
                            >
                              {busy ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                              )}
                              Approve
                            </Button>
                          ) : (
                            // Approved rows have no Approve; keep View lined up with the rows above.
                            <span aria-hidden className="w-[6.5rem]" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!loading && !error && total > PAGE_SIZE && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {from}–{to} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              Previous
            </Button>
            {pageWindow(page, totalPages).map((n, i) =>
              n === "…" ? (
                <span key={`gap-${i}`} className="px-1 text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={n}
                  variant={n === page ? "default" : "outline"}
                  size="sm"
                  aria-current={n === page ? "page" : undefined}
                  onClick={() => goToPage(n)}
                >
                  {n}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ViewDialog row={viewing} onClose={() => setViewing(null)} />

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open && !approvingKey) setConfirming(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve document</AlertDialogTitle>
            <AlertDialogDescription>{CONFIRM_TEXT}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approvingKey !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={approvingKey !== null}
              onClick={(e) => {
                // Keep the dialog open until the request finishes.
                e.preventDefault();
                void approve();
              }}
            >
              {approvingKey !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/**
 * Candidate full view 6.2: two sections on one page. "ID documents" is the
 * screen above, unchanged; "Career proofs" is the jobs / degrees / courses queue.
 * `?section=career` keeps the choice in the URL.
 */
const VerificationPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const section = params.get("section") === "career" ? "career" : "id";
  const choose = (value: string) => {
    const next = new URLSearchParams();
    if (value === "career") next.set("section", "career");
    setParams(next);
  };
  return (
    <div className="space-y-6">
      <Tabs value={section} onValueChange={choose}>
        <TabsList aria-label="What to review">
          <TabsTrigger value="id">ID documents</TabsTrigger>
          <TabsTrigger value="career">Career proofs</TabsTrigger>
        </TabsList>
      </Tabs>
      {section === "career" ? (
        <>
          <div>
            <h1 className="text-2xl font-bold">Career proofs</h1>
          </div>
          <CareerProofsTab />
        </>
      ) : (
        <IdDocumentsSection />
      )}
    </div>
  );
};

export default VerificationPage;
