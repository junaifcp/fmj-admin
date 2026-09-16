import React, { useState, useEffect } from "react";
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
  getSkills,
  createSkill,
  updateSkill,
  verifySkill,
  deleteSkill,
  bulkActionSkills,
} from "@/api/admin";
import { ManagedSkill, PaginationResponse } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";

const SkillsPage: React.FC = () => {
  const [data, setData] = useState<PaginationResponse<ManagedSkill> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ManagedSkill | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const { toast } = useToast();

  const fetchData = async (page = 1, searchTerm = "", verified = "") => {
    try {
      setLoading(true);
      const result = await getSkills(page, 20, searchTerm, verified);
      setData(result);
    } catch (error) {
      toast({
        title: "Failed to fetch skills",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData(1, search, verifiedFilter);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, verifiedFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page, search, verifiedFilter);
  };

  const handleVerifyToggle = async (
    id: string,
    verified: "verified" | "pending" | "rejected"
  ) => {
    try {
      await verifySkill(id, verified);
      toast({ title: "Skill verification updated" });
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: "Failed to update verification",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: ManagedSkill) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSkill(id);
      toast({ title: "Skill deleted successfully" });
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: "Failed to delete skill",
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
      await bulkActionSkills(ids, action);
      toast({ title: `Bulk ${action} completed successfully` });
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: `Failed to ${action} skills`,
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
        await updateSkill(editingItem._id, formData);
        toast({ title: "Skill updated successfully" });
      } else {
        await createSkill(formData);
        toast({ title: "Skill created successfully" });
      }
      fetchData(currentPage, search, verifiedFilter);
    } catch (error) {
      toast({
        title: editingItem
          ? "Failed to update skill"
          : "Failed to create skill",
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
            Skills Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage skills used in recruiter job postings and candidate profiles
          </p>
        </div>
        {/* <BulkUploadButton onClick={() => setBulkUploadOpen(true)} /> */}
      </div>

      <Card>
        <CardContent>
          <ManagementTable
            title="Skills"
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
        title="Skill"
        loading={modalLoading}
      />

      <BulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        defaultType="skills"
        onSuccess={() => fetchData(currentPage, search, verifiedFilter)}
      />
    </div>
  );
};

export default SkillsPage;
