import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Edit,
  Copy,
  Pause,
  Play,
  XCircle,
  TrendingUp,
  Users,
  Share2,
  Download,
  Printer,
  MoreHorizontal,
  Link,
} from "lucide-react";
import type { Job } from "@/types/recruiter";
import type { JobAction } from "@/types/jobInsights";

interface JobActionsToolbarProps {
  job: Job;
  onAction: (action: JobAction) => Promise<void>;
  isExecuting?: boolean;
  canEdit?: boolean;
  canManage?: boolean;
}

export const JobActionsToolbar = ({
  job,
  onAction,
  isExecuting = false,
  canEdit = true,
  canManage = true,
}: JobActionsToolbarProps) => {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    destructive?: boolean;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: () => {},
  });

  const { toast } = useToast();

  const handleAction = async (action: JobAction["action"], params?: any) => {
    try {
      await onAction({ action, params });
    } catch (error) {
      console.error(`Failed to ${action} job:`, error);
    }
  };

  const confirmAction = (
    title: string,
    description: string,
    action: () => void,
    destructive = false
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      action,
      destructive,
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/jobs/${job._id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Job URL has been copied to clipboard",
    });
  };

  const handleExport = () => {
    // This would trigger an export action
    toast({
      title: "Export started",
      description: "Your candidate data export will be ready shortly",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const isPaused = job.status === "paused";
  const isClosed = job.status === "closed";

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary Actions */}
        {canEdit && (
          <Button variant="default" disabled={isExecuting}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Job
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => handleAction("duplicate")}
          disabled={isExecuting}
        >
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </Button>

        {canManage && (
          <>
            {!isClosed && (
              <Button
                variant={isPaused ? "default" : "outline"}
                onClick={() =>
                  confirmAction(
                    isPaused ? "Resume Job" : "Pause Job",
                    isPaused
                      ? "This will make the job visible to candidates again."
                      : "This will temporarily hide the job from candidates.",
                    () => handleAction(isPaused ? "resume" : "pause")
                  )
                }
                disabled={isExecuting}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
            )}

            {!isClosed && (
              <Button
                variant="outline"
                onClick={() =>
                  confirmAction(
                    "Close Job",
                    "This will permanently close the job. No new applications will be accepted.",
                    () => handleAction("close"),
                    true
                  )
                }
                disabled={isExecuting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Close Job
              </Button>
            )}

            {isClosed && (
              <Button
                variant="outline"
                onClick={() => handleAction("reopen")}
                disabled={isExecuting}
              >
                <Play className="h-4 w-4 mr-2" />
                Reopen
              </Button>
            )}
          </>
        )}

        {/* <Button 
          variant="outline"
          onClick={() => handleAction("promote")}
          disabled={isExecuting}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Promote
        </Button> */}

        <Button variant="outline">
          <Users className="h-4 w-4 mr-2" />
          View Applicants
        </Button>

        {/* Secondary Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Job
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <Link className="h-4 w-4 mr-2" />
              Copy Job URL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Applicants CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
              }
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.destructive ? "destructive" : "default"}
              onClick={() => {
                confirmDialog.action();
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
