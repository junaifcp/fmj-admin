// src/pages/admin/management/BusinessData.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  StopCircle,
} from "lucide-react";
import { CreateScrapingModal } from "@/components/admin/business-data/CreateScrapingModal";
import { ScrapingStatusBanner } from "@/components/admin/business-data/ScrapingStatusBanner";
import { BusinessDataFilters } from "@/components/admin/business-data/BusinessDataFilters";
import { BusinessDataTable } from "@/components/admin/business-data/BusinessDataTable";
import { useJobPolling } from "@/hooks/useJobPolling";
import {
  getFilterOptions,
  getScrapedData,
  listJobs,
  cancelJob,
  exportToExcel,
} from "@/api/businessData";
import {
  FilterOptions,
  Filters,
  BusinessData,
  JobStatus,
} from "@/types/businessData";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const BusinessDataPage: React.FC = () => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null
  );
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [forceStopping, setForceStopping] = useState(false);

  // Poll active job status
  const { job: activeJob, isLoading: pollingLoading } = useJobPolling(
    activeJobId,
    {
      enabled: !!activeJobId,
      interval: 5000, // Poll every 5 seconds
      onStatusChange: (status) => {
        if (
          status === "completed" ||
          status === "failed" ||
          status === "cancelled"
        ) {
          // Refresh data and filter options
          fetchBusinesses();
          fetchFilterOptions();
          setActiveJobId(null);
          setIsScrapingActive(false);
        }
      },
    }
  );

  // Check for running jobs on mount and when tab becomes visible
  useEffect(() => {
    const initializeActiveJob = async () => {
      try {
        // Check for both running and pending jobs
        const runningJobsResponse = await listJobs({
          page: 1,
          limit: 1,
          status: "running",
        });
        // Handle response format: {data: [...], meta: {...}} or {jobs: [...], pagination: {...}}
        const runningJobs =
          runningJobsResponse?.data || runningJobsResponse?.jobs || [];
        if (Array.isArray(runningJobs) && runningJobs.length > 0) {
          const jobId = runningJobs[0]?.jobId;
          if (jobId) {
            setActiveJobId(jobId);
            setIsScrapingActive(true);
            console.log("[BusinessData] Found running job on mount:", jobId);
            return;
          }
        }

        // Also check for pending jobs
        const pendingJobsResponse = await listJobs({
          page: 1,
          limit: 1,
          status: "pending",
        });
        // Handle response format: {data: [...], meta: {...}} or {jobs: [...], pagination: {...}}
        const pendingJobs =
          pendingJobsResponse?.data || pendingJobsResponse?.jobs || [];
        if (Array.isArray(pendingJobs) && pendingJobs.length > 0) {
          const jobId = pendingJobs[0]?.jobId;
          if (jobId) {
            setActiveJobId(jobId);
            setIsScrapingActive(true);
            console.log("[BusinessData] Found pending job on mount:", jobId);
          }
        }
      } catch (error) {
        console.error("Failed to check running jobs:", error);
      }
    };

    initializeActiveJob();

    // Also check when tab becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        initializeActiveJob();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // Only run on mount

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      setFilterOptionsLoading(true);
      const options = await getFilterOptions();
      setFilterOptions(options);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load filter options");
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  // Check for running jobs
  const checkRunningJobs = useCallback(async () => {
    try {
      // Check for both running and pending jobs
      const runningJobsResponse = await listJobs({
        page: 1,
        limit: 1,
        status: "running",
      });
      // Handle response format: {data: [...], meta: {...}} or {jobs: [...], pagination: {...}}
      const runningJobs =
        runningJobsResponse?.data || runningJobsResponse?.jobs || [];
      if (Array.isArray(runningJobs) && runningJobs.length > 0) {
        const jobId = runningJobs[0]?.jobId;
        if (jobId) {
          setActiveJobId(jobId);
          setIsScrapingActive(true);
          return;
        }
      }

      // Also check for pending jobs
      const pendingJobsResponse = await listJobs({
        page: 1,
        limit: 1,
        status: "pending",
      });
      // Handle response format: {data: [...], meta: {...}} or {jobs: [...], pagination: {...}}
      const pendingJobs =
        pendingJobsResponse?.data || pendingJobsResponse?.jobs || [];
      if (Array.isArray(pendingJobs) && pendingJobs.length > 0) {
        const jobId = pendingJobs[0]?.jobId;
        if (jobId) {
          setActiveJobId(jobId);
          setIsScrapingActive(true);
        }
      }
    } catch (error) {
      console.error("Failed to check running jobs:", error);
    }
  }, []);

  // Fetch businesses data
  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getScrapedData(null, {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      setBusinesses(response.businesses);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch businesses");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Load filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Fetch businesses when filters or pagination changes
  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  // Handle create scraping success
  const handleScrapingSuccess = useCallback(
    (jobId: string) => {
      // Set the active job ID to start polling
      setActiveJobId(jobId);
      setIsScrapingActive(true);
      // Refresh filter options (new keyword/locations may be available)
      fetchFilterOptions();
    },
    [fetchFilterOptions]
  );

  // Handle cancel job
  const handleCancelJob = useCallback(async () => {
    if (!activeJobId) return;

    try {
      await cancelJob(activeJobId);
      toast.success("Scraping job cancelled");
      setActiveJobId(null);
      setIsScrapingActive(false);
      fetchBusinesses();
      fetchFilterOptions();
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel job");
    }
  }, [activeJobId, fetchBusinesses, fetchFilterOptions]);

  // Handle force stop scraping - checks for any running job and stops it
  const handleForceStop = useCallback(async () => {
    try {
      setForceStopping(true);

      // Check for running jobs
      let runningJobs;
      try {
        runningJobs = await listJobs({
          page: 1,
          limit: 1,
          status: "running",
        });
      } catch (err) {
        console.error("Error fetching running jobs:", err);
        runningJobs = null;
      }

      // Handle response format: {data: [...], meta: {...}} or {jobs: [...], pagination: {...}}
      const runningJobsArray = runningJobs?.data || runningJobs?.jobs || [];

      if (Array.isArray(runningJobsArray) && runningJobsArray.length > 0) {
        const jobId = runningJobsArray[0]?.jobId;
        if (jobId) {
          await cancelJob(jobId);
          toast.success("Scraping job force stopped");
          setActiveJobId(null);
          setIsScrapingActive(false);
          fetchBusinesses();
          fetchFilterOptions();
          return;
        }
      }

      // Check for pending jobs
      let pendingJobs;
      try {
        pendingJobs = await listJobs({
          page: 1,
          limit: 1,
          status: "pending",
        });
      } catch (err) {
        console.error("Error fetching pending jobs:", err);
        pendingJobs = null;
      }

      // Handle response format: {data: [...], meta: {...}} or {jobs: [...], pagination: {...}}
      const pendingJobsArray = pendingJobs?.data || pendingJobs?.jobs || [];

      if (Array.isArray(pendingJobsArray) && pendingJobsArray.length > 0) {
        const jobId = pendingJobsArray[0]?.jobId;
        if (jobId) {
          await cancelJob(jobId);
          toast.success("Pending scraping job cancelled");
          setActiveJobId(null);
          setIsScrapingActive(false);
          fetchBusinesses();
          fetchFilterOptions();
          return;
        }
      }

      toast.info("No running or pending scraping jobs found");
    } catch (error: any) {
      console.error("Force stop error:", error);
      toast.error(error?.message || "Failed to force stop scraping");
    } finally {
      setForceStopping(false);
    }
  }, [fetchBusinesses, fetchFilterOptions]);

  // Handle export to Excel
  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const blob = await exportToExcel(null, filters);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `business-data-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Excel file downloaded successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to export data");
    } finally {
      setExporting(false);
    }
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Data</h1>
          <p className="text-muted-foreground mt-1">
            Scrape and manage business data from Google My Business
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleForceStop}
            disabled={forceStopping}
            variant="destructive"
          >
            <StopCircle className="h-4 w-4 mr-2" />
            {forceStopping ? "Stopping..." : "Force Stop Scraping"}
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || loading || businesses.length === 0}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export Excel"}
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            disabled={isScrapingActive}
          >
            <Plus className="h-4 w-4 mr-2" /> 
            Create Scraping
          </Button>
        </div>
      </div>

      {/* Active Scraping Banner */}
      {activeJob && (
        <ScrapingStatusBanner
          job={activeJob}
          onCancel={
            activeJob.status === "running" ? handleCancelJob : undefined
          }
          onDismiss={() => {
            setActiveJobId(null);
            setIsScrapingActive(false);
          }}
        />
      )}

      {/* Filters */}
      {filterOptionsLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filterOptions ? (
        <BusinessDataFilters
          filterOptions={filterOptions}
          filters={filters}
          onFilterChange={handleFilterChange}
          loading={loading}
        />
      ) : null}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scraped Businesses</CardTitle>
          <CardDescription>
            {pagination.total > 0
              ? `Showing ${
                  (pagination.page - 1) * pagination.limit + 1
                } to ${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} of ${pagination.total} businesses`
              : "No businesses found"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessDataTable data={businesses} loading={loading} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Scraping Modal */}
      <CreateScrapingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleScrapingSuccess}
        isScrapingActive={isScrapingActive}
      />
    </div>
  );
};

export default BusinessDataPage;
