// Employer admin 10.2: labels and rupee/paise helpers for Paid Services.
import type { PaidPlan, PaymentMethod } from "@/types/employerAdmin";

export const PAID_PLAN_LABELS: Record<PaidPlan, string> = {
  smart_hire: "Smart Hire",
  hire_assist: "Hire Assist",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: "UPI",
  bank: "Bank transfer",
  cash: "Cash",
  card: "Card",
  other: "Other",
};

/** ₹1,999 style; whole rupees unless there are paise. */
export const formatRupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** "1999" or "1,999.50" → paise; null when not a valid positive amount. */
export function rupeesToPaise(input: string): number | null {
  const clean = input.replace(/[,₹\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const paise = Math.round(Number(clean) * 100);
  return paise > 0 ? paise : null;
}

/** 199900 → "1999" (or "1999.5" when there are paise). */
export const paiseToRupeesInput = (paise: number) => String(paise / 100);
