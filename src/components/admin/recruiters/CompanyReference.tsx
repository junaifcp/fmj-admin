// src/components/admin/recruiters/CompanyReference.tsx
// Company reference number: the job fair code (e.g. "FMJ01") admin gives a company.
// Candidates see it in green on every job of that company. Only admin sets it.
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { companyAdminApi } from "@/api/companyAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Same rule as the backend (REFERENCE_CODE_RE in models/Company.ts). */
export const REFERENCE_CODE_RE = /^[A-Z0-9-]{1,12}$/;
const MAX_LENGTH = 12;

/** The code as a small solid green pill, or a dash when the company has none. */
export const ReferencePill: React.FC<{ code?: string | null }> = ({ code }) =>
  code ? (
    <span className="inline-flex items-center rounded-md bg-green-600 px-2 py-0.5 text-xs font-bold tracking-wide text-white tabular-nums">
      {code}
    </span>
  ) : (
    <span className="text-muted-foreground">—</span>
  );

interface Props {
  companyId: string;
  value?: string | null;
  /** The stored code after a save (null when cleared). */
  onSaved: (code: string | null) => void;
}

/** Input with Save and Clear for the company sheet. */
export const CompanyReferenceField: React.FC<Props> = ({ companyId, value, onSaved }) => {
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState<"save" | "clear" | null>(null);

  useEffect(() => setDraft(value ?? ""), [value, companyId]);

  const code = draft.trim().toUpperCase();
  const invalid = code !== "" && !REFERENCE_CODE_RE.test(code);
  const unchanged = code === (value ?? "");

  const submit = async (next: string | null, kind: "save" | "clear") => {
    try {
      setSaving(kind);
      const saved = await companyAdminApi.setReference(companyId, next);
      const stored = saved.referenceCode ?? null;
      onSaved(stored);
      setDraft(stored ?? "");
      toast.success(stored ? `Reference number set to ${stored}` : "Reference number cleared", {
        description: "Recorded in the activity log",
      });
    } catch (e) {
      toast.error("Could not update the reference number", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-1.5">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!invalid && !unchanged && code) void submit(code, "save");
        }}
      >
        <Input
          aria-label="Reference number"
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase().slice(0, MAX_LENGTH))}
          placeholder="FMJ01"
          maxLength={MAX_LENGTH}
          className="h-8 w-32 font-mono uppercase"
          aria-invalid={invalid}
          disabled={saving !== null}
        />
        <Button type="submit" size="sm" disabled={saving !== null || invalid || unchanged || !code}>
          {saving === "save" ? "Saving…" : "Save"}
        </Button>
        {value && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving !== null}
            onClick={() => void submit(null, "clear")}
          >
            {saving === "clear" ? "Clearing…" : "Clear"}
          </Button>
        )}
      </form>
      <p className={`text-xs ${invalid ? "text-destructive" : "text-muted-foreground"}`}>
        {invalid
          ? "Use 1–12 letters, numbers or hyphens."
          : "Shown in green on every job of this company. Clear it after the fair."}
      </p>
    </div>
  );
};
