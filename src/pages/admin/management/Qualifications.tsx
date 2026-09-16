import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ManagementTable } from "@/components/admin/ManagementTable";
import { CreateEditModal } from "@/components/admin/CreateEditModal";
import BulkUploadButton from "@/components/admin/BulkUploadButton";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import {
  getQualifications,
  createQualification,
  updateQualification,
  verifyQualification,
  deleteQualification,
  bulkActionQualifications,
} from "@/api/admin";
import { ManagedQualification, PaginationResponse } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";

const QualificationsPage: React.FC = () => {
  const [data, setData] =
    useState<PaginationResponse<ManagedQualification> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ManagedQualification | null>(
    null
  );
  const [modalLoading, setModalLoading] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const { toast } = useToast();

  const fetchData = useCallback(async (page = 1, searchTerm = "", verified = "") => {
    try {
      setLoading(true);
      const result = await getQualifications(page, 20, searchTerm, verified);
      setData(result);
    } catch (error) {
      toast({
        title: "Failed to fetch qualifications",
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
      await verifyQualification(id, verified);
      toast({ title: "Qualification verification updated" });
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: "Failed to update verification",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: ManagedQualification) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQualification(id);
      toast({ title: "Qualification deleted successfully" });
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: "Failed to delete qualification",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (
    ids: string[],
    action: "verify" | "unverify" | "delete"
  ) => {
    try {
      await bulkActionQualifications(ids, action);
      toast({ title: `Bulk ${action} completed successfully` });
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: `Failed to ${action} qualifications`,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleModalSubmit = async (formData: {
    name: string;
    notes?: string;
  }) => {
    try {
      setModalLoading(true);
      if (editingItem) {
        await updateQualification(editingItem._id, formData);
        toast({ title: "Qualification updated successfully" });
      } else {
        await createQualification(formData);
        toast({ title: "Qualification created successfully" });
      }
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: editingItem
          ? "Failed to update qualification"
          : "Failed to create qualification",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">
            Qualifications Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage qualifications used in recruiter job requirements
          </p>
        </div>
        <BulkUploadButton onClick={() => setBulkUploadOpen(true)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Qualifications</CardTitle>
          <CardDescription>
            Authoritative list of qualifications that recruiters can use when
            posting jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManagementTable
            title="Qualifications"
            data={data}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            onRefresh={() => fetchData(currentPage, search, verifiedFilter)}
            onPageChange={handlePageChange}
            currentPage={currentPage}
            onVerifyToggle={handleVerifyToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBulkAction={handleBulkAction}
            onCreate={() => setModalOpen(true)}
            verifiedFilter={verifiedFilter}
            onVerifiedFilterChange={setVerifiedFilter}
          />
        </CardContent>
      </Card>

      <CreateEditModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        item={editingItem}
        title="Qualification"
        loading={modalLoading}
      />

      <BulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        defaultType="qualifications"
        onSuccess={() => fetchData(currentPage, search, verifiedFilter)}
      />
    </div>
  );
};

export default QualificationsPage;
