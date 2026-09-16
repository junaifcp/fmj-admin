// Companies.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Building,
} from "lucide-react";
import { getCompanies, deleteCompany } from "@/api/recruiter";
import { CompanyForm } from "@/components/recruiter/CompanyForm";
import type { Company } from "@/types/recruiter";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const { trackCompanyCreated, trackCompanyUpdated } = useAnalytics();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const result = await getCompanies(1, 100);
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
    // Track company creation
    trackCompanyCreated({
      companyId: newCompany._id,
      name: newCompany.name,
      industry: newCompany.industry,
    });

    setCompanies((prev) => [newCompany, ...prev]);
    setShowCreateModal(false);
    toast.success("Company created successfully!");
  };

  const handleCompanyUpdated = (updatedCompany: Company) => {
    // Track company update
    const oldCompany = companies.find((c) => c._id === updatedCompany._id);
    const fieldsUpdated: string[] = [];

    if (oldCompany) {
      if (oldCompany.name !== updatedCompany.name) fieldsUpdated.push("name");
      if (oldCompany.industry !== updatedCompany.industry)
        fieldsUpdated.push("industry");
      if (oldCompany.website !== updatedCompany.website)
        fieldsUpdated.push("website");
      if (oldCompany.description !== updatedCompany.description)
        fieldsUpdated.push("description");
    }

    trackCompanyUpdated({
      companyId: updatedCompany._id,
      name: updatedCompany.name,
      fieldsUpdated,
    });

    setCompanies((prev) =>
      prev.map((company) =>
        company._id === updatedCompany._id ? updatedCompany : company
      )
    );
    setEditingCompany(null);
    toast.success("Company updated successfully!");
  };

  const handleDeleteCompany = async (company: Company) => {
    try {
      await deleteCompany(company._id);
      setCompanies((prev) => prev.filter((c) => c._id !== company._id));
      setDeletingCompany(null);
      toast.success("Company deleted successfully!");
    } catch (error) {
      console.error("Failed to delete company:", error);
      toast.error("Failed to delete company");
    }
  };

  const getVerifiedStatusBadge = (status: Company["verified"]) => {
    const variants: Record<
      Company["verified"],
      "default" | "secondary" | "destructive"
    > = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
    };

    const labels: Record<Company["verified"], string> = {
      approved: "Verified",
      pending: "Pending",
      rejected: "Rejected",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Companies</h1>
            <p className="text-muted-foreground">
              Manage your company profiles
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse overflow-hidden">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground hidden sm:block">
            Manage your company profiles and post jobs under different
            organizations
          </p>
        </div>

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>

          <DialogContent
            className="max-h-[90vh] min-h-[48vh] sm:min-h-[64vh] overflow-visible p-4 sm:max-w-[600px] flex flex-col"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
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

      {companies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Companies Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first company profile to start posting jobs and
              managing candidates.
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Company
            </Button>
          </CardContent>
        </Card>
      ) : (
        // NOTE: Use 1 column on small screens, 2 columns on md+ (keeps 2 per row on large screens)
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companies.map((company) => (
            // ensure content can't escape the card
            <Card
              key={company._id}
              className="hover:shadow-lg transition-shadow overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-10 h-10 rounded-lg object-cover bg-muted flex-shrink-0"
                        style={{ maxWidth: 40, maxHeight: 40 }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Building className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 overflow-hidden">
                      {/* truncate + accessible tooltip (title) for long names */}
                      <CardTitle
                        className="text-lg truncate"
                        title={company.name}
                      >
                        {company.name}
                      </CardTitle>

                      <div className="flex items-center gap-2 mt-1">
                        {getVerifiedStatusBadge(company.verified)}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingCompany(company)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {company.website && (
                          <DropdownMenuItem asChild>
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit Website
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeletingCompany(company)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {company.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3 overflow-hidden break-words">
                    {company.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {company.industry && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Industry:</span>
                      <span className="text-muted-foreground truncate">
                        {company.industry}
                      </span>
                    </div>
                  )}
                  {company.size && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Size:</span>
                      <span className="text-muted-foreground truncate">
                        {company.size.charAt(0).toUpperCase() +
                          company.size.slice(1)}
                      </span>
                    </div>
                  )}
                  {company.location && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Location:</span>
                      <span className="text-muted-foreground truncate">
                        {typeof company.location === "string"
                          ? company.location
                          : company.location?.formattedAddress}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <div className="text-xs text-muted-foreground truncate overflow-hidden">
                  Created {new Date(company.createdAt).toLocaleDateString()}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Company Modal */}
      {editingCompany && (
        <Dialog open={true} onOpenChange={() => setEditingCompany(null)}>
          <DialogContent
            className="max-h-[90vh] min-h-[56vh] overflow-visible p-4 sm:max-w-[600px]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
              <DialogDescription>
                Update your company information.
              </DialogDescription>
            </DialogHeader>
            <CompanyForm
              company={editingCompany}
              onSubmit={handleCompanyUpdated}
              onCancel={() => setEditingCompany(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deletingCompany && (
        <AlertDialog open={true} onOpenChange={() => setDeletingCompany(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                company "{deletingCompany.name}" and all associated jobs.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteCompany(deletingCompany)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Company
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Companies;
