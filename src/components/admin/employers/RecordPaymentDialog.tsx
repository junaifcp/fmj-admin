// Employer admin 10.2: record a job desk payment made outside the app.
// Used on Paid Services, the Job Desk row menu and Employer Detail → Payments.
// Recording also sets the job's plan (server side, audited as payment.record).
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { adminJobsApi } from "@/api/adminJobs";
import { paymentsAdminApi } from "@/api/paidServicesAdmin";
import type { AdminJobRow } from "@/types/recruiterAdmin";
import type { PaidPlan, PaymentMethod } from "@/types/employerAdmin";
import { PAID_PLAN_LABELS, PAYMENT_METHOD_LABELS, rupeesToPaise, paiseToRupeesInput } from "./paymentLabels";

export type PaymentJob = { _id: string; title: string; employer?: string | null };

const today = () => new Date().toISOString().slice(0, 10);

const RecordPaymentDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Prefilled job (Job Desk, Employer Detail). Without it the dialog shows a job search. */
  job?: PaymentJob | null;
  /** Limit the job search to one employer (Employer Detail). */
  employerId?: string;
  plan?: PaidPlan;
  onRecorded: () => void;
}> = ({ open, onOpenChange, job: fixedJob, employerId, plan: initialPlan, onRecorded }) => {
  const { toast } = useToast();
  const [prices, setPrices] = useState<Record<PaidPlan, number> | null>(null);
  const [job, setJob] = useState<PaymentJob | null>(fixedJob ?? null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminJobRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [plan, setPlan] = useState<PaidPlan>(initialPlan ?? "smart_hire");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(today());
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setJob(fixedJob ?? null);
    setQuery("");
    setResults([]);
    setPlan(initialPlan ?? "smart_hire");
    setPaidAt(today());
    setMethod("upi");
    setReference("");
    setNotes("");
    paymentsAdminApi
      .prices()
      .then(setPrices)
      .catch(() => setPrices({ smart_hire: 199900, hire_assist: 499900 }));
    // Keyed on the job id so a new object for the same job doesn't reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fixedJob?._id, initialPlan]);

  // The amount follows the plan price until the admin edits it.
  useEffect(() => {
    if (prices) setAmount(paiseToRupeesInput(prices[plan]));
  }, [plan, prices]);

  // Job search (employer jobs only), debounced.
  useEffect(() => {
    if (!open || fixedJob || job) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await adminJobsApi.list(
          1,
          8,
          { q: query.trim() || undefined, postedByRole: "employer", recruiterId: employerId },
          { signal: ctrl.signal }
        );
        setResults(res.data);
      } catch {
        if (!ctrl.signal.aborted) setResults([]);
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [open, query, fixedJob, job, employerId]);

  const amountPaise = rupeesToPaise(amount);
  const canSave = !!job && amountPaise !== null && amountPaise > 0 && !!paidAt && !saving;

  const save = async () => {
    if (!job || amountPaise === null) return;
    try {
      setSaving(true);
      await paymentsAdminApi.record({
        jobId: job._id,
        plan,
        amountPaise,
        paidAt: new Date(`${paidAt}T12:00:00`).toISOString(),
        method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast({
        title: "Payment recorded",
        description: `${job.title} is now on ${PAID_PLAN_LABELS[plan]}. Recorded in the activity log.`,
      });
      onOpenChange(false);
      onRecorded();
    } catch (e) {
      toast({
        title: "Could not record the payment",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            For a job desk service the employer paid for outside the app. This also sets the job's plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Employer job</Label>
            {job ? (
              <div className="flex items-center justify-between rounded-md border p-2 text-sm">
                <div>
                  <div className="font-medium">{job.title}</div>
                  {job.employer && <div className="text-xs text-muted-foreground">{job.employer}</div>}
                </div>
                {!fixedJob && (
                  <Button variant="ghost" size="sm" onClick={() => setJob(null)}>
                    Change
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search job title"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
                  {searching && <p className="p-2 text-sm text-muted-foreground">Searching…</p>}
                  {!searching && results.length === 0 && (
                    <p className="p-2 text-sm text-muted-foreground">No employer jobs found</p>
                  )}
                  {!searching &&
                    results.map((r) => (
                      <button
                        key={r._id}
                        type="button"
                        className="w-full text-left p-2 text-sm hover:bg-muted"
                        onClick={() =>
                          setJob({ _id: r._id, title: r.title, employer: r.postedBy?.name || r.postedBy?.email })
                        }
                      >
                        <div className="font-medium">{r.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {[r.postedBy?.name || r.postedBy?.email, r.company?.name].filter(Boolean).join(" · ")}
                        </div>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pay-plan">Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as PaidPlan)}>
                <SelectTrigger id="pay-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAID_PLAN_LABELS) as PaidPlan[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PAID_PLAN_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Amount (₹)</Label>
              <Input
                id="pay-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {amount && amountPaise === null && <p className="text-xs text-destructive">Enter an amount in rupees</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-date">Paid on</Label>
              <Input id="pay-date" type="date" max={today()} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-method">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger id="pay-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-ref">Reference (UTR, receipt no.)</Label>
            <Input id="pay-ref" maxLength={200} value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-notes">Notes (optional)</Label>
            <Textarea id="pay-notes" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            {saving ? "Saving…" : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPaymentDialog;
