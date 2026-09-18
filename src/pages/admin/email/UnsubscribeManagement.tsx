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
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  RefreshCw,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
} from "lucide-react";
import {
  getUnsubscribedUsers,
  resubscribeUser,
  UnsubscribedUser,
  UnsubscribedUsersResponse,
} from "@/api/admin";
import { useToast } from "@/hooks/use-toast";

const UnsubscribeManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UnsubscribedUser[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [resubscribingIds, setResubscribingIds] = useState<Set<string>>(
    new Set()
  );
  const { toast } = useToast();

  const fetchUnsubscribedUsers = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const result = await getUnsubscribedUsers(
        page,
        pagination.limit,
        searchTerm
      );
      setUsers(result.users);
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      });
    } catch (error) {
      toast({
        title: "Failed to load unsubscribed users",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnsubscribedUsers(1, search);
  }, [search]);

  const handleSearch = () => {
    setSearch(searchInput);
    fetchUnsubscribedUsers(1, searchInput);
  };

  const handleResubscribe = async (userId: string) => {
    if (!window.confirm("Are you sure you want to re-subscribe this user?")) {
      return;
    }

    try {
      setResubscribingIds((prev) => new Set(prev).add(userId));
      await resubscribeUser(userId);
      toast({
        title: "User re-subscribed",
        description:
          "The user has been successfully re-subscribed to marketing emails",
      });
      await fetchUnsubscribedUsers(pagination.page, search);
    } catch (error) {
      toast({
        title: "Failed to re-subscribe user",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setResubscribingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    fetchUnsubscribedUsers(newPage, search);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Unsubscribe Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage users who have unsubscribed from marketing emails
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Unsubscribed Users</CardTitle>
          <CardDescription>
            Search by email, first name, or last name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by email, name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                fetchUnsubscribedUsers(1, "");
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Unsubscribed
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">
              Users who have unsubscribed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Page</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pagination.page} / {pagination.totalPages || 1}
            </div>
            <p className="text-xs text-muted-foreground">
              Showing {users.length} of {pagination.total} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Results Per Page
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.limit}</div>
            <p className="text-xs text-muted-foreground">Items per page</p>
          </CardContent>
        </Card>
      </div>

      {/* Unsubscribed Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Unsubscribed Users</CardTitle>
              <CardDescription>
                List of users who have unsubscribed from marketing emails
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUnsubscribedUsers(pagination.page, search)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Unsubscribed At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          {user.firstName || user.lastName
                            ? `${user.firstName || ""} ${
                                user.lastName || ""
                              }`.trim()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {user.unsubscribedAt
                            ? new Date(user.unsubscribedAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResubscribe(user._id)}
                            disabled={resubscribingIds.has(user._id)}
                          >
                            {resubscribingIds.has(user._id) ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Re-subscribing...
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Re-subscribe
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing page {pagination.page} of {pagination.totalPages} (
                    {pagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={
                        pagination.page >= pagination.totalPages || loading
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {search
                  ? "No unsubscribed users found matching your search"
                  : "No unsubscribed users found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnsubscribeManagement;
