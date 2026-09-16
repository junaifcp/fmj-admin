import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Copy,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import {
  getEmailTemplates,
  deleteEmailTemplate,
  duplicateEmailTemplate,
  previewEmailTemplate,
  EmailTemplate,
} from "@/api/admin";
import { PaginationResponse } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const EmailTemplatesPage: React.FC = () => {
  const [data, setData] = useState<PaginationResponse<EmailTemplate> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] =
    useState<EmailTemplate | null>(null);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] =
    useState<EmailTemplate | null>(null);
  const [emailPreview, setEmailPreview] = useState<{
    subject: string;
    html: string;
  } | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = async (
    page = 1,
    category?: string,
    active?: boolean,
    searchTerm?: string
  ) => {
    try {
      setLoading(true);
      const result = await getEmailTemplates(
        page,
        20,
        category,
        active,
        searchTerm
      );
      setData(result);
    } catch (error) {
      toast({
        title: "Failed to fetch email templates",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData(
        1,
        categoryFilter || undefined,
        activeFilter ?? undefined,
        search || undefined
      );
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, categoryFilter, activeFilter]);

  useEffect(() => {
    fetchData(
      currentPage,
      categoryFilter || undefined,
      activeFilter ?? undefined,
      search || undefined
    );
  }, [currentPage]);

  // Load preview for first template on mount
  useEffect(() => {
    const loadFirstTemplatePreview = async () => {
      if (data?.data && data.data.length > 0) {
        const firstTemplate = data.data[0];
        if (firstTemplate.htmlBody) {
          setSelectedTemplateForPreview(firstTemplate);
          try {
            // Extract variables and use sample data
            const { extractVariablesFromTemplate } = await import(
              "@/utils/emailTemplateUtils"
            );
            const vars = extractVariablesFromTemplate(
              firstTemplate.htmlBody,
              firstTemplate.subject || ""
            );
            const sampleVars: Record<string, any> = {};
            vars.forEach((v) => {
              if (v === "userName") sampleVars[v] = "John Doe";
              else if (v === "firstName") sampleVars[v] = "John";
              else if (v === "lastName") sampleVars[v] = "Doe";
              else if (v === "email") sampleVars[v] = "john.doe@example.com";
              else sampleVars[v] = `Sample ${v}`;
            });

            const preview = await previewEmailTemplate(
              firstTemplate._id,
              sampleVars
            );
            setEmailPreview({ subject: preview.subject, html: preview.html });
          } catch (error) {
            console.error("Failed to load preview:", error);
          }
        }
      }
    };

    if (data?.data && !selectedTemplateForPreview) {
      loadFirstTemplatePreview();
    }
  }, [data]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreate = () => {
    navigate("/admin/email/templates/new");
  };

  const handleEdit = (template: EmailTemplate) => {
    navigate(`/admin/email/templates/${template._id}/edit`);
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      await duplicateEmailTemplate(template._id);
      toast({
        title: "Template duplicated successfully",
      });
      fetchData(
        currentPage,
        categoryFilter || undefined,
        activeFilter ?? undefined,
        search || undefined
      );
    } catch (error) {
      toast({
        title: "Failed to duplicate template",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (template: EmailTemplate) => {
    if (template.isSystem) {
      toast({
        title: "Cannot delete system template",
        description: "System templates are protected and cannot be deleted",
        variant: "destructive",
      });
      return;
    }
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      await deleteEmailTemplate(templateToDelete._id);
      toast({
        title: "Template deleted successfully",
      });
      fetchData(
        currentPage,
        categoryFilter || undefined,
        activeFilter ?? undefined,
        search || undefined
      );
    } catch (error) {
      toast({
        title: "Failed to delete template",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "marketing":
        return "default";
      case "job-opening":
        return "secondary";
      case "notification":
        return "outline";
      case "welcome":
        return "default";
      case "password-reset":
        return "outline";
      default:
        return "secondary";
    }
  };

  const filteredData = data?.data.filter((template) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        template.name.toLowerCase().includes(searchLower) ||
        template.subject.toLowerCase().includes(searchLower) ||
        (template.description &&
          template.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Manage email templates for marketing, notifications, and more
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="job-opening">Job Opening</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="password-reset">Password Reset</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={
                  activeFilter === null
                    ? "all"
                    : activeFilter
                    ? "active"
                    : "inactive"
                }
                onValueChange={(value) => {
                  if (value === "all") setActiveFilter(null);
                  else setActiveFilter(value === "active");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  fetchData(
                    currentPage,
                    categoryFilter || undefined,
                    activeFilter ?? undefined,
                    search || undefined
                  )
                }
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Table and Preview */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Variables</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData && filteredData.length > 0 ? (
                        filteredData.map((template) => (
                          <TableRow
                            key={template._id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={async () => {
                              if (template.htmlBody) {
                                setSelectedTemplateForPreview(template);
                                try {
                                  // Extract variables and use sample data
                                  const { extractVariablesFromTemplate } =
                                    await import("@/utils/emailTemplateUtils");
                                  const vars = extractVariablesFromTemplate(
                                    template.htmlBody,
                                    template.subject || ""
                                  );
                                  const sampleVars: Record<string, any> = {};
                                  vars.forEach((v) => {
                                    if (v === "userName")
                                      sampleVars[v] = "John Doe";
                                    else if (v === "firstName")
                                      sampleVars[v] = "John";
                                    else if (v === "lastName")
                                      sampleVars[v] = "Doe";
                                    else if (v === "email")
                                      sampleVars[v] = "john.doe@example.com";
                                    else sampleVars[v] = `Sample ${v}`;
                                  });

                                  const preview = await previewEmailTemplate(
                                    template._id,
                                    sampleVars
                                  );
                                  setEmailPreview({
                                    subject: preview.subject,
                                    html: preview.html,
                                  });
                                } catch (error) {
                                  console.error(
                                    "Failed to load preview:",
                                    error
                                  );
                                  setEmailPreview(null);
                                }
                              } else {
                                setEmailPreview(null);
                              }
                            }}
                          >
                            <TableCell className="font-medium">
                              {template.name}
                              {template.isSystem && (
                                <Badge variant="outline" className="ml-2">
                                  System
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getCategoryBadgeVariant(
                                  template.category
                                )}
                              >
                                {template.category.replace("-", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {template.subject}
                            </TableCell>
                            <TableCell>
                              {template.variables?.length || 0}
                            </TableCell>
                            <TableCell>{template.usageCount || 0}</TableCell>
                            <TableCell>
                              {template.isActive ? (
                                <Badge
                                  variant="default"
                                  className="bg-green-600"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div
                                className="flex items-center justify-end gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(template)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDuplicate(template)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(template)}
                                  disabled={template.isSystem}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No email templates found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Preview Pane */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Preview</Label>
                  </div>
                  <div className="border rounded-lg bg-background overflow-hidden sticky top-4">
                    {emailPreview ? (
                      <>
                        <div className="p-3 border-b bg-muted">
                          <p className="text-sm font-medium">
                            Subject: {emailPreview.subject}
                          </p>
                          {selectedTemplateForPreview && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Template: {selectedTemplateForPreview.name}
                            </p>
                          )}
                        </div>
                        <div className="max-h-[600px] overflow-auto">
                          <iframe
                            srcDoc={emailPreview.html}
                            className="w-full h-[600px] border-0"
                            title="Email Preview"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
                        <Eye className="h-16 w-16 mb-4 animate-pulse" />
                        <p className="text-sm font-medium">
                          Preview will be available here
                        </p>
                        <p className="text-xs mt-2 text-center px-4">
                          Select a template from the list to see its preview
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing page {data.pagination.page} of{" "}
                  {data.pagination.totalPages} ({data.pagination.total} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= data.pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmailTemplatesPage;
