// src/pages/admin/recruiters/Companies.tsx
// Recruiter admin 6.1: Companies verification queue (moved from Management).
// Tabs come from ?tab= (pending by default); ?ownerId= narrows to one owner.
import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { companyAdminApi } from "@/api/companyAdmin";
import { CompanyReferenceField, ReferencePill } from "@/components/admin/recruiters/CompanyReference";
import type {
  CompanyDetail,
  CompanyListResult,
  CompanyListRow,
  CompanySummary,
  CompanyVerification,
} from "@/types/recruiterAdmin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CompanyVerificationBadge } from "@/components/admin/recruiters/RecruiterBits";
import {
  MIN_REASON,
  fmtDate,
  fmtDateTime,
  personName,
} from "@/components/admin/recruiters/recruiterFormat";
import OwnerLink from "@/components/admin/hiring/OwnerLink";

type Tab = CompanyVerification | "all";
const TABS: { value: Tab; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];
const PAGE_SIZE = 20;

const isTab = (v: string | null): v is Tab => TABS.some((t) => t.value === v);
const websiteHref = (w: string) => (/^https?:\/\//i.test(w) ? w : `https://${w}`);

const Logo: React.FC<{ src?: string; name: string; size?: string }> = ({
  src,
  name,
  size = "h-9 w-9",
}) =>
  src ? (
    <img src={src} alt="" className={`${size} rounded object-contain border bg-white`} />
  ) : (
    <div className={`${size} rounded border bg-muted flex items-center justify-center`}>
      <Building className="h-4 w-4 text-muted-foreground" aria-label={name} />
    </div>
  );

/** The owner links to Recruiter or Employer Detail by role (employer admin 4.1). */
const OwnerCell: React.FC<{ id?: string; name?: string; email?: string; role?: string }> = ({
  id,
  name,
  email,
  role,
}) => {
  const label = name || email || "—";
  return (
    <div className="text-sm">
      <OwnerLink id={id} role={role}>
        {label}
      </OwnerLink>
      {name && email && <div className="text-xs text-muted-foreground">{email}</div>}
      {role && role !== "recruiter" && (
        <div className="text-xs text-muted-foreground capitalize">{role}</div>
      )}
    </div>
  );
};

const SummaryList: React.FC<{ title: string; rows: CompanySummary[]; empty: string }> = ({
  title,
  rows,
  empty,
}) => (
  <div className="space-y-2">
    <h4 className="text-sm font-medium">{title}</h4>
    {rows.length === 0 ? (
      <p className="text-sm text-muted-foreground">{empty}</p>
    ) : (
      <ul className="space-y-1">
        {rows.map((c) => {
          const owner = typeof c.ownerId === "object" && c.ownerId ? c.ownerId : null;
          return (
            <li key={c._id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">
                {c.name}
                {c.location?.city && (
                  <span className="text-muted-foreground"> · {c.location.city}</span>
                )}
                {owner && <span className="text-muted-foreground"> · {personName(owner)}</span>}
              </span>
              <CompanyVerificationBadge value={c.verified ?? "pending"} />
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

const CompaniesPage: React.FC = () => {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: Tab = isTab(tabParam) ? tabParam : "pending";
  const ownerId = params.get("ownerId") || undefined;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"createdAt" | "name">("createdAt");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<CompanyListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // ?open=<companyId> opens the drawer (links from the Activity Log).
  const [openId, setOpenIdState] = useState<string | null>(params.get("open"));
  const setOpenId = (id: string | null) => {
    setOpenIdState(id);
    if (!id && params.get("open")) {
      const next = new URLSearchParams(params);
      next.delete("open");
      setParams(next, { replace: true });
    }
  };
  const [detail, setDetail] = useState<CompanyDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState<CompanyVerification | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, sort, ownerId]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    companyAdminApi
      .list({ page, limit: PAGE_SIZE, verified: tab, q: search || undefined, ownerId, sort }, {
        signal: ctrl.signal,
      })
      .then(setResult)
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load companies");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [page, tab, search, sort, ownerId, reloadKey]);

  const loadDetail = useCallback((id: string, signal?: AbortSignal) => {
    setDetailError(null);
    return companyAdminApi
      .get(id, { signal })
      .then((d) => {
        setDetail(d);
        setNotes(d.verificationNotes ?? "");
      })
      .catch((e) => {
        if (!signal?.aborted) setDetailError(e instanceof Error ? e.message : "Failed to load");
      });
  }, []);

  useEffect(() => {
    if (!openId) return;
    const ctrl = new AbortController();
    setDetail(null);
    loadDetail(openId, ctrl.signal);
    return () => ctrl.abort();
  }, [openId, loadDetail]);

  const setTab = (value: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", value);
    setParams(next, { replace: true });
  };
  const clearOwner = () => {
    const next = new URLSearchParams(params);
    next.delete("ownerId");
    setParams(next, { replace: true });
  };

  const decide = async (verified: CompanyVerification) => {
    if (!detail) return;
    try {
      setSaving(verified);
      await companyAdminApi.setVerification(detail._id, verified, notes.trim());
      toast({
        title:
          verified === "verified"
            ? "Company verified"
            : verified === "rejected"
              ? "Company rejected"
              : "Moved back to pending",
        description: "Recorded in the activity log",
      });
      await loadDetail(detail._id);
      setReloadKey((n) => n + 1);
    } catch (e) {
      toast({
        title: "Could not update verification",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const rows = result?.data ?? [];
  const counts = result?.counts;
  const notesTooShort = notes.trim().length < MIN_REASON;
  const ownerLabel = ownerId
    ? rows[0]?.ownerName || rows[0]?.ownerEmail || "one owner"
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-extrabold tracking-tight">Companies</h1>
        <p className="text-muted-foreground mt-1">
          Verify the companies recruiters and employers create
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Verification queue</CardTitle>
              <CardDescription>
                Verifying shows a badge on the company. It does not block job posting.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name, website or email"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 w-60"
                />
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as "createdAt" | "name")}>
                <SelectTrigger className="w-40" aria-label="Sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Newest first</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
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
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                    {counts && <span className="ml-1 text-muted-foreground">({counts[t.value]})</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {ownerId && (
              <Button variant="outline" size="sm" onClick={clearOwner}>
                Owner: {ownerLabel}
                <X className="h-4 w-4 ml-1" />
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
                      <TableHead>Company</TableHead>
                      <TableHead>Ref</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Jobs</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          {tab === "pending" && !search ? "Nothing waiting for review" : "No companies found"}
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((c: CompanyListRow) => (
                      <TableRow key={c._id} className="cursor-pointer" onClick={() => setOpenId(c._id)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Logo src={c.logo} name={c.name} />
                            <div>
                              <div className="font-medium">{c.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {[c.industry, c.website].filter(Boolean).join(" · ") || "—"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ReferencePill code={c.referenceCode} />
                        </TableCell>
                        <TableCell>
                          <OwnerCell
                            id={c.ownerId}
                            name={c.ownerName}
                            email={c.ownerEmail}
                            role={c.ownerRole}
                          />
                        </TableCell>
                        <TableCell className="text-sm">{c.location?.city || "—"}</TableCell>
                        <TableCell className="text-right">{c.jobCount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(c.createdAt)}
                        </TableCell>
                        <TableCell>
                          <CompanyVerificationBadge value={c.verified} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenId(c._id);
                            }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {result && result.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 text-sm">
                  <span className="text-muted-foreground">
                    Page {result.pagination.page} of {result.pagination.totalPages} ·{" "}
                    {result.pagination.total} companies
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page <= 1 || loading}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= result.pagination.totalPages || loading}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review drawer */}
      <Sheet open={!!openId} onOpenChange={(o) => !o && !saving && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detailError ? (
            <Alert variant="destructive" className="mt-8">
              <AlertDescription>{detailError}</AlertDescription>
            </Alert>
          ) : !detail ? (
            <div className="space-y-4 mt-8">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Logo src={detail.logo} name={detail.name} size="h-12 w-12" />
                  <div className="text-left">
                    <SheetTitle>{detail.name}</SheetTitle>
                    <SheetDescription>
                      Created {fmtDate(detail.createdAt)} · {detail.jobCount} job
                      {detail.jobCount === 1 ? "" : "s"}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex items-center gap-2">
                <CompanyVerificationBadge value={detail.verified} />
                {detail.verifiedAt && (
                  <span className="text-xs text-muted-foreground">
                    {fmtDateTime(detail.verifiedAt)}
                    {detail.verifiedBy && ` by ${personName(detail.verifiedBy)}`}
                  </span>
                )}
              </div>
              {detail.verificationNotes && (
                <p className="text-sm rounded border bg-muted/40 p-3 whitespace-pre-line">
                  {detail.verificationNotes}
                </p>
              )}

              <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground pt-1.5">Reference number</dt>
                <dd className="col-span-2">
                  <CompanyReferenceField
                    companyId={detail._id}
                    value={detail.referenceCode}
                    onSaved={(code) => {
                      setDetail((d) => (d ? { ...d, referenceCode: code } : d));
                      setResult((r) =>
                        r
                          ? {
                              ...r,
                              data: r.data.map((row) =>
                                row._id === detail._id ? { ...row, referenceCode: code } : row
                              ),
                            }
                          : r
                      );
                    }}
                  />
                </dd>
                <dt className="text-muted-foreground">Website</dt>
                <dd className="col-span-2 break-all">
                  {detail.website ? (
                    <a
                      href={websiteHref(detail.website)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {detail.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="col-span-2">{detail.phone || "—"}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="col-span-2 break-all">{detail.email || "—"}</dd>
                <dt className="text-muted-foreground">Industry</dt>
                <dd className="col-span-2">{detail.industry || "—"}</dd>
                <dt className="text-muted-foreground">Size</dt>
                <dd className="col-span-2 capitalize">{detail.size || "—"}</dd>
                <dt className="text-muted-foreground">Location</dt>
                <dd className="col-span-2">
                  {detail.location?.formattedAddress || detail.location?.city || "—"}
                  {detail.location?.placeId && (
                    <div>
                      <a
                        href={`https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(
                          detail.location.placeId
                        )}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Open in Google Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </dd>
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="col-span-2">
                  {detail.ownerId ? (
                    <OwnerCell
                      id={detail.ownerId._id}
                      name={personName(detail.ownerId) !== detail.ownerId.email ? personName(detail.ownerId) : undefined}
                      email={detail.ownerId.email}
                      role={detail.ownerId.role}
                    />
                  ) : (
                    "—"
                  )}
                </dd>
              </dl>
              {detail.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {detail.description}
                </p>
              )}

              <SummaryList
                title="Possible duplicates"
                rows={detail.possibleDuplicates}
                empty="None with the same Google place or name"
              />
              <SummaryList
                title="Owner's other companies"
                rows={detail.ownerOtherCompanies}
                empty="None"
              />

              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="verification-notes">Notes</Label>
                <Textarea
                  id="verification-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Why approve or reject? Required to reject."
                />
                <p className="text-xs text-muted-foreground">
                  Saved with the decision and recorded in the activity log. Rejecting needs at least{" "}
                  {MIN_REASON} characters.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    onClick={() => decide("verified")}
                    disabled={!!saving || detail.verified === "verified"}
                  >
                    {saving === "verified" ? "Saving…" : "Approve"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => decide("rejected")}
                    disabled={!!saving || notesTooShort || detail.verified === "rejected"}
                  >
                    {saving === "rejected" ? "Saving…" : "Reject"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => decide("pending")}
                    disabled={!!saving || detail.verified === "pending"}
                  >
                    {saving === "pending" ? "Saving…" : "Reset to pending"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CompaniesPage;
