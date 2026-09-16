import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Plus,
  ExternalLink,
  Eye,
} from "lucide-react";
import { CreateEditOutsideLinkModal } from "@/components/admin/CreateEditOutsideLinkModal";
import {
  getOutsideLinks,
  createOutsideLink,
  updateOutsideLink,
  deleteOutsideLink,
  getOutsideLinkStats,
} from "@/api/admin";
import { OutsideLink, PaginationResponse, OutsideLinkClickStats } from "@/types/admin";
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
import { apiBaseUrl } from "@/config/env";

const OutsideLinksPage: React.FC = () => {
  const [data, setData] = useState<PaginationResponse<OutsideLink> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OutsideLink | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedLinkForStats, setSelectedLinkForStats] =
    useState<OutsideLink | null>(null);
  const [statsData, setStatsData] = useState<OutsideLinkClickStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = useCallback(
    async (page = 1, searchTerm = "", active?: boolean) => {
      try {
        setLoading(true);
        const result = await getOutsideLinks(page, 20, searchTerm, active);
        setData(result);
      } catch (error) {
        toast({
          title: "Failed to fetch outside links",
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
      fetchData(1, search, isActiveFilter);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, isActiveFilter, fetchData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page, search, isActiveFilter);
  };

  const handleEdit = (item: OutsideLink) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOutsideLink(id);
      toast({ title: "Outside link deleted successfully" });
      fetchData(currentPage, search, isActiveFilter);
    } catch (error) {
      toast({
        title: "Failed to delete outside link",
        description:
          error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleModalSubmit = async (
    formData: {
      title: string;
      description?: string;
      outsideLink: string;
      bannerImage?: string;
      isActive?: boolean;
      tags?: string[];
    },
    bannerFile?: File
  ) => {
    try {
      setModalLoading(true);
      if (editingItem) {
        await updateOutsideLink(editingItem._id, formData, bannerFile);
        toast({ title: "Outside link updated successfully" });
      } else {
        await createOutsideLink(formData, bannerFile);
        toast({ title: "Outside link created successfully" });
      }
      fetchData(currentPage, search, isActiveFilter);
    } catch (error) {
      toast({
        title: editingItem
          ? "Failed to update outside link"
          : "Failed to create outside link",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleViewStats = async (item: OutsideLink) => {
    setSelectedLinkForStats(item);
    setStatsDialogOpen(true);
    setStatsLoading(true);
    try {
      const stats = await getOutsideLinkStats(item._id);
      setStatsData(stats);
    } catch (error) {
      toast({
        title: "Failed to load stats",
        description:
          error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const getBannerUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${apiBaseUrl}${url}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">
            Outside Links Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage external career page links with click tracking
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Link
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outside Links</CardTitle>
          <CardDescription>
            Manage links to external career pages and track clicks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <select
                value={isActiveFilter === undefined ? "all" : isActiveFilter.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  setIsActiveFilter(
                    value === "all" ? undefined : value === "true"
                  );
                }}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchData(currentPage, search, isActiveFilter)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : !data || data.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No outside links found
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Banner</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.data.map((item) => {
                        const bannerUrl = getBannerUrl(item.bannerImage);
                        return (
                          <TableRow
                            key={item._id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() =>
                              navigate(
                                `/admin/management/outside-links/${item._id}/submissions`
                              )
                            }
                          >
                            <TableCell>
                              {bannerUrl ? (
                                <img
                                  src={bannerUrl}
                                  alt={item.title}
                                  className="w-20 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-20 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                  No Image
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.title}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {item.description || "-"}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <a
                                href={item.outsideLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Link
                              </a>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={item.isActive ? "default" : "secondary"}
                              >
                                {item.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.clickCount || 0}</TableCell>
                            <TableCell>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/admin/management/outside-links/${item._id}/submissions`
                                  );
                                }}
                                className="text-blue-600 hover:underline font-medium"
                              >
                                {item.submissionCount ?? 0}
                              </button>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewStats(item)}
                                  title="View Stats"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
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
                        );
                      })}
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

      <CreateEditOutsideLinkModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        item={editingItem}
        loading={modalLoading}
      />

      {/* Stats Dialog */}
      <AlertDialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Click Statistics - {selectedLinkForStats?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              View click tracking statistics for this outside link
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            {statsLoading ? (
              <div className="text-center py-8">Loading stats...</div>
            ) : statsData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Clicks</div>
                    <div className="text-2xl font-bold">{statsData.totalClicks}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Unique Clicks</div>
                    <div className="text-2xl font-bold">{statsData.uniqueClicks}</div>
                  </div>
                </div>
                {statsData.clicksByDate && statsData.clicksByDate.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Clicks by Date (Last 30 Days)</h4>
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Clicks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statsData.clicksByDate.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.date}</TableCell>
                              <TableCell>{item.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No statistics available
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Outside Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this outside link? This action
              cannot be undone.
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

export default OutsideLinksPage;
