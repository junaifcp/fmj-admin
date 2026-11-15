// src/components/admin/recruiters/DeskActions.tsx
// Recruiter admin 8.1/8.2: job desk and employer-invite row actions, shared by
// the Job Desk, Employer Invites and Recruiter Detail pages.
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Search } from "lucide-react";
import RecordPaymentDialog from "@/components/admin/employers/RecordPaymentDialog";
import { useToast } from "@/hooks/use-toast";
import { recruiterAdminApi } from "@/api/recruiterAdmin";
import { employerInvitesApi, jobDeskApi } from "@/api/hiringDeskAdmin";
import type { FulfillmentPlan, RecruiterListRow } from "@/types/recruiterAdmin";
import { ReasonDialog } from "./RecruiterBits";
import { personName } from "./recruiterFormat";
import { PLAN_LABELS, RESENDABLE_INVITES } from "./deskLabels";

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Unknown error");

/** Search active recruiters; calls onPick with the chosen one. */
const RecruiterPicker: React.FC<{
  value: RecruiterListRow | null;
  onPick: (r: RecruiterListRow) => void;
  excludeId?: string | null;
}> = ({ value, onPick, excludeId }) => {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<RecruiterListRow[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      recruiterAdminApi
        .list(1, 8, { search: q.trim() || undefined, status: "active", sortBy: "lastActive", sortOrder: "desc" }, { signal: ctrl.signal })
        .then((r) => setRows(r.data.filter((x) => x._id !== excludeId)))
        .catch(() => {
          if (!ctrl.signal.aborted) setRows([]);
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, excludeId]);
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Search active recruiters"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10"
        />
      </div>
      <ul className="max-h-56 overflow-y-auto rounded border divide-y">
        {loading && rows.length === 0 && <li className="p-3 text-sm text-muted-foreground">Searching…</li>}
        {!loading && rows.length === 0 && <li className="p-3 text-sm text-muted-foreground">No active recruiters found</li>}
        {rows.map((r) => (
          <li key={r._id}>
            <button
              type="button"
              onClick={() => onPick(r)}
              className={`w-full text-left p-3 text-sm hover:bg-muted ${value?._id === r._id ? "bg-muted" : ""}`}
            >
              <div className="font-medium">{personName(r)}</div>
              <div className="text-xs text-muted-foreground">
                {r.email}
                {r.company ? ` · ${r.company}` : ""} · {r.stats.activeJobs} active jobs
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Row menu for one employer job on the desk. */
export const DeskJobActionsMenu: React.FC<{
  jobId: string;
  jobTitle: string;
  assignedRecruiterId?: string | null;
  plan: FulfillmentPlan;
  closed?: boolean;
  removed?: boolean;
  onDone: () => void;
}> = ({ jobId, jobTitle, assignedRecruiterId, plan, closed, removed, onDone }) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"assign" | "unassign" | "plan" | null>(null);
  const [picked, setPicked] = useState<RecruiterListRow | null>(null);
  const [reason, setReason] = useState("");
  const [newPlan, setNewPlan] = useState<FulfillmentPlan>(plan);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  const open = (m: "assign" | "unassign" | "plan") => {
    setPicked(null);
    setReason("");
    setNewPlan(plan);
    setMode(m);
  };

  const finish = (title: string) => {
    toast({ title, description: "Recorded in the activity log" });
    setMode(null);
    onDone();
  };

  const submit = async () => {
    try {
      setSaving(true);
      if (mode === "assign" && picked) {
        await jobDeskApi.assign(jobId, picked._id, reason.trim());
        finish(`Assigned to ${personName(picked)}`);
      } else if (mode === "plan") {
        await jobDeskApi.setPlan(jobId, newPlan, reason.trim());
        finish(`Plan set to ${PLAN_LABELS[newPlan]}`);
      }
    } catch (e) {
      toast({ title: "Action failed", description: errMsg(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const canAssign = !closed && !removed;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Job desk actions" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {canAssign && (
            <DropdownMenuItem onSelect={() => open("assign")}>
              {assignedRecruiterId ? "Reassign…" : "Assign to recruiter…"}
            </DropdownMenuItem>
          )}
          {assignedRecruiterId && (
            <DropdownMenuItem className="text-destructive" onSelect={() => open("unassign")}>
              Unassign…
            </DropdownMenuItem>
          )}
          {(canAssign || assignedRecruiterId) && <DropdownMenuSeparator />}
          <DropdownMenuItem onSelect={() => open("plan")}>Set plan…</DropdownMenuItem>
          {/* Employer admin 10.2: log a payment made outside the app (also sets the plan). */}
          <DropdownMenuItem onSelect={() => setPaying(true)}>Record payment…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RecordPaymentDialog
        open={paying}
        onOpenChange={setPaying}
        job={{ _id: jobId, title: jobTitle }}
        plan={plan === "free" ? "smart_hire" : plan}
        onRecorded={onDone}
      />

      <Dialog open={mode === "assign" || mode === "plan"} onOpenChange={(o) => !o && !saving && setMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "plan" ? "Set fulfilment plan" : assignedRecruiterId ? "Reassign job" : "Assign job"}</DialogTitle>
            <DialogDescription>
              <span className="font-medium">{jobTitle}</span>.{" "}
              {mode === "plan"
                ? "A label only; nothing is charged."
                : assignedRecruiterId
                  ? "The current recruiter loses this job and its applicants. No one is notified."
                  : "The recruiter sees it under My employer jobs. No one is notified."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {mode === "assign" ? (
              <RecruiterPicker value={picked} onPick={setPicked} excludeId={assignedRecruiterId} />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Select value={newPlan} onValueChange={(v) => setNewPlan(v as FulfillmentPlan)}>
                  <SelectTrigger id="plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PLAN_LABELS) as FulfillmentPlan[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {PLAN_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="desk-reason">Reason (optional)</Label>
              <Textarea
                id="desk-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Recorded in the activity log"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode(null)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={saving || (mode === "assign" ? !picked : newPlan === plan)}
            >
              {saving ? "Saving…" : mode === "plan" ? "Save plan" : picked ? `Assign to ${personName(picked)}` : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReasonDialog
        open={mode === "unassign"}
        title="Unassign job"
        description={
          <>
            <span className="font-medium">{jobTitle}</span> goes back to the open pool. The recruiter loses access
            to its applicants.
          </>
        }
        confirmLabel="Unassign"
        destructive
        reasonRequired
        onCancel={() => setMode(null)}
        onConfirm={async (why) => {
          try {
            await jobDeskApi.unassign(jobId, why);
            finish("Job is back in the open pool");
          } catch (e) {
            toast({ title: "Action failed", description: errMsg(e), variant: "destructive" });
          }
        }}
      />
    </>
  );
};

/** Row menu for one employer invite. */
export const InviteActionsMenu: React.FC<{
  inviteId: string;
  email: string;
  status: string;
  onDone: () => void;
}> = ({ inviteId, email, status, onDone }) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"resend" | "revoke" | null>(null);
  const canResend = RESENDABLE_INVITES.includes(status);
  const canRevoke = status !== "revoked";
  if (!canResend && !canRevoke) return null;

  const run = async (why: string) => {
    try {
      if (mode === "resend") await employerInvitesApi.resend(inviteId, why);
      if (mode === "revoke") await employerInvitesApi.revoke(inviteId, why);
      toast({
        title: mode === "resend" ? "Invite sent again" : "Invite revoked",
        description: "Recorded in the activity log",
      });
      setMode(null);
      onDone();
    } catch (e) {
      toast({ title: "Action failed", description: errMsg(e), variant: "destructive" });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Invite actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canResend && <DropdownMenuItem onSelect={() => setMode("resend")}>Resend…</DropdownMenuItem>}
          {canRevoke && (
            <DropdownMenuItem className="text-destructive" onSelect={() => setMode("revoke")}>
              Revoke…
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ReasonDialog
        open={!!mode}
        title={mode === "resend" ? "Resend invite" : "Revoke invite"}
        description={
          mode === "resend"
            ? `Sends ${email} one new email (and WhatsApp if they agreed), exactly as the recruiter would. The link works for 14 more days.`
            : `${email} loses access to this job's applications. The invite link stops working.`
        }
        confirmLabel={mode === "resend" ? "Resend" : "Revoke"}
        destructive={mode === "revoke"}
        reasonRequired={mode === "revoke"}
        onCancel={() => setMode(null)}
        onConfirm={run}
      />
    </>
  );
};
