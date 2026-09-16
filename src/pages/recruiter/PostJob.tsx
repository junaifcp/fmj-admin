import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import JobForm from "@/components/recruiter/JobForm";
import { createJob, updateJob, getJobDetails } from "@/api/recruiter";
import type { CreateJobPayload, Job } from "@/types/recruiter";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useQuery } from "@tanstack/react-query";

const PostJob: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editJobId = searchParams.get("edit");
  const { trackJobPosted } = useAnalytics();

  const { data: existingJob, isLoading: jobLoading } = useQuery({
    queryKey: ["job-edit", editJobId],
    queryFn: async (): Promise<Job | null> => {
      if (!editJobId) return null;
      const jobData = await getJobDetails(editJobId);
      return jobData || null;
    },
    enabled: !!editJobId,
  });

  const handleSubmit = async (data: CreateJobPayload) => {
    try {
      if (editJobId && existingJob) {
        await updateJob(editJobId, data);
        toast.success("Job updated successfully!");
        navigate(`/recruiter/jobs/${editJobId}`);
      } else {
        const result = await createJob(data);

        trackJobPosted({
          jobId: result?._id || "",
          title: data.title,
          type: data.type,
          location:
            typeof data.location === "string"
              ? data.location
              : data.location?.formattedAddress,
          remote: false,
          salaryMin: data.salary?.min,
          salaryMax: data.salary?.max,
          experienceMin: data.experienceYears,
          experienceMax: data.experienceYears,
        });

        toast.success("Job posted successfully!");
        navigate("/recruiter/jobs");
      }
    } catch (error: unknown) {
      console.error("Failed to create job:", error);
      toast.error("Failed to post job. Please try again.");
    }
  };

  const handleCancel = () => {
    navigate("/recruiter/jobs");
  };

  if (editJobId && jobLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const isEditMode = !!editJobId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit Job Posting" : "Post a New Job"}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode
            ? "Update and modify your existing job posting details"
            : "Create a job posting to attract qualified candidates"}
        </p>
      </div>

      <JobForm
        job={existingJob || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEditMode={!!editJobId}
      />
    </div>
  );
};

export default PostJob;
