import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  DollarSign,
  Calendar,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Pause,
  Play,
  Image,
  FileDown,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import type { Job } from "@/types/recruiter";
import PosterGalleryModal from "./poster/PosterGalleryModal";
import { downloadJobDetailsPdf } from "@/utils/jobDetailsPdf";
import { getPipelineByJobId, createPipeline } from "@/api/recruiter";
import { PipelineResponse } from "@/types/pipeline";

interface JobCardProps {
  job: Job;
  onEdit?: (job: Job) => void;
  onDelete?: (jobId: string) => void;
  onToggleStatus?: (jobId: string, status: Job["status"]) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const navigate = useNavigate();
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);
  const [isCheckingPipeline, setIsCheckingPipeline] = useState(true);

  useEffect(() => {
    const checkPipeline = async () => {
      try {
        setIsCheckingPipeline(true);
        const existingPipeline = await getPipelineByJobId(job._id);
        setPipeline(existingPipeline);
      } catch (error) {
        // Pipeline doesn't exist, which is fine
        setPipeline(null);
      } finally {
        setIsCheckingPipeline(false);
      }
    };
    checkPipeline();
  }, [job._id]);

  const handleCreatePipeline = async () => {
    if (pipeline) {
      // Navigate to existing pipeline
      navigate(`/recruiter/pipelines/${pipeline._id}`);
      return;
    }

    try {
      setIsCreatingPipeline(true);
      const newPipeline = await createPipeline({
        jobId: job._id,
        sources: {
          database: true,
          publicLink: true,
          blogs: true,
        },
      });
      toast.success("Pipeline created successfully");
      navigate(`/recruiter/pipelines/${newPipeline._id}`);
    } catch (error: any) {
      console.error("Failed to create pipeline:", error);
      toast.error(error?.message || "Failed to create pipeline");
    } finally {
      setIsCreatingPipeline(false);
    }
  };

  const formatSalary = (salary: Job["salary"]) => {
    if (!salary.min && !salary.max) return "Salary not specified";
    const currency = salary.currency || "USD";
    const min = salary.min ? `${salary.min.toLocaleString()}` : "";
    const max = salary.max ? `${salary.max.toLocaleString()}` : "";

    if (min && max) {
      return `${currency} ${min} - ${max}`;
    }
    return `${currency} ${min || max}`;
  };

  const getStatusColor = (status: Job["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: Job["type"]) => {
    switch (type) {
      case "full-time":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "part-time":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "contract":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "internship":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleDownloadJobDetails = async () => {
    try {
      await downloadJobDetailsPdf(job);
    } catch (error) {
      console.error("handleDownloadJobDetails:", error);
      toast.error("Failed to download job details");
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow flex">
        <div className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold line-clamp-1">
                  {job.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {job.companyName || "No company"}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      to={`/recruiter/jobs/${job._id}`}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(job)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Job
                    </DropdownMenuItem>
                  )}
                  {onToggleStatus && (
                    <DropdownMenuItem
                      onClick={() =>
                        onToggleStatus(
                          job._id,
                          job.status === "active" ? "paused" : "active"
                        )
                      }
                    >
                      {job.status === "active" ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Job
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Activate Job
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(job._id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Job
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
              <Badge className={getTypeColor(job.type)}>
                {job.type.replace("-", " ")}
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {typeof job.location === "string"
                    ? job.location
                    : job.location?.formattedAddress || "No location"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>{formatSalary(job.salary)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{job.applicationCount || 0} applications</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <p className="text-sm line-clamp-3">{job.description}</p>

            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to={`/recruiter/applications?jobId=${job._id}`}>
                  View Applications
                </Link>
              </Button>
              <Button asChild size="sm" className="flex-1">
                <Link to={`/recruiter/jobs/${job._id}`}>View Details</Link>
              </Button>
            </div>

            <Button
              onClick={handleCreatePipeline}
              disabled={isCreatingPipeline || isCheckingPipeline}
              variant="outline"
              size="sm"
              className="w-full mt-2"
            >
              <Workflow className="h-4 w-4 mr-2" />
              {isCreatingPipeline
                ? "Creating..."
                : isCheckingPipeline
                ? "Checking..."
                : pipeline
                ? "View Pipeline"
                : "Create Pipeline"}
            </Button>
          </CardContent>
        </div>

        {/* Right Action Column */}
        <div className="flex flex-col gap-2 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPosterModalOpen(true)}
            className="w-full justify-start"
            aria-label="Download hiring poster"
          >
            <Image className="h-4 w-4 mr-2" />
            <span className="hidden lg:inline">Hiring Poster</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadJobDetails}
            className="w-full justify-start"
            aria-label="Download job details"
          >
            <FileDown className="h-4 w-4 mr-2" />
            <span className="hidden lg:inline">Job PDf</span>
          </Button>
        </div>

        {/* Poster Modal */}
        <PosterGalleryModal
          open={isPosterModalOpen}
          onClose={() => setIsPosterModalOpen(false)}
          job={job}
          exportSize={{ width: 1080, height: 1080 }}
        />
      </Card>
    </>
  );
};

export default JobCard;
