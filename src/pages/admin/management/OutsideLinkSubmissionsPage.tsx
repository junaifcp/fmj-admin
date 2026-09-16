import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Eye,
  Mail,
  Phone,
  Calendar,
  FileText,
} from "lucide-react";
import {
  getOutsideLink,
  getOutsideLinkSubmissions,
} from "@/api/admin";
import {
  OutsideLink,
  OutsideLinkSubmissionAdmin,
  PaginationResponse,
} from "@/types/admin";
import { useToast } from "@/hooks/use-toast";
import { ResumeViewerModal } from "@/components/admin/ResumeViewerModal";

const OutsideLinkSubmissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [link, setLink] = useState<OutsideLink | null>(null);
  const [data, setData] = useState<PaginationResponse<OutsideLinkSubmissionAdmin> | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string | null>(null);

  const fetchLink = useCallback(async () => {
    if (!id) return;
    try {
      const linkData = await getOutsideLink(id);
      setLink(linkData);
    } catch (error) {
      toast({
        title: "Failed to fetch outside link",
        description:
          error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [id, toast]);

  const fetchSubmissions = useCallback(
    async (page = 1) => {
      if (!id) return;
      try {
        setLoading(true);
        const result = await getOutsideLinkSubmissions(id, page, 20);
        setData(result);
        setCurrentPage(page);
      } catch (error) {
        toast({
          title: "Failed to fetch submissions",
          description:
            error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [id, toast]
  );

  useEffect(() => {
    fetchLink();
  }, [fetchLink]);

  useEffect(() => {
    fetchSubmissions(1);
  }, [fetchSubmissions]);

  const handlePageChange = (page: number) => {
    fetchSubmissions(page);
  };

  const handleViewResume = (resumeUrl: string | null) => {
    setSelectedResumeUrl(resumeUrl);
    setResumeModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/management/outside-links")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-mono font-bold tracking-tight">
              Submissions
            </h1>
            <p className="text-muted-foreground mt-1">
              {link ? `Viewing submissions for: ${link.title}` : "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/admin/management/outside-links"
          className="hover:text-foreground"
        >
          Outside Links
        </Link>
        <span>/</span>
        <span className="text-foreground">
          {link?.title || "Loading..."} - Submissions
        </span>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            View all submissions for this outside link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !data || data.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No submissions found
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Submitted At
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Resume
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((submission) => (
                      <TableRow key={submission._id}>
                        <TableCell className="font-medium">
                          {submission.email}
                        </TableCell>
                        <TableCell>
                          {submission.phone || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                        <TableCell>
                          {submission.resumeUrl ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewResume(submission.resumeUrl)}
                              title="View Resume"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">No resume</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages} (
                    {data.pagination.total} total)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(data.pagination.page - 1)}
                      disabled={!data.pagination.hasPrevPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(data.pagination.page + 1)}
                      disabled={!data.pagination.hasNextPage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Resume Viewer Modal */}
      <ResumeViewerModal
        open={resumeModalOpen}
        onOpenChange={setResumeModalOpen}
        resumeUrl={selectedResumeUrl}
        title="Resume"
      />
    </div>
  );
};

export default OutsideLinkSubmissionsPage;
