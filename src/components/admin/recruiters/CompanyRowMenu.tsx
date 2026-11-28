// Admin Companies (Hiring → Companies): the row's action menu. Review opens
// the review drawer (as the old button did); Download CV drop saves the
// company's CV drop print poster (its employer's QR to the candidate app).
// Toasts use sonner: it is the only toaster mounted in fmj-admin.
import React, { useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck, Loader2, MoreHorizontal, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCompanyCvDropPoster } from "./downloadCompanyCvDropPoster";

const GENERIC_ERROR = "Could not create the poster. Try again.";

/** The server's reason for a 404 (no employer, unknown company); otherwise a generic line. */
function failureMessage(e: unknown): string {
  const err = e as { status?: number; message?: string };
  return err?.status === 404 && err.message ? err.message : GENERIC_ERROR;
}

const CompanyRowMenu: React.FC<{
  companyId: string;
  companyName: string;
  onReview: () => void;
}> = ({ companyId, companyName, onReview }) => {
  const [preparing, setPreparing] = useState(false);

  const download = async () => {
    setPreparing(true);
    try {
      const drop = await downloadCompanyCvDropPoster(companyId);
      const notes = [
        drop.created ? "A CV drop code was created for this company." : null,
        drop.enabled ? null : "Note: the employer's CV drop link is off.",
        drop.suspended ? "Note: the employer is suspended, so the link won't open." : null,
      ].filter(Boolean);
      toast.success("CV drop poster downloaded", notes.length ? { description: notes.join(" ") } : undefined);
    } catch (e) {
      toast.error(failureMessage(e));
    } finally {
      setPreparing(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${companyName}`} disabled={preparing}>
          {preparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={onReview}>
          <ClipboardCheck className="mr-2 h-4 w-4" />
          Review
        </DropdownMenuItem>
        <DropdownMenuItem disabled={preparing} onSelect={() => void download()}>
          <QrCode className="mr-2 h-4 w-4" />
          Download CV drop
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CompanyRowMenu;
