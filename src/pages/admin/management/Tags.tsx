import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/api/admin";
import { Tag, TagAppliesTo, PaginationResponse } from "@/types/admin";
import { PATHS } from "@/routes/paths";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Job tags 2.1 (docs/job-tags): one Tag list, two kinds. Job tag slugs use hyphens
// (they go into candidate links, ?tags=job-fair); outside-link slugs keep underscores.
const KIND_ALL = "all";
const KIND_LABELS: Record<TagAppliesTo, string> = {
  job: "Jobs",
  outside_link: "Outside links",
};

function parseKind(value: string | null): TagAppliesTo | undefined {
  return value === "job" || value === "outside_link" ? value : undefined;
}

/** The slug the server will make (utils/tagSlug.ts), before any _2 / -2 suffix. */
function previewSlug(name: string, kind: TagAppliesTo): string {
  const base = name.toLowerCase().trim();
  if (kind === "job") {
    return (
      base
        .replace(/[\s_]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "") || "tag-slug"
    );
  }
  return (
    base
      .replace(/[\s]+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "tag_slug"
  );
}

type TagForm = { name: string; appliesTo: TagAppliesTo; showToCandidates: boolean };

const TagsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const kind = parseKind(params.get("kind"));
  const [data, setData] = useState<PaginationResponse<Tag> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Tag | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Tag | null>(null);
  const emptyForm = (): TagForm => ({
    name: "",
    appliesTo: kind === "job" ? "job" : "outside_link",
    showToCandidates: false,
  });
  const [formData, setFormData] = useState<TagForm>(emptyForm);

  const fetchData = useCallback(
    async (page = 1, searchTerm = "") => {
      try {
        setLoading(true);
        const result = await getTags(page, 20, searchTerm, kind);
        setData(result);
      } catch (error) {
        toast.error("Failed to fetch tags", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    },
    [kind]
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData(1, search);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, fetchData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page, search);
  };

  const setKind = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === KIND_ALL) next.delete("kind");
    else next.set("kind", value);
    setParams(next, { replace: true });
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData(emptyForm());
    setModalOpen(true);
  };

  const handleEdit = (item: Tag) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      appliesTo: item.appliesTo ?? "outside_link",
      showToCandidates: item.appliesTo === "job" && !!item.showToCandidates,
    });
    setModalOpen(true);
  };

  /** Show to candidates, straight from the list: optimistic, undone on failure. */
  const toggleVisible = async (item: Tag, on: boolean) => {
    const patch = (value: boolean) =>
      setData((d) =>
        d
          ? {
              ...d,
              data: d.data.map((t) =>
                t._id === item._id ? { ...t, showToCandidates: value } : t
              ),
            }
          : d
      );
    patch(on);
    try {
      await updateTag(item._id, { showToCandidates: on });
      toast.success(
        on
          ? `"${item.name}" is now shown to candidates`
          : `"${item.name}" is now hidden from candidates`
      );
    } catch (error) {
      patch(!on);
      toast.error("Couldn't change visibility", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTag(id);
      toast.success("Tag deleted successfully");
      fetchData(currentPage, search);
    } catch (error) {
      toast.error("Failed to delete tag", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }

    try {
      setModalLoading(true);
      const isJob = formData.appliesTo === "job";
      if (editingItem) {
        await updateTag(editingItem._id, {
          name: formData.name.trim(),
          ...(formData.appliesTo !== editingItem.appliesTo
            ? { appliesTo: formData.appliesTo }
            : {}),
          ...(isJob ? { showToCandidates: formData.showToCandidates } : {}),
        });
        toast.success("Tag updated successfully");
      } else {
        await createTag({
          name: formData.name.trim(),
          appliesTo: formData.appliesTo,
          showToCandidates: isJob && formData.showToCandidates,
        });
        toast.success("Tag created successfully");
      }
      fetchData(currentPage, search);
      handleCloseModal();
    } catch (error) {
      toast.error(editingItem ? "Failed to update tag" : "Failed to create tag", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormData(emptyForm());
  };

  // A job tag on jobs can't change kind (the server answers 409). Outside-link use
  // isn't counted in the list, so that case is left to the server's message.
  const kindLocked = !!editingItem && editingItem.appliesTo === "job" && (editingItem.jobCount ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-extrabold tracking-tight">
            Tags Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Job tags group jobs for candidates (e.g. a job fair). Outside link
            tags are used for Google Tag Manager.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tag
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>
            Create tags, choose what they are used for, and show job tags to
            candidates when they are ready
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Kind + search */}
            <div className="flex items-center gap-4">
              <Select value={kind ?? KIND_ALL} onValueChange={setKind}>
                <SelectTrigger className="w-44" aria-label="Used for">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KIND_ALL}>All tags</SelectItem>
                  <SelectItem value="job">Jobs</SelectItem>
                  <SelectItem value="outside_link">Outside links</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchData(currentPage, search)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : !data || data.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tags found
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Used for</TableHead>
                        <TableHead>Candidates</TableHead>
                        <TableHead>Jobs</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.data.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.slug}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.appliesTo === "job" ? "default" : "secondary"}>
                              {KIND_LABELS[item.appliesTo ?? "outside_link"]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.appliesTo === "job" ? (
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={!!item.showToCandidates}
                                  onCheckedChange={(on) => toggleVisible(item, on)}
                                  aria-label={`Show "${item.name}" to candidates`}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {item.showToCandidates ? "Shown" : "Hidden"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.appliesTo === "job" ? (
                              <Link
                                to={`${PATHS.ADMIN.HIRING.JOBS}?tagId=${item._id}`}
                                className="text-primary underline-offset-4 hover:underline"
                                title="Open these jobs on the Jobs page"
                              >
                                {item.jobCount ?? 0}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setItemToDelete(item);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data.pagination && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {data.pagination.page} of {data.pagination.totalPages} (
                      {data.pagination.total} total)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handlePageChange(data.pagination.page - 1)
                        }
                        disabled={!data.pagination.hasPrevPage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handlePageChange(data.pagination.page + 1)
                        }
                        disabled={!data.pagination.hasNextPage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Tag" : "Create Tag"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the tag. The slug is regenerated when the name or use changes."
                : "Create a new tag. A slug is made from the name."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleModalSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tag Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Digital Market Leads"
                  required
                />
                {formData.name && (
                  <p className="text-xs text-muted-foreground">
                    Slug will be:{" "}
                    <span className="font-mono">
                      {previewSlug(formData.name, formData.appliesTo)}
                    </span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Used for</Label>
                <RadioGroup
                  value={formData.appliesTo}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      appliesTo: v as TagAppliesTo,
                      showToCandidates: v === "job" ? formData.showToCandidates : false,
                    })
                  }
                  disabled={kindLocked}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="job" id="tag-kind-job" />
                    <Label htmlFor="tag-kind-job" className="font-normal">
                      Jobs
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="outside_link" id="tag-kind-link" />
                    <Label htmlFor="tag-kind-link" className="font-normal">
                      Outside links
                    </Label>
                  </div>
                </RadioGroup>
                {kindLocked && (
                  <p className="text-xs text-muted-foreground">
                    In use: remove it from all jobs/links to change
                  </p>
                )}
              </div>
              {formData.appliesTo === "job" && (
                <div className="flex items-start justify-between gap-4 rounded-md border p-3">
                  <div className="space-y-1">
                    <Label htmlFor="tag-visible">Show to candidates</Label>
                    <p className="text-xs text-muted-foreground">
                      When on, candidates see this tag as a filter and as a
                      badge on jobs.
                    </p>
                  </div>
                  <Switch
                    id="tag-visible"
                    checked={formData.showToCandidates}
                    onCheckedChange={(on) =>
                      setFormData({ ...formData, showToCandidates: on })
                    }
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={modalLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.name.trim() || modalLoading}>
                {modalLoading
                  ? "Saving..."
                  : editingItem
                  ? "Update"
                  : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.appliesTo === "job"
                ? (itemToDelete.jobCount ?? 0) > 0
                  ? `Are you sure you want to delete "${itemToDelete.name}"? This removes the tag from ${itemToDelete.jobCount} ${itemToDelete.jobCount === 1 ? "job" : "jobs"}. This action cannot be undone.`
                  : `Are you sure you want to delete "${itemToDelete.name}"? This action cannot be undone.`
                : "Are you sure you want to delete this tag? This action cannot be undone. Note: This will remove the tag from all associated outside links."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  handleDelete(itemToDelete._id);
                  setItemToDelete(null);
                }
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TagsPage;
