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
import { Search, RefreshCw, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getCertificates, getCertificate } from "@/api/admin";
import { Certificate, PaginationResponse } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";
import CreateCertificateModal from "@/components/admin/CreateCertificateModal";
import CertificateDetailModal from "@/components/admin/CertificateDetailModal";

const CertificatesPage: React.FC = () => {
  const [data, setData] = useState<PaginationResponse<Certificate> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(
    async (page = 1, searchTerm = "") => {
      try {
        setLoading(true);
        const result = await getCertificates(page, 20, searchTerm);
        setData(result);
      } catch (error) {
        toast({
          title: "Failed to fetch certificates",
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

  const handleRowClick = async (cert: Certificate) => {
    try {
      const full = await getCertificate(cert._id);
      setSelectedCertificate(full);
      setDetailModalOpen(true);
    } catch (error) {
      toast({
        title: "Failed to load certificate",
        description:
          error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    fetchData(currentPage, search);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">
            Certificates
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage course completion certificates
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Certificate
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificates</CardTitle>
          <CardDescription>
            Click a row to view certificate details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, course, or serial number..."
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

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : !data || data.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No certificates found
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.data.map((item) => (
                        <TableRow
                          key={item._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(item)}
                        >
                          <TableCell className="font-medium">
                            {item.studentName}
                          </TableCell>
                          <TableCell>{item.course}</TableCell>
                          <TableCell>{item.batch}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.serialNumber}
                          </TableCell>
                          <TableCell>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

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

      <CreateCertificateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <CertificateDetailModal
        certificate={selectedCertificate}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
};

export default CertificatesPage;
