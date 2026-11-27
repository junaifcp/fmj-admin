// src/components/admin/recruiters/JobTags.tsx
// Job tags 2.2 (docs/job-tags): tag badges, the Edit tags dialog and the bulk
// Add / Remove tag bar for the admin Jobs page. Only admin sets job tags.
import React, { useEffect, useState } from "react";
import { MAX_JOB_TAGS, useJobTagOptions } from "./jobTagOptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { adminJobsApi } from "@/api/adminJobs";
import type { AdminJobTag } from "@/types/recruiterAdmin";

const HIDDEN_TITLE = "Hidden from candidates";

const TagBadge: React.FC<{ tag: AdminJobTag }> = ({ tag }) => (
  <Badge
    variant="outline"
    className={tag.showToCandidates ? "font-normal" : "font-normal text-muted-foreground border-dashed"}
    title={tag.showToCandidates ? undefined : HIDDEN_TITLE}
  >
    {tag.name}
  </Badge>
);

/** Small outline badges: at most `max`, then "+N". Hidden tags are muted. */
export const JobTagBadges: React.FC<{ tags?: AdminJobTag[]; max?: number }> = ({ tags, max = 2 }) => {
  if (!tags?.length) return <span className="text-muted-foreground">—</span>;
  const shown = tags.slice(0, max);
  const rest = tags.slice(max);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((t) => (
        <TagBadge key={t._id} tag={t} />
      ))}
      {rest.length > 0 && (
        <span className="text-xs text-muted-foreground" title={rest.map((t) => t.name).join(", ")}>
          +{rest.length}
        </span>
      )}
    </div>
  );
};

/** One job's tags: a checkbox list of job tags, Save replaces them. */
export const EditJobTagsDialog: React.FC<{
  open: boolean;
  jobId: string;
  jobTitle: string;
  current: AdminJobTag[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, jobId, jobTitle, current, onClose, onSaved }) => {
  const { tags, loading } = useJobTagOptions(open);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Reset on open (or when the job's own tags change), not on every parent render.
  const currentKey = current.map((t) => t._id).join(",");
  useEffect(() => {
    if (open) setPicked(new Set(currentKey ? currentKey.split(",") : []));
  }, [open, currentKey]);

  const toggle = (id: string, on: boolean) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const save = async () => {
    try {
      setSaving(true);
      // Keep only ids that are still job tags (a deleted one simply drops off).
      const known = new Set(tags.map((t) => t._id));
      await adminJobsApi.setTags(jobId, [...picked].filter((id) => known.has(id)));
      toast.success("Tags saved", { description: "Recorded in the activity log" });
      onSaved();
      onClose();
    } catch (e) {
      toast.error("Couldn't save tags", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  const overCap = picked.size > MAX_JOB_TAGS;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Edit tags</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{jobTitle}</span>. Up to {MAX_JOB_TAGS} tags.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="py-4 text-sm text-muted-foreground">Loading tags…</p>
        ) : tags.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No job tags yet. Create one on Management → Tags with "Used for: Jobs".
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto py-2">
            {tags.map((t) => (
              <label key={t._id} className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={picked.has(t._id)}
                  onCheckedChange={(on) => toggle(t._id, on === true)}
                />
                <span>{t.name}</span>
                {!t.showToCandidates && (
                  <span className="text-xs text-muted-foreground">Hidden from candidates</span>
                )}
              </label>
            ))}
          </div>
        )}
        {overCap && (
          <p className="text-sm text-destructive">A job can have at most {MAX_JOB_TAGS} tags.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || loading || overCap}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type BulkPending = { mode: "add" | "remove"; tag: AdminJobTag };

const plural = (n: number) => `${n} ${n === 1 ? "job" : "jobs"}`;

/** "N selected · Add tag ▾ · Remove tag ▾ · Clear", each change behind a confirm. */
export const BulkTagBar: React.FC<{
  selectedIds: string[];
  tags: AdminJobTag[];
  onClear: () => void;
  onDone: () => void;
}> = ({ selectedIds, tags, onClear, onDone }) => {
  const [pending, setPending] = useState<BulkPending | null>(null);
  const [running, setRunning] = useState(false);
  const n = selectedIds.length;

  const run = async () => {
    if (!pending) return;
    try {
      setRunning(true);
      const add = pending.mode === "add";
      const r = await adminJobsApi.bulkTags({
        jobIds: selectedIds,
        ...(add ? { addTagIds: [pending.tag._id] } : { removeTagIds: [pending.tag._id] }),
      });
      const notes = [
        r.skippedTooMany > 0 ? `${r.skippedTooMany} skipped (${MAX_JOB_TAGS}-tag limit)` : "",
        r.missing > 0 ? `${r.missing} no longer found` : "",
      ].filter(Boolean);
      toast.success(`${add ? "Added to" : "Removed from"} ${plural(r.modified)}`, {
        description: notes.length ? notes.join(" · ") : "Recorded in the activity log",
      });
      setPending(null);
      onClear();
      onDone();
    } catch (e) {
      toast.error("Couldn't update tags", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setRunning(false);
    }
  };

  const menu = (mode: BulkPending["mode"], label: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={tags.length === 0}>
          {label} <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Job tags</DropdownMenuLabel>
        {tags.map((t) => (
          <DropdownMenuItem key={t._id} onSelect={() => setPending({ mode, tag: t })}>
            {t.name}
            {!t.showToCandidates && (
              <span className="ml-2 text-xs text-muted-foreground">hidden</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-background/95 p-2 shadow-sm backdrop-blur">
        <span className="px-1 text-sm font-medium">{n} selected</span>
        {menu("add", "Add tag")}
        {menu("remove", "Remove tag")}
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
        {tags.length === 0 && (
          <span className="text-xs text-muted-foreground">
            No job tags yet. Create one on Management → Tags.
          </span>
        )}
      </div>
      <AlertDialog open={!!pending} onOpenChange={(o) => !o && !running && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.mode === "add"
                ? `Add "${pending.tag.name}" to ${plural(n)}?`
                : `Remove "${pending?.tag.name}" from ${plural(n)}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.mode === "add"
                ? pending.tag.showToCandidates
                  ? "Candidates see this tag on these jobs straight away."
                  : "This tag is hidden from candidates until you switch it on in Tags."
                : "Jobs without the tag are left as they are."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={running}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void run();
              }}
              disabled={running}
            >
              {running ? "Saving…" : pending?.mode === "add" ? "Add tag" : "Remove tag"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
