// src/pages/admin/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { getDashboardTotals, getDashboardFilteredMetrics } from "@/api/admin";
import {
  DashboardTotals,
  DashboardFiltered,
  DateFilterPreset,
  DateRange,
} from "@/types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  getDateRangeFromPreset,
  formatDateRangeForDisplay,
  getFilterPresetOptions,
} from "@/utils/dateFilters";
import {
  Users,
  Briefcase,
  Building2,
  FileText,
  FileCheck,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  Calendar,
} from "lucide-react";

const Dashboard: React.FC = () => {
  // State for totals (fetched once)
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [loadingTotals, setLoadingTotals] = useState(true);

  // State for filtered metrics (fetched on filter change)
  const [filteredMetrics, setFilteredMetrics] =
    useState<DashboardFiltered | null>(null);
  const [loadingFiltered, setLoadingFiltered] = useState(false);

  // Filter state
  const [filterPreset, setFilterPreset] =
    useState<DateFilterPreset>("yesterday");
  const [dateRange, setDateRange] = useState<DateRange>(
    getDateRangeFromPreset("yesterday")
  );
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch totals on mount (only once)
  useEffect(() => {
    const fetchTotals = async () => {
      try {
        setLoadingTotals(true);
        setError(null);
        const data = await getDashboardTotals();
        setTotals(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard totals"
        );
      } finally {
        setLoadingTotals(false);
      }
    };

    fetchTotals();
  }, []);

  // Fetch filtered metrics when date range changes
  useEffect(() => {
    const fetchFiltered = async () => {
      try {
        setLoadingFiltered(true);
        const data = await getDashboardFilteredMetrics(
          dateRange.from,
          dateRange.to
        );
        setFilteredMetrics(data);
      } catch (err) {
        console.error("Failed to load filtered metrics:", err);
        // Don't set global error for filter failures, just log
      } finally {
        setLoadingFiltered(false);
      }
    };

    // Only fetch if we have totals loaded
    if (totals) {
      fetchFiltered();
    }
  }, [dateRange, totals]);

  // Handle preset filter change
  const handlePresetChange = (preset: DateFilterPreset) => {
    setFilterPreset(preset);
    if (preset === "custom") {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      setDateRange(getDateRangeFromPreset(preset));
    }
  };

  // Handle custom date change
  const handleCustomDateChange = (field: "from" | "to", value: string) => {
    const date = new Date(value);
    if (field === "to") {
      date.setHours(23, 59, 59, 999);
    }
    setDateRange((prev) => ({
      ...prev,
      [field]: date.toISOString(),
    }));
  };

  // Refresh all data
  const handleRefresh = async () => {
    try {
      setLoadingTotals(true);
      setLoadingFiltered(true);
      setError(null);
      const [totalsData, filteredData] = await Promise.all([
        getDashboardTotals(),
        getDashboardFilteredMetrics(dateRange.from, dateRange.to),
      ]);
      setTotals(totalsData);
      setFilteredMetrics(filteredData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh dashboard data"
      );
    } finally {
      setLoadingTotals(false);
      setLoadingFiltered(false);
    }
  };

  if (error && !totals) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const filterOptions = getFilterPresetOptions();

  // Get current filter label for display in cards
  const currentFilterLabel =
    filterPreset === "custom"
      ? formatDateRangeForDisplay(dateRange.from, dateRange.to)
      : filterOptions.find((opt) => opt.value === filterPreset)?.label ||
        "Yesterday";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform metrics and user activity
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {/* Filter Preset Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filterPreset}
              onValueChange={(value) =>
                handlePresetChange(value as DateFilterPreset)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select filter" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range Picker */}
          {showCustomDatePicker && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={new Date(dateRange.from).toISOString().split("T")[0]}
                onChange={(e) => handleCustomDateChange("from", e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="date"
                value={new Date(dateRange.to).toISOString().split("T")[0]}
                onChange={(e) => handleCustomDateChange("to", e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background"
              />
            </div>
          )}

          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            disabled={loadingTotals || loadingFiltered}
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loadingTotals || loadingFiltered ? "animate-spin" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Date Range Display */}
      {!showCustomDatePicker && filterPreset !== "today" && (
        <div className="text-sm text-muted-foreground">
          Showing data from:{" "}
          <span className="font-medium">
            {formatDateRangeForDisplay(dateRange.from, dateRange.to)}
          </span>
        </div>
      )}

      {/* Metric Cards - Row 1: Candidates, Recruiters, Employers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Candidates"
          icon={<Users className="h-5 w-5" />}
          total={totals?.totalCandidates || 0}
          newCount={filteredMetrics?.newCandidates || 0}
          isLoading={loadingTotals}
          isFiltering={!!filteredMetrics && !loadingFiltered}
          iconColor="text-blue-600"
          filterLabel={currentFilterLabel}
        />
        <MetricCard
          title="Recruiters"
          icon={<Briefcase className="h-5 w-5" />}
          total={totals?.totalRecruiters || 0}
          newCount={filteredMetrics?.newRecruiters || 0}
          isLoading={loadingTotals}
          isFiltering={!!filteredMetrics && !loadingFiltered}
          iconColor="text-purple-600"
          filterLabel={currentFilterLabel}
        />
        <MetricCard
          title="Employers"
          icon={<Building2 className="h-5 w-5" />}
          total={totals?.totalEmployers || 0}
          newCount={filteredMetrics?.newEmployers || 0}
          isLoading={loadingTotals}
          isFiltering={!!filteredMetrics && !loadingFiltered}
          iconColor="text-green-600"
          filterLabel={currentFilterLabel}
        />
      </div>

      {/* Metric Cards - Row 2: Jobs, Resumes, Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Jobs Posted"
          icon={<FileText className="h-5 w-5" />}
          total={totals?.totalJobs || 0}
          newCount={filteredMetrics?.newJobs || 0}
          isLoading={loadingTotals}
          isFiltering={!!filteredMetrics && !loadingFiltered}
          iconColor="text-orange-600"
          filterLabel={currentFilterLabel}
        />
        <MetricCard
          title="Resumes Created"
          icon={<FileCheck className="h-5 w-5" />}
          total={totals?.totalResumes || 0}
          newCount={filteredMetrics?.newResumes || 0}
          isLoading={loadingTotals}
          isFiltering={!!filteredMetrics && !loadingFiltered}
          iconColor="text-cyan-600"
          filterLabel={currentFilterLabel}
        />
        <MetricCard
          title="Total Revenue"
          icon={<DollarSign className="h-5 w-5" />}
          total={totals?.totalRevenue || 0}
          newCount={filteredMetrics?.newRevenue || 0}
          isLoading={loadingTotals}
          isFiltering={!!filteredMetrics && !loadingFiltered}
          isRevenue={true}
          iconColor="text-emerald-600"
          filterLabel={currentFilterLabel}
        />
      </div>

      {/* Note about Employers */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-amber-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Employer Metrics Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-800">
            The Employer role is not yet implemented. Employer metrics will show
            actual data once the employer functionality is added to the
            platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
