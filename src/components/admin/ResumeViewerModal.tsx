import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";

interface ResumeViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeUrl: string | null;
  title?: string;
}

export const ResumeViewerModal: React.FC<ResumeViewerModalProps> = ({
  open,
  onOpenChange,
  resumeUrl,
  title = "Resume",
}) => {
  const isPdf = resumeUrl?.toLowerCase().endsWith(".pdf");

  const handleOpenInNewTab = () => {
    if (resumeUrl) {
      window.open(resumeUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0 mt-4">
          {!resumeUrl ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No resume uploaded
              </p>
            </div>
          ) : isPdf ? (
            <div className="w-full">
              <div className="mb-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in new tab
                </Button>
              </div>
              <div className="aspect-[8.5/11] bg-muted rounded-lg overflow-hidden">
                <iframe
                  src={resumeUrl}
                  className="w-full h-full border-0"
                  title="Resume Preview"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                In-page preview is available for PDF files only.
              </p>
              <Button onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in new tab
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
