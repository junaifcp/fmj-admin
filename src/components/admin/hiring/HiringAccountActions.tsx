// src/components/admin/hiring/HiringAccountActions.tsx
// 3-dot actions for a recruiter or employer row: Deactivate / Reactivate and
// Delete (soft delete). Every action asks for a reason; Delete also asks the
// admin to type the account's email.
import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReasonDialog } from "@/components/admin/recruiters/RecruiterBits";
import { recruiterAdminApi } from "@/api/recruiterAdmin";
import { employerAdminApi } from "@/api/employerAdmin";
import { useToast } from "@/hooks/use-toast";

type Kind = "recruiter" | "employer";
type Action = "deactivate" | "reactivate" | "delete";

const api = (kind: Kind) => (kind === "recruiter" ? recruiterAdminApi : employerAdminApi);

export const HiringAccountActions: React.FC<{
  kind: Kind;
  id: string;
  email: string;
  isActive: boolean;
  deletedAt?: string | null;
  /** Called after a successful action (reload the list). */
  onDone: () => void;
}> = ({ kind, id, email, isActive, deletedAt, onDone }) => {
  const { toast } = useToast();
  const [action, setAction] = useState<Action | null>(null);
  const [typedEmail, setTypedEmail] = useState("");

  if (deletedAt) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const open = (a: Action) => {
    setTypedEmail("");
    setAction(a);
  };

  const emailMatches = typedEmail.trim().toLowerCase() === email.trim().toLowerCase();

  const run = async (reason: string) => {
    if (!action) return;
    try {
      if (action === "deactivate") await api(kind).setActive(id, false, reason);
      if (action === "reactivate") await api(kind).setActive(id, true, reason);
      if (action === "delete") await api(kind).remove(id, reason);
      toast({
        title:
          action === "delete"
            ? `${email} deleted`
            : action === "deactivate"
              ? `${email} deactivated`
              : `${email} reactivated`,
        description: "Recorded in the activity log",
      });
      setAction(null);
      onDone();
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const dialogs: Record<
    Action,
    { title: string; description: React.ReactNode; confirm: string; destructive?: boolean; required?: boolean }
  > = {
    deactivate: {
      title: `Deactivate ${kind}`,
      description: `${email} is signed out and can't sign in until reactivated. Their jobs stay as they are.`,
      confirm: "Deactivate",
      destructive: true,
      required: true,
    },
    reactivate: {
      title: `Reactivate ${kind}`,
      description: `${email} can sign in again.`,
      confirm: "Reactivate",
    },
    delete: {
      title: `Delete ${kind}?`,
      description: (
        <>
          <span className="block">
            <span className="font-medium text-foreground">{email}</span> is signed out for good,
            and this email can't sign in or create a new account again. Their open jobs are
            closed.
          </span>
          <span className="block mt-2 font-medium text-destructive">This can't be undone.</span>
        </>
      ),
      confirm: "Delete",
      destructive: true,
      required: true,
    },
  };
  const d = action ? dialogs[action] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${email}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isActive ? (
            <DropdownMenuItem onSelect={() => open("deactivate")}>Deactivate…</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => open("reactivate")}>Reactivate…</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onSelect={() => open("delete")}>
            Delete…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {d && (
        <ReasonDialog
          open={!!action}
          title={d.title}
          description={d.description}
          confirmLabel={d.confirm}
          destructive={d.destructive}
          reasonRequired={d.required}
          confirmDisabled={action === "delete" && !emailMatches}
          onCancel={() => setAction(null)}
          onConfirm={run}
        >
          {action === "delete" && (
            <div className="space-y-2">
              <Label htmlFor={`confirm-delete-${id}`}>
                Type <span className="font-mono">{email}</span> to confirm
              </Label>
              <Input
                id={`confirm-delete-${id}`}
                value={typedEmail}
                onChange={(e) => setTypedEmail(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          )}
        </ReasonDialog>
      )}
    </>
  );
};

export default HiringAccountActions;
