import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ApplicationCard from "@/components/recruiter/ApplicationCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, FileText } from "lucide-react";
import {
  getApplications,
  updateApplicationStatus,
  getCandidateResume,
} from "@/api/recruiter";
import type { Application, PaginatedApplications } from "@/types/recruiter";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";

const RecruiterApplications: React.FC = () => {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [applications, setApplications] =
    useState<PaginatedApplications | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    trackApplicationStatusUpdated,
    trackCandidateResumeViewed,
    trackApplicationsListFiltered,
  } = useAnalytics();

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await getApplications(jobId || undefined, 1, 50);
      setApplications(data);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    applicationId: string,
    status: Application["status"]
  ) => {
    // Find the application to get its details
    const application = applications?.data.find(
      (app) => app._id === applicationId
    );

    try {
      await updateApplicationStatus(applicationId, status);

      // Track application status update
      trackApplicationStatusUpdated({
        applicationId,
        jobId: application?.job?._id || jobId,
        candidateId: application?.candidate?._id,
        oldStatus: application?.status,
        newStatus: status,
        actionType: status,
      });

      toast.success("Application status updated");
      fetchApplications(); // Refresh the list
    } catch (error) {
      console.error("Failed to update application status:", error);
      toast.error("Failed to update application status");
    }
  };

  const handleViewResume = async (candidateId: string) => {
    const application = applications?.data.find(
      (app) => app.candidate?._id === candidateId
    );

    try {
      const { resumeUrl } = await getCandidateResume(candidateId);

      // Track resume viewed
      trackCandidateResumeViewed({
        candidateId,
        jobId: application?.job?._id || jobId,
        applicationId: application?._id,
        source: "applications_list",
      });

      window.open(resumeUrl, "_blank");
    } catch (error) {
      console.error("Failed to fetch resume:", error);
      toast.error("Failed to load candidate resume");
    }
  };

  const filteredApplications =
    applications?.data.filter((application) => {
      const candidateName =
        `${application.candidate.firstName} ${application.candidate.lastName}`.toLowerCase();
      const matchesSearch =
        candidateName.includes(searchTerm.toLowerCase()) ||
        application.candidate.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        application.job.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;

      return matchesSearch && matchesStatus;
    }) || [];

  // Track filter changes
  useEffect(() => {
    if (applications && statusFilter !== "all") {
      trackApplicationsListFiltered({
        jobId: jobId || undefined,
        status: statusFilter,
        resultsCount: filteredApplications.length,
      });
    }
  }, [statusFilter, filteredApplications.length]);

  const getStatusCounts = () => {
    if (!applications?.data) return {};

    return applications.data.reduce((counts, app) => {
      counts[app.status] = (counts[app.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3 p-4 border rounded-lg">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground">
            {jobId ? "Applications for specific job" : "All job applications"}
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              {applications?.data.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.pending || 0}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.reviewed || 0}
            </div>
            <div className="text-sm text-muted-foreground">Reviewed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.shortlisted || 0}
            </div>
            <div className="text-sm text-muted-foreground">Shortlisted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {statusCounts.hired || 0}
            </div>
            <div className="text-sm text-muted-foreground">Hired</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredApplications.length} application
                {filteredApplications.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredApplications.map((application) => (
          <ApplicationCard
            key={application._id}
            application={application}
            onUpdateStatus={handleUpdateStatus}
            onViewResume={handleViewResume}
          />
        ))}
      </div>

      {filteredApplications.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No applications found
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters to see more results."
                : "No applications have been received yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecruiterApplications;
