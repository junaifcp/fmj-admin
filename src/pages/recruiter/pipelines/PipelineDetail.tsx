import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PipelineHeader } from "@/components/recruiter/pipeline/PipelineHeader";
import { SourceTabs } from "@/components/recruiter/pipeline/SourceTabs";
import { CandidatePipeline } from "@/components/recruiter/pipeline/CandidatePipeline";
import { TopCandidates } from "@/components/recruiter/pipeline/TopCandidates";
import { ApplicationDetailModal } from "@/components/recruiter/application/ApplicationDetailModal";
import { HiringFunnel } from "@/components/recruiter/pipeline/HiringFunnel";
import { PipelineStatus } from "@/components/recruiter/pipeline/PipelineStatus";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getPipeline,
  startPipeline,
  startMatching,
  getMatchedApplications,
} from "@/api/recruiter";
import { usePipelineStatus } from "@/hooks/usePipelineStatus";
import { isWithin24HourWindow } from "@/utils/pipelineUtils";
import { toast } from "sonner";
import type {
  PipelineStatus as PipelineStatusType,
  ApplicationStatus,
  PipelineApplication,
  PipelineResponse,
  Pipeline,
} from "@/types/pipeline";

const PipelineDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] =
    useState<PipelineApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchedApplications, setMatchedApplications] = useState<
    PipelineApplication[]
  >([]);
  const [isMatchingStarted, setIsMatchingStarted] = useState(false);

  // Bypass 24-hour check for testing
  const skip24HourCheck =
    import.meta.env.VITE_SKIP_24_HOUR_MATCHING_CHECK === "true";

  // Fetch pipeline data
  const {
    data: pipeline,
    isLoading: pipelineLoading,
    error: pipelineError,
  } = useQuery({
    queryKey: ["pipeline", id],
    queryFn: async () => {
      if (!id) throw new Error("Pipeline ID is required");
      return await getPipeline(id);
    },
    enabled: !!id,
  });

  // Fetch pipeline status (for active pipelines)
  const isActive =
    pipeline?.status === "active" &&
    pipeline?.startedAt &&
    (skip24HourCheck || isWithin24HourWindow(pipeline.startedAt));
  const { data: statusTracking, isLoading: statusLoading } = usePipelineStatus(
    id,
    isActive || false
  );

  // Start pipeline mutation
  const startPipelineMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Pipeline ID is required");
      return await startPipeline(id);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["pipeline", id], data);
      toast.success("Pipeline started successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to start pipeline");
    },
  });

  // Start matching mutation
  const startMatchingMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Pipeline ID is required");
      return await startMatching(id);
    },
    onSuccess: (data) => {
      setIsMatchingStarted(true);
      toast.success(
        `Matching completed: ${data.matched} out of ${data.total} applications matched!`
      );
      queryClient.invalidateQueries({ queryKey: ["pipeline", id] });
      queryClient.invalidateQueries({ queryKey: ["matchedApplications", id] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to start matching");
    },
  });

  // Fetch matched applications
  const { data: matchedApps, isLoading: matchedLoading } = useQuery({
    queryKey: ["matchedApplications", id],
    queryFn: async () => {
      if (!id) throw new Error("Pipeline ID is required");
      return await getMatchedApplications(id, { limit: 100, minScore: 0 });
    },
    enabled:
      !!id &&
      (isMatchingStarted ||
        pipeline?.status === "completed" ||
        (pipeline?.stats?.matchedApplications ?? 0) > 0),
  });

  // Update matched applications when data changes
  React.useEffect(() => {
    if (matchedApps) {
      setMatchedApplications(matchedApps);
    }
  }, [matchedApps]);

  React.useEffect(() => {
    if ((pipeline?.stats?.matchedApplications ?? 0) > 0) {
      setIsMatchingStarted(true);
    }
  }, [pipeline?.stats?.matchedApplications]);

  const handleStatusChange = async (newStatus: PipelineStatusType) => {
    if (newStatus === "active" && pipeline?.status === "draft") {
      startPipelineMutation.mutate();
    } else {
      // TODO: Implement pause/resume API calls
      toast.info("Pause/Resume functionality coming soon");
    }
  };

  const handleApplicationStatusChange = async (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => {
    // TODO: Implement API call to update application status
    toast.info("Application status update coming soon");
  };

  const handleViewApplication = (application: PipelineApplication) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApplication(null);
  };

  const handleShortlist = (application: any) => {
    handleApplicationStatusChange(application._id, "shortlisted");
  };

  const handleReject = (application: any) => {
    handleApplicationStatusChange(application._id, "rejected");
  };

  if (pipelineLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <LoadingSkeleton variant="card" />
        </div>
      </div>
    );
  }

  if (pipelineError || !pipeline) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">
                {pipelineError
                  ? "Failed to load pipeline"
                  : "Pipeline not found"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Convert PipelineResponse to Pipeline type for components
  const stats = pipeline.stats ?? {
    totalApplications: 0,
    matchedApplications: 0,
    shortlistedCount: 0,
    rejectedCount: 0,
    hiredCount: 0,
    interviewScheduledCount: 0,
  };

  const statusBreakdown = pipeline.statusBreakdown ?? {
    pending: 0,
    reviewing: 0,
    "top-candidate": 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
    withdrawn: 0,
  };

  const pipelineForComponents: Pipeline = {
    _id: pipeline._id,
    jobId: pipeline.jobId,
    jobTitle: pipeline.jobTitle ?? pipeline.job?.title ?? "Job Title",
    companyId: pipeline.companyId ?? pipeline.job?.company?._id ?? "",
    companyName:
      pipeline.companyName ?? pipeline.job?.company?.name ?? "Company Name",
    recruiterId: pipeline.recruiterId,
    status: pipeline.status,
    startedAt: pipeline.startedAt,
    pausedAt: pipeline.pausedAt,
    completedAt: pipeline.completedAt,
    totalApplications: stats.totalApplications ?? 0,
    shortlisted: stats.shortlistedCount ?? 0,
    hired: stats.hiredCount ?? 0,
    rejected: stats.rejectedCount ?? 0,
    statusBreakdown,
    sources: pipeline.sources,
    publicLink: pipeline.publicLink
      ? {
          uniqueId: pipeline.publicLink.uniqueId ?? "",
          url: pipeline.publicLink.url ?? "",
          isActive: pipeline.publicLink.isActive ?? false,
          expiresAt: pipeline.publicLink.expiresAt,
          maxApplications: pipeline.publicLink.maxApplications,
        }
      : undefined,
    blogs: pipeline.blogs?.map((blog) => ({
      blogId: (blog as any).blogId?.toString?.() ?? "",
      title: blog.title ?? "",
      url: blog.url ?? "",
      publishedAt: blog.publishedAt
        ? new Date(blog.publishedAt).toISOString()
        : "",
      applyLink: blog.applyLink ?? "",
    })),
    settings: pipeline.settings,
    createdAt: pipeline.createdAt,
    updatedAt: pipeline.updatedAt,
  };

  const showHiringFunnel = isActive && !skip24HourCheck; // Hide funnel when bypassing
  const hoursElapsed = pipeline?.startedAt
    ? (Date.now() - new Date(pipeline.startedAt).getTime()) / (1000 * 60 * 60)
    : 0;
  const canStartMatching =
    (skip24HourCheck || hoursElapsed >= 24) && // Add bypass check
    pipeline?.status === "active" &&
    !isMatchingStarted;
  const showTopCandidates =
    isMatchingStarted ||
    pipeline.status === "completed" ||
    (!isActive &&
      (matchedApplications.length > 0 ||
        (pipeline.stats?.matchedApplications ?? 0) > 0));
  const showApplications = true; // Always show applications

  return (
    <div className="min-h-screen bg-background">
      <PipelineHeader
        pipeline={pipelineForComponents}
        onStatusChange={handleStatusChange}
        isLoading={startPipelineMutation.isPending}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Hiring Funnel - Show when active */}
          {showHiringFunnel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <HiringFunnel
                statusTracking={statusTracking}
                isLoading={statusLoading}
                timeRemaining={statusTracking?.timeRemaining || 0}
              />
            </motion.div>
          )}

          {/* Pipeline Status - Show when active */}
          {showHiringFunnel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <PipelineStatus
                pipelineId={pipeline._id}
                startedAt={pipeline.startedAt}
                status={pipeline.status}
              />
            </motion.div>
          )}

          {/* Start Matching Button - Show after 24 hours */}
          {canStartMatching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardContent className="py-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        Ready for Matching
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        24-hour window complete. Start AI matching to see top
                        candidates.
                      </p>
                    </div>
                    <Button
                      onClick={() => startMatchingMutation.mutate()}
                      disabled={startMatchingMutation.isPending}
                      size="lg"
                    >
                      {startMatchingMutation.isPending
                        ? "Matching..."
                        : "Start Matching"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Top Candidates - Show after matching is started */}
          {showTopCandidates && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {matchedLoading ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <LoadingSkeleton variant="card" />
                  </CardContent>
                </Card>
              ) : matchedApplications.length > 0 ? (
                <TopCandidates
                  candidates={matchedApplications}
                  onView={handleViewApplication}
                  onShortlist={handleShortlist}
                  onReject={handleReject}
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {isMatchingStarted
                      ? "No matched candidates found. Try adjusting the minimum score."
                      : "Top candidates will appear here after matching is started"}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Source Configuration Tabs - Commented out per user request */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <SourceTabs pipeline={pipelineForComponents} />
          </motion.div> */}

          {/* Kanban Board */}
          {showApplications && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <CandidatePipeline
                applications={
                  matchedApplications.length > 0 ? matchedApplications : []
                }
                onView={handleViewApplication}
                onStatusChange={handleApplicationStatusChange}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      <ApplicationDetailModal
        application={selectedApplication}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onShortlist={handleShortlist}
        onReject={handleReject}
      />
    </div>
  );
};

export default PipelineDetail;
