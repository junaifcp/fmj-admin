import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Briefcase } from "lucide-react";
import { listPipelines } from "@/api/recruiter";
import { PipelineStats } from "@/components/recruiter/pipeline/PipelineStats";
import { PipelineCard } from "@/components/recruiter/pipeline/PipelineCard";
import { PipelineFilters } from "@/components/recruiter/pipeline/PipelineFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import type { PipelineStatus, PipelineResponse } from "@/types/pipeline";

const PipelineList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PipelineStatus | "all">(
    "all"
  );

  // Fetch pipelines from API
  const {
    data: pipelinesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pipelines", statusFilter],
    queryFn: async () => {
      const filters: any = {};
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }
      return await listPipelines(filters);
    },
  });

  // Transform API response to match component expectations
  const pipelines = useMemo(() => {
    if (!pipelinesData?.pipelines) return [];

    return pipelinesData.pipelines.map((pipeline: PipelineResponse) => {
      const job = pipeline.jobId as any;
      const company = job?.companyId as any;

      return {
        _id: pipeline._id,
        jobId: typeof job === "object" ? job._id : pipeline.jobId,
        jobTitle:
          typeof job === "object" && job.title
            ? job.title
            : "Job Title Not Available",
        companyId: typeof company === "object" ? company._id : company || "",
        companyName:
          typeof company === "object" && company.name
            ? company.name
            : "Company Name Not Available",
        recruiterId: pipeline.recruiterId,
        status: pipeline.status,
        startedAt: pipeline.startedAt,
        pausedAt: pipeline.pausedAt,
        completedAt: pipeline.completedAt,
        totalApplications: pipeline.stats?.totalApplications || 0,
        shortlisted: pipeline.stats?.shortlistedCount || 0,
        hired: pipeline.stats?.hiredCount || 0,
        rejected: pipeline.stats?.rejectedCount || 0,
        sources: pipeline.sources,
        publicLink:
          pipeline.publicLink?.uniqueId && pipeline.publicLink?.url
            ? {
                uniqueId: pipeline.publicLink.uniqueId,
                url: pipeline.publicLink.url,
                isActive: pipeline.publicLink.isActive,
                expiresAt: undefined,
                maxApplications: undefined,
              }
            : undefined,
        blogs:
          pipeline.blogs?.map((blog) => ({
            blogId: blog.blogId,
            title: blog.title || "",
            url: blog.url || "",
            publishedAt: "",
            applyLink: "",
          })) || [],
        settings: {
          ...pipeline.settings,
          autoMatching: true,
          emailNotifications: true,
        },
        createdAt: pipeline.createdAt,
        updatedAt: pipeline.updatedAt,
      };
    });
  }, [pipelinesData]);
  const filteredPipelines = useMemo(() => {
    if (!pipelines) return [];

    return pipelines.filter((pipeline) => {
      const matchesSearch =
        !searchQuery ||
        pipeline.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pipeline.companyName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || pipeline.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [pipelines, searchQuery, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <LoadingSkeleton variant="text" count={3} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} variant="card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Failed to load pipelines</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Gradient */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white py-12"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Hiring Pipelines
              </h1>
              <p className="text-blue-100 text-sm md:text-base">
                Manage your recruitment pipelines and find the best candidates
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/recruiter/pipelines/create")}
              className="whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Pipeline
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Statistics Cards */}
          {pipelines && pipelines.length > 0 && (
            <PipelineStats pipelines={pipelines} />
          )}

          {/* Filters */}
          <PipelineFilters
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onSearchChange={setSearchQuery}
            onStatusChange={setStatusFilter}
            onClear={handleClearFilters}
          />

          {/* Pipeline List */}
          {filteredPipelines.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={
                pipelines && pipelines.length === 0
                  ? "No pipelines yet"
                  : "No pipelines match your filters"
              }
              description={
                pipelines && pipelines.length === 0
                  ? "Create your first hiring pipeline to start finding great candidates"
                  : "Try adjusting your search or filter criteria"
              }
              actionLabel={
                pipelines && pipelines.length === 0
                  ? "Create Pipeline"
                  : undefined
              }
              onAction={
                pipelines && pipelines.length === 0
                  ? () => navigate("/recruiter/pipelines/create")
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPipelines.map((pipeline, index) => (
                <PipelineCard
                  key={pipeline._id}
                  pipeline={pipeline}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineList;
