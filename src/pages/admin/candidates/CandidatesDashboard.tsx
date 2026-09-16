// src/pages/admin/candidates/CandidatesDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  Users,
  FileText,
  Briefcase,
  Activity,
  Award,
  Mail,
  Target,
  RefreshCw,
  AlertTriangle,
  Calendar,
  UserCheck,
  UserX,
  Bookmark,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { candidateMetricsApi } from "@/api/candidateMetrics";
import type {
  CandidateOverviewMetrics,
  ApplicationMetrics,
  AtsMetrics,
  ActivityTrends,
  TemplateMetrics,
} from "@/types/candidateMetrics";
import { DateFilterPreset, DateRange } from "@/types/admin";
import {
  getDateRangeFromPreset,
  formatDateRangeForDisplay,
  getFilterPresetOptions,
} from "@/utils/dateFilters";

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.purple,
  COLORS.cyan,
];

const CandidatesDashboard: React.FC = () => {
  // State for metrics
  const [overview, setOverview] = useState<CandidateOverviewMetrics | null>(
    null
  );
  const [applications, setApplications] = useState<ApplicationMetrics | null>(
    null
  );
  const [ats, setAts] = useState<AtsMetrics | null>(null);
  const [trends, setTrends] = useState<ActivityTrends | null>(null);
  const [templates, setTemplates] = useState<TemplateMetrics[]>([]);

  // Loading states
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadingAts, setLoadingAts] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Filter state
  const [filterPreset, setFilterPreset] =
    useState<DateFilterPreset>("yesterday");
  const [dateRange, setDateRange] = useState<DateRange>(
    getDateRangeFromPreset("yesterday")
  );
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [trendDays, setTrendDays] = useState(30);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch overview metrics
  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const data = await candidateMetricsApi.getOverview(
        dateRange.from,
        dateRange.to
      );
      setOverview(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch overview:", err);
      setError("Failed to load overview metrics");
    } finally {
      setLoadingOverview(false);
    }
  };

  // Fetch application metrics
  const fetchApplications = async () => {
    try {
      setLoadingApplications(true);
      const data = await candidateMetricsApi.getApplicationMetrics();
      setApplications(data);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoadingApplications(false);
    }
  };

  // Fetch ATS metrics
  const fetchAts = async () => {
    try {
      setLoadingAts(true);
      const data = await candidateMetricsApi.getAtsMetrics();
      setAts(data);
    } catch (err) {
      console.error("Failed to fetch ATS metrics:", err);
    } finally {
      setLoadingAts(false);
    }
  };

  // Fetch activity trends
  const fetchTrends = async () => {
    try {
      setLoadingTrends(true);
      const data = await candidateMetricsApi.getActivityTrends(trendDays);
      setTrends(data);
    } catch (err) {
      console.error("Failed to fetch trends:", err);
    } finally {
      setLoadingTrends(false);
    }
  };

  // Fetch top templates
  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const data = await candidateMetricsApi.getTopTemplates();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Initial load
  useEffect(() => {
    Promise.all([
      fetchOverview(),
      fetchApplications(),
      fetchAts(),
      fetchTrends(),
      fetchTemplates(),
    ]);
  }, []);

  // Reload overview when date range changes
  useEffect(() => {
    fetchOverview();
  }, [dateRange]);

  // Reload trends when trend days changes
  useEffect(() => {
    fetchTrends();
  }, [trendDays]);

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
  const handleRefresh = () => {
    Promise.all([
      fetchOverview(),
      fetchApplications(),
      fetchAts(),
      fetchTrends(),
      fetchTemplates(),
    ]);
  };

  const filterOptions = getFilterPresetOptions();
  const currentFilterLabel =
    filterPreset === "custom"
      ? formatDateRangeForDisplay(dateRange.from, dateRange.to)
      : filterOptions.find((opt) => opt.value === filterPreset)?.label ||
        "Yesterday";

  // Filtering is always active since we always have a date range (default is "yesterday")
  // Only show filter data for metrics that support it (have newCount for the date range)
  const isFiltering = true;

  if (error && !overview) {
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">
            Candidate Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analytics for candidate activity and engagement
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
            disabled={loadingOverview}
          >
            <RefreshCw
              className={`h-4 w-4 ${loadingOverview ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Date Range Display */}
      {!showCustomDatePicker && filterPreset !== "today" && (
        <div className="text-sm text-muted-foreground">
          Showing data from:{" "}
          <span className="font-medium">{currentFilterLabel}</span>
        </div>
      )}

      {/* User Engagement Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">User Engagement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Candidates"
            icon={<Users className="h-5 w-5" />}
            total={overview?.totalCandidates || 0}
            newCount={overview?.newCandidates || 0}
            isLoading={loadingOverview}
            isFiltering={isFiltering}
            iconColor="text-blue-600"
            filterLabel={currentFilterLabel}
          />
          <MetricCard
            title="Profile Completed (>90%)"
            icon={<UserCheck className="h-5 w-5" />}
            total={overview?.totalProfileCompleted || 0}
            newCount={overview?.newProfileCompleted || 0}
            isLoading={loadingOverview}
            isFiltering={isFiltering}
            iconColor="text-emerald-600"
            filterLabel={currentFilterLabel}
          />
          <MetricCard
            title="Saved Jobs"
            icon={<Bookmark className="h-5 w-5" />}
            total={overview?.totalSavedJobs || 0}
            newCount={overview?.newSavedJobs || 0}
            isLoading={loadingOverview}
            isFiltering={isFiltering}
            iconColor="text-teal-600"
            filterLabel={currentFilterLabel}
          />
        </div>
      </div>

      {/* User Activity Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">User Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Daily Active Users"
            icon={<UserCheck className="h-5 w-5" />}
            total={overview?.dailyActive || 0}
            newCount={0}
            isLoading={loadingOverview}
            isFiltering={false}
            iconColor="text-green-600"
            filterLabel={currentFilterLabel}
          />
          <MetricCard
            title="Weekly Active Users"
            icon={<Activity className="h-5 w-5" />}
            total={overview?.weeklyActive || 0}
            newCount={0}
            isLoading={loadingOverview}
            isFiltering={false}
            iconColor="text-blue-600"
            filterLabel={currentFilterLabel}
          />
          <MetricCard
            title="Monthly Active Users"
            icon={<Activity className="h-5 w-5" />}
            total={overview?.monthlyActive || 0}
            newCount={0}
            isLoading={loadingOverview}
            isFiltering={false}
            iconColor="text-purple-600"
            filterLabel={currentFilterLabel}
          />
          <MetricCard
            title="Inactive Users"
            icon={<UserX className="h-5 w-5" />}
            total={overview?.inactiveUsers || 0}
            newCount={0}
            isLoading={loadingOverview}
            isFiltering={false}
            iconColor="text-orange-600"
            filterLabel={currentFilterLabel}
          />
        </div>
      </div>

      {/* Content Creation Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Content & Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Resumes"
            icon={<FileText className="h-5 w-5" />}
            total={overview?.totalResumes || 0}
            newCount={overview?.newResumes || 0}
            isLoading={loadingOverview}
            isFiltering={isFiltering}
            iconColor="text-cyan-600"
            filterLabel={currentFilterLabel}
          />
          <MetricCard
            title="Total Applications"
            icon={<Briefcase className="h-5 w-5" />}
            total={overview?.totalApplications || 0}
            newCount={overview?.newApplications || 0}
            isLoading={loadingOverview}
            isFiltering={isFiltering}
            iconColor="text-indigo-600"
            filterLabel={currentFilterLabel}
          />
          <MetricCard
            title="Cover Letters"
            icon={<Mail className="h-5 w-5" />}
            total={overview?.totalCoverLetters || 0}
            newCount={overview?.newCoverLetters || 0}
            isLoading={loadingOverview}
            isFiltering={isFiltering}
            iconColor="text-pink-600"
            filterLabel={currentFilterLabel}
          />
          <MetricCard
            title="ATS Analyses"
            icon={<Award className="h-5 w-5" />}
            total={overview?.totalAtsResults || 0}
            newCount={overview?.newAtsResults || 0}
            isLoading={loadingOverview}
            isFiltering={isFiltering}
            iconColor="text-yellow-600"
            filterLabel={currentFilterLabel}
          />
          <MetricCard
            title="Failed ATS Analyses"
            icon={<XCircle className="h-5 w-5" />}
            total={overview?.totalFailedAtsAnalyses || 0}
            newCount={overview?.newFailedAtsAnalyses || 0}
            isLoading={loadingOverview}
            isFiltering={isFiltering}
            iconColor="text-red-600"
            filterLabel={currentFilterLabel}
          />
        </div>
      </div>

      {/* Subscription Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Subscription Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Active Subscriptions"
            icon={<Target className="h-5 w-5" />}
            total={overview?.activeSubscriptions || 0}
            newCount={overview?.newSubscriptions || 0}
            isLoading={loadingOverview}
            isFiltering={isFiltering}
            iconColor="text-emerald-600"
            filterLabel={currentFilterLabel}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trends Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activity Trends</CardTitle>
              <CardDescription>
                Daily signups, resume creation, applications, and ATS checks
                over time
              </CardDescription>
            </div>
            <Select
              value={trendDays.toString()}
              onValueChange={(value) => setTrendDays(parseInt(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={
                    trends?.signupTrend && trends.signupTrend.length > 0
                      ? trends.signupTrend.map((signup, index) => {
                          // Backend ensures all trends have same dates in same order, so we can use index
                          // But use date matching as fallback for safety
                          const resumeCount =
                            trends.resumeTrend?.[index]?.date === signup.date
                              ? trends.resumeTrend[index].count
                              : trends.resumeTrend?.find(
                                  (r) => r.date === signup.date
                                )?.count || 0;
                          const applicationCount =
                            trends.applicationTrend?.[index]?.date ===
                            signup.date
                              ? trends.applicationTrend[index].count
                              : trends.applicationTrend?.find(
                                  (a) => a.date === signup.date
                                )?.count || 0;
                          const atsCount =
                            trends.atsTrend?.[index]?.date === signup.date
                              ? trends.atsTrend[index].count
                              : trends.atsTrend?.find(
                                  (a) => a.date === signup.date
                                )?.count || 0;

                          // Format date for display
                          const dateObj = new Date(signup.date + "T00:00:00");
                          const formattedDate =
                            trendDays <= 30
                              ? dateObj.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : dateObj.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: trendDays > 60 ? "numeric" : undefined,
                                });

                          return {
                            date: signup.date,
                            displayDate: formattedDate,
                            Signups: signup.count,
                            Resumes: resumeCount,
                            Applications: applicationCount,
                            "ATS Checks": atsCount,
                          };
                        })
                      : []
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11 }}
                    angle={trendDays > 30 ? -45 : 0}
                    textAnchor={trendDays > 30 ? "end" : "middle"}
                    height={trendDays > 30 ? 80 : 30}
                    interval="preserveStartEnd"
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value, payload) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload;
                        return data.date
                          ? new Date(
                              data.date + "T00:00:00"
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : value;
                      }
                      return value;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Signups"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Resumes"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Applications"
                    stroke={COLORS.warning}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ATS Checks"
                    stroke={COLORS.purple}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Application Status Distribution */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>
              Distribution of applications by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingApplications ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={applications?.statusDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(applications?.statusDistribution || []).map(
                      (_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card> */}

        {/* ATS Score Distribution */}
        {/* <Card>
          <CardHeader>
            <CardTitle>ATS Score Distribution</CardTitle>
            <CardDescription>Resume quality analysis breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAts ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ats?.scoreDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card> */}
      </div>

      {/* Top Resume Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Resume Templates</CardTitle>
          <CardDescription>
            Most frequently used templates by candidates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTemplates ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={templates} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="templateId" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.purple} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidatesDashboard;
