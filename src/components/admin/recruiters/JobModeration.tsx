// src/components/admin/recruiters/JobModeration.tsx
// Recruiter admin 7.2: moderation badge, auto-flag chips and the actions menu,
// shared by the Jobs page and the Recruiter Detail Jobs tab.
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminJobsApi } from "@/api/adminJobs";
import type { AdminJobTag, JobModerationStatus } from "@/types/recruiterAdmin";
import { ReasonDialog } from "./RecruiterBits";
import { EditJobTagsDialog } from "./JobTags";
import {
  AUTO_FLAG_LABELS,
  JOB_ACTIONS,
  MODERATION_LABELS,
  QUEUE_FLAGS,
  availableJobActions,
  type ActionKey,
} from "./jobModerationLabels";

export const ModerationBadge: React.FC<{ status: JobModerationStatus }> = ({ status }) => {
  if (status === "none") return null;
  return (
    <Badge variant={status === "removed" ? "destructive" : "secondary"}>
      {MODERATION_LABELS[status]}
    </Badge>
  );
};

export const AutoFlagChips: React.FC<{ flags: string[] }> = ({ flags }) => {
  if (!flags.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {flags.map((f) => (
        <span
          key={f}
          className={`rounded px-1.5 py-0.5 text-[11px] ${
            QUEUE_FLAGS.includes(f as never)
              ? "bg-amber-100 text-amber-900"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {AUTO_FLAG_LABELS[f as keyof typeof AUTO_FLAG_LABELS] ?? f}
        </span>
      ))}
    </div>
  );
};

/**
 * Row menu with every moderation action, each behind a confirm dialog.
 * Job tags 2.2: pass `tags` (the job's tags) to add "Edit tags…"; callers that
 * don't (Recruiter Detail) keep the menu as it was.
 */
export const JobActionsMenu: React.FC<{
  jobId: string;
  jobTitle: string;
  status: string;
  moderationStatus: JobModerationStatus;
  posterStatus?: string | null;
  onDone: () => void;
  triggerLabel?: string;
  tags?: AdminJobTag[];
}> = ({ jobId, jobTitle, status, moderationStatus, posterStatus, onDone, triggerLabel, tags }) => {
  const { toast } = useToast();
  const [pending, setPending] = useState<ActionKey | null>(null);
  const [editingTags, setEditingTags] = useState(false);
  const actions = availableJobActions({ status, moderationStatus, posterStatus });
  const cfg = pending ? JOB_ACTIONS[pending] : null;

  const run = async (reason: string) => {
    if (!pending) return;
    try {
      if (pending === "poster") await adminJobsApi.regeneratePoster(jobId);
      else await adminJobsApi.moderate(jobId, pending, reason);
      toast({ title: JOB_ACTIONS[pending].confirm + " done", description: "Recorded in the activity log" });
      setPending(null);
      onDone();
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={triggerLabel ? "default" : "ghost"}
            size="sm"
            aria-label="Job actions"
            onClick={(e) => e.stopPropagation()}
          >
            {triggerLabel ?? <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {tags && (
            <>
              <DropdownMenuItem onSelect={() => setEditingTags(true)}>Edit tags…</DropdownMenuItem>
              {actions.length > 0 && <DropdownMenuSeparator />}
            </>
          )}
          {actions.map((a, i) => (
            <React.Fragment key={a}>
              {a === "poster" && i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                className={JOB_ACTIONS[a].destructive ? "text-destructive" : undefined}
                onSelect={() => setPending(a)}
              >
                {JOB_ACTIONS[a].label}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {cfg && (
        <ReasonDialog
          open={!!pending}
          title={cfg.title}
          description={
            <>
              <span className="font-medium">{jobTitle}</span>. {cfg.description}
            </>
          }
          confirmLabel={cfg.confirm}
          destructive={cfg.destructive}
          reasonRequired={cfg.reason}
          onCancel={() => setPending(null)}
          onConfirm={run}
        />
      )}
      {tags && (
        <EditJobTagsDialog
          open={editingTags}
          jobId={jobId}
          jobTitle={jobTitle}
          current={tags}
          onClose={() => setEditingTags(false)}
          onSaved={onDone}
        />
      )}
    </>
  );
};
