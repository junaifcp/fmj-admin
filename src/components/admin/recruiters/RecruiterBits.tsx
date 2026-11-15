// src/components/admin/recruiters/RecruiterBits.tsx
// Recruiter admin 5.2: small shared pieces for the recruiter list and detail pages.
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { CompanyVerification } from "@/types/recruiterAdmin";
import { MIN_REASON } from "./recruiterFormat";

export const CompanyVerificationBadge: React.FC<{ value?: CompanyVerification | null }> = ({
  value,
}) => {
  if (!value) return <span className="text-xs text-muted-foreground">No company</span>;
  const variant = value === "verified" ? "default" : value === "rejected" ? "destructive" : "secondary";
  const label = value === "verified" ? "Verified" : value === "rejected" ? "Rejected" : "Pending";
  return <Badge variant={variant}>{label}</Badge>;
};

export const RecruiterStatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) =>
  isActive ? (
    <Badge variant="outline" className="border-success/30 text-success">
      Active
    </Badge>
  ) : (
    <Badge variant="destructive">Suspended</Badge>
  );

/**
 * Confirm dialog with a reason box. `reasonRequired` disables confirm until the
 * reason has MIN_REASON characters (locked decisions, "Every admin write").
 */
export const ReasonDialog: React.FC<{
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  reasonRequired?: boolean;
  children?: React.ReactNode;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
}> = ({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  reasonRequired,
  children,
  confirmDisabled,
  onCancel,
  onConfirm,
}) => {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) setReason("");
  }, [open]);
  const tooShort = reasonRequired && reason.trim().length < MIN_REASON;
  const submit = async () => {
    setSaving(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {children}
          <div className="space-y-2">
            <Label htmlFor="action-reason">
              Reason{reasonRequired ? "" : " (optional)"}
            </Label>
            <Textarea
              id="action-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Recorded in the activity log"
            />
            {reasonRequired && (
              <p className="text-xs text-muted-foreground">At least {MIN_REASON} characters.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={submit}
            disabled={saving || tooShort || confirmDisabled}
          >
            {saving ? "Saving…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
