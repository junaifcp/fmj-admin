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
  getJobTitles,
  createJobTitle,
  updateJobTitle,
  verifyJobTitle,
  deleteJobTitle,
  bulkActionJobTitles,
} from "@/api/admin";
import { ManagedJobTitle, PaginationResponse } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";

const JobTitlesPage: React.FC = () => {
  const [data, setData] = useState<PaginationResponse<ManagedJobTitle> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ManagedJobTitle | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const { toast } = useToast();

  const fetchData = useCallback(async (page = 1, searchTerm = "", verified = "") => {
    try {
      setLoading(true);
      const result = await getJobTitles(page, 20, searchTerm, verified);
      console.log("Fetched job titles:", result);
      setData(result);
    } catch (error) {
      toast({
        title: "Failed to fetch job titles",
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
      await verifyJobTitle(id, verified);
      toast({ title: "Job title verification updated" });
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: "Failed to update verification",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: ManagedJobTitle) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJobTitle(id);
      toast({ title: "Job title deleted successfully" });
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: "Failed to delete job title",
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
      await bulkActionJobTitles(ids, action);
      toast({ title: `Bulk ${action} completed successfully` });
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: `Failed to ${action} job titles`,
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
        await updateJobTitle(editingItem._id, formData);
        toast({ title: "Job title updated successfully" });
      } else {
        await createJobTitle(formData);
        toast({ title: "Job title created successfully" });
      }
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: editingItem
          ? "Failed to update job title"
          : "Failed to create job title",
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
      <Card>
        <CardContent>
          <ManagementTable
            title="Job Titles"
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
            extraActions={
              <BulkUploadButton
                onClick={() => setBulkUploadOpen(true)}
                className="mr-2"
              />
            }
          />
        </CardContent>
      </Card>

      <CreateEditModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        item={editingItem}
        title="Job Title"
        loading={modalLoading}
      />

      <BulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        defaultType="job-titles"
        onSuccess={() => fetchData(currentPage, search, verifiedFilter)}
      />
    </div>
  );
};

export default JobTitlesPage;
