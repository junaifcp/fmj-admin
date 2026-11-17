// src/pages/admin/RecruitersPage.tsx
// Recruiter admin 5.2: recruiters list with filters. Row click opens the
// Recruiter Detail page, where every recruiter action happens.
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exportRecruitersCSV } from "@/api/admin";
import { recruiterAdminApi } from "@/api/recruiterAdmin";
import type { Paged, RecruiterListFilters, RecruiterListRow } from "@/types/recruiterAdmin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  CompanyVerificationBadge,
  RecruiterStatusBadge,
} from "@/components/admin/recruiters/RecruiterBits";
import { fmtDate, personName } from "@/components/admin/recruiters/recruiterFormat";
import { PATHS } from "@/routes/paths";
import { HiringAccountActions } from "@/components/admin/hiring/HiringAccountActions";

const PAGE_SIZE = 20;
const ALL = "all";

type FilterKey = "status" | "onboarded" | "companyVerified" | "lastActiveWithin";

const FILTER_SELECTS: {
  key: FilterKey;
  placeholder: string;
  options: { value: string; label: string }[];
}[] = [
  {
    key: "status",
    placeholder: "Status",
    options: [
      { value: "active", label: "Active" },
      { value: "suspended", label: "Deactivated" },
      { value: "deleted", label: "Deleted" },
    ],
  },
  {
    key: "onboarded",
    placeholder: "Onboarding",
    options: [
      { value: "true", label: "Onboarded" },
      { value: "false", label: "Not onboarded" },
    ],
  },
  {
    key: "companyVerified",
    placeholder: "Company",
    options: [
      { value: "pending", label: "Company pending" },
      { value: "verified", label: "Company verified" },
      { value: "rejected", label: "Company rejected" },
    ],
  },
  {
    key: "lastActiveWithin",
    placeholder: "Last active",
    options: [
      { value: "7", label: "Active in 7 days" },
      { value: "30", label: "Active in 30 days" },
      { value: "90", label: "Active in 90 days" },
    ],
  },
];

const SORTS: { value: string; label: string }[] = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "lastActive:desc", label: "Recently active" },
  { value: "applications:desc", label: "Most applications" },
  { value: "jobs:desc", label: "Most jobs" },
  { value: "hires:desc", label: "Most hires" },
];

const RecruitersPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [result, setResult] = useState<Paged<RecruiterListRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [sort, setSort] = useState(SORTS[0].value);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: RecruiterListFilters = useMemo(() => {
    const [sortBy, sortOrder] = sort.split(":") as [
      RecruiterListFilters["sortBy"],
      RecruiterListFilters["sortOrder"],
    ];
    return {
      search: search || undefined,
      ...(filters as RecruiterListFilters),
      joinedFrom: joinedFrom ? new Date(`${joinedFrom}T00:00:00`).toISOString() : undefined,
      joinedTo: joinedTo ? new Date(`${joinedTo}T23:59:59.999`).toISOString() : undefined,
      sortBy,
      sortOrder,
    };
  }, [search, filters, joinedFrom, joinedTo, sort]);

  // Any filter change goes back to page 1.
  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await recruiterAdminApi.list(page, PAGE_SIZE, query, {
          signal: ctrl.signal,
        });
        setResult(data);
        setSelected([]);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load recruiters");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [page, query, reloadKey]);

  const rows = result?.data ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r._id));
  const hasFilters =
    !!search || Object.values(filters).some(Boolean) || !!joinedFrom || !!joinedTo;

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setFilters({});
    setJoinedFrom("");
    setJoinedTo("");
  };

  const handleExport = async () => {
    try {
      await exportRecruitersCSV(selected);
      toast({ title: "Export started", description: "Your CSV file will download shortly" });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const openRow = (id: string) => navigate(`${PATHS.ADMIN.RECRUITERS_ADMIN.LIST}/${id}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-sans font-extrabold tracking-tight">Recruiters</h1>
        <p className="text-muted-foreground mt-1">Recruiter accounts on FitMyJob</p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Recruiters</CardTitle>
              <CardDescription>
                {result ? `${result.pagination.total} recruiters` : "Loading recruiters..."}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-44" aria-label="Sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setReloadKey((n) => n + 1)}
                size="sm"
                variant="outline"
                disabled={loading}
                aria-label="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                onClick={handleExport}
                size="sm"
                variant="outline"
                disabled={selected.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export ({selected.length})
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Name, email or company"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            {FILTER_SELECTS.map((f) => (
              <Select
                key={f.key}
                value={filters[f.key] ?? ALL}
                onValueChange={(v) =>
                  setFilters((prev) => ({ ...prev, [f.key]: v === ALL ? undefined : v }))
                }
              >
                <SelectTrigger className="w-44" aria-label={f.placeholder}>
                  <SelectValue placeholder={f.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{`${f.placeholder}: all`}</SelectItem>
                  {f.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Joined
              <input
                type="date"
                aria-label="Joined from"
                value={joinedFrom}
                onChange={(e) => setJoinedFrom(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              />
              to
              <input
                type="date"
                aria-label="Joined to"
                value={joinedTo}
                onChange={(e) => setJoinedTo(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
              />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
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
            <div className="space-y-4">
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
                      <TableHead className="w-12">
                        <Checkbox
                          aria-label="Select all"
                          checked={allSelected}
                          disabled={rows.length === 0}
                          onCheckedChange={(c) => setSelected(c ? rows.map((r) => r._id) : [])}
                        />
                      </TableHead>
                      <TableHead>Recruiter</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Jobs</TableHead>
                      <TableHead className="text-right">Applications</TableHead>
                      <TableHead className="text-right">Hires</TableHead>
                      <TableHead>Last active</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-16 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                          {hasFilters ? "No recruiters match these filters" : "No recruiters yet"}
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((r) => (
                      <TableRow
                        key={r._id}
                        className="cursor-pointer"
                        onClick={() => openRow(r._id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            aria-label={`Select ${r.email}`}
                            checked={selected.includes(r._id)}
                            onCheckedChange={(c) =>
                              setSelected((prev) =>
                                c ? [...prev, r._id] : prev.filter((id) => id !== r._id)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{personName(r)}</div>
                          <div className="text-xs text-muted-foreground">{r.email}</div>
                          {!r.basicInfoProvided && (
                            <div className="text-xs text-amber-700">Not onboarded</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{r.company || "—"}</div>
                          <CompanyVerificationBadge value={r.companyVerified} />
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {r.stats.activeJobs}/{r.stats.totalJobs}
                          <div className="text-xs text-muted-foreground">active/total</div>
                        </TableCell>
                        <TableCell className="text-right">{r.stats.totalApplications}</TableCell>
                        <TableCell className="text-right">{r.stats.hires}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(r.lastActive)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(r.createdAt)}
                        </TableCell>
                        <TableCell>
                          <RecruiterStatusBadge isActive={r.isActive} deletedAt={r.deletedAt} />
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <HiringAccountActions
                            kind="recruiter"
                            id={r._id}
                            email={r.email}
                            isActive={r.isActive}
                            deletedAt={r.deletedAt}
                            onDone={() => setReloadKey((n) => n + 1)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {result && result.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(result.pagination.page - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(result.pagination.page * PAGE_SIZE, result.pagination.total)} of{" "}
                    {result.pagination.total}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page <= 1 || loading}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Page {result.pagination.page} of {result.pagination.totalPages}
                    </div>
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
    </div>
  );
};

export default RecruitersPage;
