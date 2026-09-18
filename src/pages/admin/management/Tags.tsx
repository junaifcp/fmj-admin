import React, { useState, useEffect, useCallback } from "react";
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
import { Tag, PaginationResponse } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";
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

const TagsPage: React.FC = () => {
  const [data, setData] = useState<PaginationResponse<Tag> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Tag | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  const { toast } = useToast();

  const fetchData = useCallback(
    async (page = 1, searchTerm = "") => {
      try {
        setLoading(true);
        const result = await getTags(page, 20, searchTerm);
        setData(result);
      } catch (error) {
        toast({
          title: "Failed to fetch tags",
          description:
            error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
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

  const handleEdit = (item: Tag) => {
    setEditingItem(item);
    setFormData({ name: item.name });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTag(id);
      toast({ title: "Tag deleted successfully" });
      fetchData(currentPage, search);
    } catch (error) {
      toast({
        title: "Failed to delete tag",
        description:
          error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
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
      if (editingItem) {
        await updateTag(editingItem._id, { name: formData.name.trim() });
        toast({ title: "Tag updated successfully" });
      } else {
        await createTag({ name: formData.name.trim() });
        toast({ title: "Tag created successfully" });
      }
      fetchData(currentPage, search);
      handleCloseModal();
    } catch (error) {
      toast({
        title: editingItem
          ? "Failed to update tag"
          : "Failed to create tag",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormData({ name: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">
            Tags Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage tags for outside links (used for Google Tag Manager)
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tag
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>
            Create and manage tags for categorizing outside links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
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
                                  setItemToDelete(item._id);
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
                ? "Update the tag name. The slug will be regenerated automatically."
                : "Create a new tag. A slug will be generated automatically from the name."}
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
                      {formData.name
                        .toLowerCase()
                        .trim()
                        .replace(/[\s]+/g, "_")
                        .replace(/[^a-z0-9_]/g, "")
                        .replace(/_+/g, "_")
                        .replace(/^_+|_+$/g, "") || "tag_slug"}
                    </span>
                  </p>
                )}
              </div>
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
              Are you sure you want to delete this tag? This action cannot be
              undone. Note: This will remove the tag from all associated outside links.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  handleDelete(itemToDelete);
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
