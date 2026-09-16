import React, { useState, useEffect } from "react";
import {
  getResumes,
  deleteResume,
  duplicateResume,
  exportResumesCSV,
} from "@/api/admin";
import { AdminResume, PaginationResponse } from "@/types/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  Eye,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 20;

const ResumesPage: React.FC = () => {
  const [resumes, setResumes] =
    useState<PaginationResponse<AdminResume> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // IMPORTANT: don't use an empty string as a Select.Item value with Radix
  // use a sentinel like 'all' and map it to an empty string when calling the API
  const [templateFilter, setTemplateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [previewResume, setPreviewResume] = useState<AdminResume | null>(null);

  const { toast } = useToast();

  const fetchResumes = async (page = 1, searchTerm = "", template = "all") => {
    try {
      setLoading(true);
      // Map the UI value 'all' to the API's empty template filter
      const templateForApi = template === "all" ? "" : template;
      const data = await getResumes(
        page,
        PAGE_SIZE,
        searchTerm,
        templateForApi
      );
      setResumes(data);
      // keep selectedResumes in sync when data changes (clear selections not on this page)
      setSelectedResumes((prev) =>
        prev.filter((id) => data.data.some((r) => r._id === id))
      );
    } catch (err) {
      toast({
        title: "Failed to load resumes",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  // normalize & pretty-print template identifiers/objects
  const formatTemplate = (t?: unknown) => {
    if (!t) return "—";
    // if backend returned an object like { id: 'template-f', name: '...' }
    if (typeof t === "object" && t !== null) {
      if ("name" in t && typeof (t as any).name === "string")
        return String((t as any).name);
      if ("id" in t && typeof (t as any).id === "string") {
        const id = String((t as any).id);
        const m = id.match(/^template-(.+)$/);
        return m ? `Template ${m[1].toUpperCase()}` : id;
      }
      return JSON.stringify(t);
    }
    // it's a string like 'template-f'
    const id = String(t);
    const m = id.match(/^template-(.+)$/);
    return m ? `Template ${m[1].toUpperCase()}` : id;
  };
  // All available template options
  const templateOptions = [
    "template-a",
    "template-b",
    "template-c",
    "template-d",
    "template-e",
    "template-f",
    "template-g",
    "template-h",
    "template-i",
    "template-j",
    "template-k",
    "template-l",
  ];

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1);
      fetchResumes(1, search, templateFilter);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, templateFilter]);

  const handleDeleteResume = async (resumeId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this resume? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteResume(resumeId);
      toast({ title: "Resume deleted successfully" });
      fetchResumes(currentPage, search, templateFilter);
    } catch (error) {
      toast({
        title: "Failed to delete resume",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateResume = async (resumeId: string) => {
    try {
      await duplicateResume(resumeId);
      toast({ title: "Resume duplicated successfully" });
      fetchResumes(currentPage, search, templateFilter);
    } catch (error) {
      toast({
        title: "Failed to duplicate resume",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportResumesCSV(selectedResumes);
      toast({
        title: "Export started",
        description: "Your CSV file will download shortly",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">
          Resumes Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage all user resumes across the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Resumes</CardTitle>
              <CardDescription>
                {resumes
                  ? `${resumes.pagination.total} total resumes`
                  : "Loading resumes..."}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, title, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  {templateOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {formatTemplate(opt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() =>
                  fetchResumes(currentPage, search, templateFilter)
                }
                size="sm"
                variant="outline"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                onClick={handleExportCSV}
                size="sm"
                variant="outline"
                disabled={selectedResumes.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export ({selectedResumes.length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          resumes &&
                          resumes.data.length > 0 &&
                          selectedResumes.length === resumes.data.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedResumes(
                              resumes?.data.map((r) => r._id) || []
                            );
                          } else {
                            setSelectedResumes([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Resume</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumes?.data.map((resume) => (
                    <TableRow key={resume._id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedResumes.includes(resume._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedResumes([
                                ...selectedResumes,
                                resume._id,
                              ]);
                            } else {
                              setSelectedResumes(
                                selectedResumes.filter(
                                  (id) => id !== resume._id
                                )
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {resume.name || "Untitled Resume"}
                          </div>
                          {resume.jobTitle?.name && (
                            <div className="text-sm text-muted-foreground">
                              {resume.jobTitle.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatTemplate(
                            resume.template ?? (resume as any).templateId
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div>
                          {resume.userName && (
                            <div className="font-medium text-sm">
                              {resume.userName}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            {resume.userEmail || resume.userId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={resume.isPublic ? "default" : "secondary"}
                        >
                          {resume.isPublic ? "Public" : "Private"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewResume(resume)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Resume Preview</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Name:</span>{" "}
                                    {previewResume?.name || "Untitled Resume"}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Template:
                                    </span>{" "}
                                    {formatTemplate(
                                      previewResume?.template ??
                                        previewResume?.templateId
                                    )}
                                  </div>
                                  {previewResume?.jobTitle?.name && (
                                    <div>
                                      <span className="font-medium">
                                        Job Title:
                                      </span>{" "}
                                      {previewResume.jobTitle.name}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-medium">Owner:</span>{" "}
                                    {previewResume?.userName ||
                                      previewResume?.userEmail ||
                                      "Unknown"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Email:</span>{" "}
                                    {previewResume?.userEmail || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Status:</span>{" "}
                                    {previewResume?.isPublic
                                      ? "Public"
                                      : "Private"}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Created:
                                    </span>{" "}
                                    {previewResume?.createdAt
                                      ? new Date(
                                          previewResume.createdAt
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Last Updated:
                                    </span>{" "}
                                    {previewResume?.lastUpdated
                                      ? new Date(
                                          previewResume.lastUpdated
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </div>
                                </div>
                                <div className="bg-muted p-4 rounded-md">
                                  <p className="text-sm text-muted-foreground">
                                    Resume content preview would be displayed
                                    here...
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicateResume(resume._id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteResume(resume._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {resumes && resumes.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(resumes.pagination.page - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(
                      resumes.pagination.page * PAGE_SIZE,
                      resumes.pagination.total
                    )}{" "}
                    of {resumes.pagination.total} resumes
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage - 1;
                        setCurrentPage(newPage);
                        fetchResumes(newPage, search, templateFilter);
                      }}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Page {resumes.pagination.page} of{" "}
                      {resumes.pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage + 1;
                        setCurrentPage(newPage);
                        fetchResumes(newPage, search, templateFilter);
                      }}
                      disabled={currentPage >= resumes.pagination.totalPages}
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
    </div>
  );
};

export default ResumesPage;
