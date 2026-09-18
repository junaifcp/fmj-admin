import React, { useState, useEffect } from "react";
import {
  getRecruiters,
  exportRecruitersCSV,
  updateRecruiterRole,
} from "@/api/admin";
import { AdminRecruiter, PaginationResponse } from "@/types/admin";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Briefcase,
  Shield,
  Crown,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RecruitersPage: React.FC = () => {
  const [recruiters, setRecruiters] =
    useState<PaginationResponse<AdminRecruiter> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecruiters, setSelectedRecruiters] = useState<string[]>([]);

  const { toast } = useToast();

  const fetchRecruiters = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecruiters(page, 20, searchTerm, "", "");
      setRecruiters(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load recruiters"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchRecruiters(1, search);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search]);

  const handleExportCSV = async () => {
    try {
      await exportRecruitersCSV(selectedRecruiters);
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

  const handleRoleChange = async (recruiterId: string, newRole: string) => {
    try {
      await updateRecruiterRole(recruiterId, newRole);
      toast({ title: "Role updated successfully" });
      fetchRecruiters(currentPage, search);
    } catch (error) {
      toast({
        title: "Failed to update role",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "superadmin":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">
          Recruiters Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage recruiter accounts and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Recruiters</CardTitle>
              <CardDescription>
                {recruiters
                  ? `${recruiters.pagination.total} total recruiters`
                  : "Loading recruiters..."}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recruiters..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                onClick={() => fetchRecruiters(currentPage, search)}
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
                disabled={selectedRecruiters.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export ({selectedRecruiters.length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
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
                          selectedRecruiters.length === recruiters?.data.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecruiters(
                              recruiters?.data.map((r) => r._id) || []
                            );
                          } else {
                            setSelectedRecruiters([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Recruiter</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recruiters?.data.map((recruiter) => (
                    <TableRow key={recruiter._id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRecruiters.includes(recruiter._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecruiters([
                                ...selectedRecruiters,
                                recruiter._id,
                              ]);
                            } else {
                              setSelectedRecruiters(
                                selectedRecruiters.filter(
                                  (id) => id !== recruiter._id
                                )
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{recruiter.email}</div>
                          {recruiter.firstName && (
                            <div className="text-sm text-muted-foreground">
                              {recruiter.firstName} {recruiter.lastName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {recruiter.company ? (
                            <>
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {recruiter.company}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              N/A
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(recruiter.role || "recruiter")}
                          <Badge
                            variant={getRoleBadgeVariant(
                              recruiter.role || "recruiter"
                            )}
                          >
                            {recruiter.role || "recruiter"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{recruiter.stats?.totalJobs || 0} total</div>
                          <div className="text-muted-foreground">
                            {recruiter.stats?.activeJobs || 0} active
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {recruiter.createdAt
                          ? new Date(recruiter.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={recruiter.role || "recruiter"}
                          onValueChange={(value) =>
                            handleRoleChange(recruiter._id, value)
                          }
                        >
                          <SelectTrigger className="w-32 ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recruiter">Recruiter</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">
                              Super Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {recruiters && recruiters.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(recruiters.pagination.page - 1) * 20 + 1} to{" "}
                    {Math.min(
                      recruiters.pagination.page * 20,
                      recruiters.pagination.total
                    )}{" "}
                    of {recruiters.pagination.total} recruiters
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage - 1;
                        setCurrentPage(newPage);
                        fetchRecruiters(newPage, search);
                      }}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Page {recruiters.pagination.page} of{" "}
                      {recruiters.pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage + 1;
                        setCurrentPage(newPage);
                        fetchRecruiters(newPage, search);
                      }}
                      disabled={currentPage >= recruiters.pagination.totalPages}
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

export default RecruitersPage;
