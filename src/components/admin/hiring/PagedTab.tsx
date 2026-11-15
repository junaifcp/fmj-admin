// Employer admin 6.2: one paged tab (loads its endpoint when opened; prev/next).
// Same behaviour as the tab helper on Recruiter Detail.
import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Paged } from "@/types/recruiterAdmin";

export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-muted-foreground py-8 text-center">{children}</p>
);

export function PagedTab<T>({
  load,
  render,
  empty,
  reloadKey = 0,
}: {
  load: (page: number, opts: { signal: AbortSignal }) => Promise<Paged<T>>;
  render: (rows: T[]) => React.ReactNode;
  empty: string;
  reloadKey?: number;
}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    load(page, { signal: ctrl.signal })
      .then((d) => setData(d))
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [load, page, reloadKey]);

  if (error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (loading && !data) return <Skeleton className="h-40 w-full" />;
  if (!data || data.data.length === 0) return <Empty>{empty}</Empty>;
  const { pagination } = data;
  return (
    <div className={loading ? "opacity-60" : undefined}>
      <div className="overflow-x-auto">{render(data.data)}</div>
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4 text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          Page {pagination.page} of {pagination.totalPages}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
