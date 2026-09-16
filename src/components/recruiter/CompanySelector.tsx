import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { getCompanies } from "@/api/recruiter";
import { CompanyForm } from "./CompanyForm";
import type { Company } from "@/types/recruiter";
import { toast } from "sonner";

interface CompanySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const result = await getCompanies(1, 100); // Get all companies for selector
      setCompanies(result.data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCompanyCreated = (newCompany: Company) => {
    setCompanies((prev) => [newCompany, ...prev]);
    onValueChange(newCompany._id);
    setShowCreateModal(false);
    toast.success("Company created successfully!");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled || loading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue
              placeholder={
                loading ? "Loading companies..." : "Select a company"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company._id} value={company._id}>
                <div className="flex items-center gap-2">
                  {company.logo && (
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-4 h-4 rounded object-cover"
                    />
                  )}
                  <span>{company.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({company.verified === "approved" ? "✓" : company.verified})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
              <DialogDescription>
                Add a new company to your profile to post jobs under.
              </DialogDescription>
            </DialogHeader>
            <CompanyForm
              onSubmit={handleCompanyCreated}
              onCancel={() => setShowCreateModal(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">
          No companies found. Create your first company to start posting jobs.
        </p>
      )}
    </div>
  );
};
