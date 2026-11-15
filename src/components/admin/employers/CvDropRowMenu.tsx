// Employer admin 8.1: row menu for one CV drop — view the file (audited),
// delete (reason required), open the employer. Used on CV Drops and Employer Detail.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useToast } from "@/hooks/use-toast";
import { cvDropsAdminApi } from "@/api/employerAdmin";
import { ReasonDialog } from "@/components/admin/recruiters/RecruiterBits";
import { PATHS } from "@/routes/paths";

const CvDropRowMenu: React.FC<{
  id: string;
  candidateName: string;
  employerId?: string | null;
  onDeleted: () => void;
}> = ({ id, candidateName, employerId, onDeleted }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [confirmView, setConfirmView] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fail = (title: string, e: unknown) =>
    toast({ title, description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });

  const view = async () => {
    setConfirmView(false);
    try {
      await cvDropsAdminApi.openFile(id);
    } catch (e) {
      fail("Could not open the file", e);
    }
  };

  const remove = async (reason: string) => {
    try {
      await cvDropsAdminApi.remove(id, reason);
      toast({ title: "CV drop deleted", description: "The file and the record were removed" });
      setConfirmDelete(false);
      onDeleted();
    } catch (e) {
      fail("Delete failed", e);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="CV drop actions" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={() => setConfirmView(true)}>View file…</DropdownMenuItem>
          {employerId && (
            <DropdownMenuItem onSelect={() => navigate(`${PATHS.ADMIN.EMPLOYERS_ADMIN.LIST}/${employerId}`)}>
              Open employer
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onSelect={() => setConfirmDelete(true)}>
            Delete…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmView} onOpenChange={setConfirmView}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open {candidateName}'s CV?</AlertDialogTitle>
            <AlertDialogDescription>
              This is a candidate's personal file. Opening it is recorded in the activity log with your name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={view}>Open file</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReasonDialog
        open={confirmDelete}
        title="Delete CV drop"
        description={`Deletes ${candidateName}'s CV file and record for good. Use for spam or when the candidate asks to be removed.`}
        confirmLabel="Delete"
        destructive
        reasonRequired
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </>
  );
};

export default CvDropRowMenu;
