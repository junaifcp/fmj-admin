import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Edit,
  ArrowLeft,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  XCircle,
  Workflow,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getJobDetails,
  getApplications,
  updateApplicationStatus,
  getPipelineByJobId,
  createPipeline,
} from "@/api/recruiter";
import { getLocationLabel } from "@/utils/format";
import type { Job, Application } from "@/types/recruiter";
import { PipelineResponse } from "@/types/pipeline";
import { toast } from "sonner";
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

const EDUCATION_LABELS: Record<string, string> = {
  "high-school": "High School",
  associate: "Associate",
  bachelor: "Bachelor's",
  master: "Master's",
  phd: "PhD",
  certificate: "Certificate",
  other: "Other",
};

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);
  const [isCheckingPipeline, setIsCheckingPipeline] = useState(true);

  useEffect(() => {
    const checkPipeline = async () => {
      if (!id) return;
      try {
        setIsCheckingPipeline(true);
        const existingPipeline = await getPipelineByJobId(id);
        setPipeline(existingPipeline);
      } catch (error) {
        // Pipeline doesn't exist, which is fine
        setPipeline(null);
      } finally {
        setIsCheckingPipeline(false);
      }
    };
    checkPipeline();
  }, [id]);

  const handleCreatePipeline = async () => {
    if (!id) return;

    if (pipeline) {
      // Navigate to existing pipeline
      navigate(`/recruiter/pipelines/${pipeline._id}`);
      return;
    }

    try {
      setIsCreatingPipeline(true);
      const newPipeline = await createPipeline({
        jobId: id,
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

  // Get job details
  const {
    data: job,
    isLoading: jobLoading,
    error: jobError,
    refetch: refetchJob,
  } = useQuery({
    queryKey: ["job-details", id],
    queryFn: async (): Promise<Job> => {
      if (!id) throw new Error("Missing job id");
      const jobData = await getJobDetails(id);
      if (!jobData) {
        throw new Error("Job not found");
      }
      return jobData as Job;
    },
    enabled: !!id,
  });

  // Get applications
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ["job-applications", id, applicationsPage],
    queryFn: async () => {
      if (!id) throw new Error("Missing job id");
      return await getApplications(id, applicationsPage, 20);
    },
    enabled: !!id,
  });

  const canEdit = job?.canEdit ?? (job?.applicationCount || 0) === 0;

  const handleApplicationStatusChange = async (
    applicationId: string,
    newStatus: Application["status"]
  ) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      toast.success("Application status updated");
      refetchApplications();
      // If all applications are rejected, allow editing
      if (newStatus === "rejected") {
        refetchJob();
      }
    } catch (error) {
      console.error("Failed to update application status:", error);
      toast.error("Failed to update application status");
    }
  };

  if (jobLoading) {
    return (
      <div className="w-full px-4 md:container md:mx-auto md:px-6 space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="w-full px-4 md:container md:mx-auto md:px-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-destructive mb-4">Failed to load job details</p>
            <Button onClick={() => navigate("/recruiter/jobs")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full md:container md:mx-auto md:px-2 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/recruiter/jobs")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
        <div className="flex gap-2">
          {canEdit ? (
            <Button asChild>
              <Link to={`/recruiter/post-job?edit=${job._id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Job
              </Link>
            </Button>
          ) : (
            <Button
              disabled
              variant="outline"
              title="Reject all applications to enable editing"
            >
              <Edit className="h-4 w-4 mr-2" />
              Cannot Edit (Active Applications)
            </Button>
          )}
          <Button
            onClick={handleCreatePipeline}
            disabled={isCreatingPipeline || isCheckingPipeline}
            variant="default"
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
        </div>
      </div>

      {/* Job Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{job.title}</h1>
                <Badge
                  variant={job.status === "active" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {job.status}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-muted-foreground mb-4 flex-wrap">
                <span className="font-medium">
                  {job.company?.name || job.companyName}
                </span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {getLocationLabel(job.location) || "Remote"}
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(job.createdAt), "MMM dd, yyyy")}
                </div>
                <span>•</span>
                <Badge variant="outline" className="capitalize">
                  {job.type}
                </Badge>
              </div>

              <div className="flex items-center gap-6 text-sm flex-wrap">
                {job.salary?.min && job.salary?.max && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {job.salary.currency} {job.salary.min.toLocaleString()} -{" "}
                    {job.salary.max.toLocaleString()}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {job.experienceYears}+ years experience
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {job.applicationCount || 0} application
                  {(job.applicationCount || 0) !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Job Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Job Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {job.summary}
              </p>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {job.description}
                </p>

                {job.requirements && job.requirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Requirements</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {job.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Applications ({applicationsData?.pagination?.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading applications...
                </div>
              ) : !applicationsData?.data ||
                applicationsData.data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No applications received yet
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Applied Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applicationsData.data.map((application: Application) => (
                        <TableRow key={application._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {application.candidate?.firstName || "Unknown"}{" "}
                                {application.candidate?.lastName || ""}
                              </div>
                              {application.candidate?.email && (
                                <div className="text-sm text-muted-foreground">
                                  {application.candidate.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(
                              parseISO(application.appliedAt),
                              "MMM dd, yyyy"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                application.status === "hired"
                                  ? "default"
                                  : application.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="capitalize"
                            >
                              {application.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={application.status}
                              onValueChange={(value) =>
                                handleApplicationStatusChange(
                                  application._id,
                                  value as Application["status"]
                                )
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewed">
                                  Reviewed
                                </SelectItem>
                                <SelectItem value="shortlisted">
                                  Shortlisted
                                </SelectItem>
                                <SelectItem value="rejected">
                                  Rejected
                                </SelectItem>
                                <SelectItem value="hired">Hired</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {applicationsData.pagination &&
                    applicationsData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Page {applicationsData.pagination.page} of{" "}
                          {applicationsData.pagination.totalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setApplicationsPage((p) => Math.max(1, p - 1))
                            }
                            disabled={applicationsPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setApplicationsPage((p) =>
                                Math.min(
                                  applicationsData.pagination.totalPages,
                                  p + 1
                                )
                              )
                            }
                            disabled={
                              applicationsPage >=
                              applicationsData.pagination.totalPages
                            }
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Required Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <Badge
                      key={
                        typeof skill === "string"
                          ? skill
                          : skill._id || `skill-${index}`
                      }
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {typeof skill === "string" ? skill : skill.name}
                      {typeof skill === "object" &&
                        skill.verified === "verified" && (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        )}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Qualifications */}
          {job.qualifications && job.qualifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.qualifications.map((qual, index) => (
                    <Badge key={index} variant="outline">
                      {EDUCATION_LABELS[qual] || qual}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Field of Studies */}
          {job.fieldOfStudies && job.fieldOfStudies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Field of Study
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.fieldOfStudies.map((field, index) => (
                    <Badge
                      key={
                        typeof field === "string"
                          ? field
                          : field._id || `field-${index}`
                      }
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {typeof field === "string" ? field : field.name}
                      {typeof field === "object" &&
                        field.verified === "verified" && (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        )}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Info */}
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Job Type</div>
                <div className="font-medium capitalize">{job.type}</div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground">
                  Experience Required
                </div>
                <div className="font-medium">{job.experienceYears}+ years</div>
              </div>
              {job.salary?.min && job.salary?.max && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Salary Range
                    </div>
                    <div className="font-medium">
                      {job.salary.currency} {job.salary.min.toLocaleString()} -{" "}
                      {job.salary.max.toLocaleString()}
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground">Posted On</div>
                <div className="font-medium">
                  {format(parseISO(job.createdAt), "MMM dd, yyyy")}
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground">
                  Last Updated
                </div>
                <div className="font-medium">
                  {format(parseISO(job.updatedAt), "MMM dd, yyyy")}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
