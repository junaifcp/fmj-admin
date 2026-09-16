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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Building,
  Filter,
} from "lucide-react";
import { getManagementCompanies, verifyCompany } from "@/api/company";
import { ManagedCompany, PaginationResponse } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";

const CompaniesPage: React.FC = () => {
  const [data, setData] = useState<PaginationResponse<ManagedCompany> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { toast } = useToast();

  const fetchData = useCallback(async (page = 1, searchTerm = "", verified = "") => {
    try {
      setLoading(true);
      const result = await getManagementCompanies(
        page,
        20,
        searchTerm,
        verified
      );
      console.log("result getManagementCompanies>>>>>>>", result);
      setData(result);
    } catch (error) {
      toast({
        title: "Failed to fetch companies",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData(1, search, verifiedFilter);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, verifiedFilter, fetchData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page, search, verifiedFilter);
  };

  const handleVerifyToggle = async (
    id: string,
    verified: "verified" | "pending" | "rejected"
  ) => {
    try {
      await verifyCompany(id, verified);
      toast({ title: "Company verification updated" });
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: "Failed to update verification",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getVerificationBadgeVariant = (verified: string) => {
    switch (verified) {
      case "verified":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(data?.data.map((item) => item._id) || []);
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter((selectedId) => selectedId !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">
          Companies Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage companies created by recruiters and their verification status
        </p>
      </div>

      <Card>
        <CardContent>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Companies</h2>
                <p className="text-muted-foreground">
                  {data
                    ? `${data.pagination.total} total companies`
                    : "Loading..."}
                </p>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => fetchData(currentPage, search, verifiedFilter)}
                size="sm"
                variant="outline"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedItems.length === data?.data.length &&
                          data?.data.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((company) => (
                    <TableRow key={company._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(company._id)}
                          onCheckedChange={(checked) =>
                            handleSelectItem(company._id, !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{company.name}</div>
                            {company.notes && (
                              <div className="text-sm text-muted-foreground">
                                {company.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {company.location?.formattedAddress ||
                          company.location?.city ||
                          "Not specified"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {company.industry || "Not specified"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {company.ownerName || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {company.ownerEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={company.verified === "verified"}
                            onCheckedChange={(checked) =>
                              handleVerifyToggle(
                                company._id,
                                checked ? "verified" : "pending"
                              )
                            }
                          />
                          <Badge
                            variant={getVerificationBadgeVariant(
                              company.verified
                            )}
                          >
                            {company.verified}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Link to company details or profile
                            window.open(
                              `/recruiter/companies/${company._id}`,
                              "_blank"
                            );
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  {(data.pagination.page - 1) * data.pagination.limit + 1} to{" "}
                  {Math.min(
                    data.pagination.page * data.pagination.limit,
                    data.pagination.total
                  )}{" "}
                  of {data.pagination.total} companies
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </div>
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
    </div>
  );
};

export default CompaniesPage;
