// Recruiter admin 8.1/8.2: labels for the job desk and employer invites.
import type { FulfillmentPlan } from "@/types/recruiterAdmin";

export const PLAN_LABELS: Record<FulfillmentPlan, string> = {
  free: "Free",
  smart_hire: "Smart Hire",
  hire_assist: "Hire Assist",
};

export const INVITE_STATUS_LABELS: Record<string, string> = {
  sent: "Sent",
  send_failed: "Send failed",
  accepted: "Accepted",
  revoked: "Revoked",
  expired: "Expired",
};

/** Same rule as the backend: only these can be sent again. */
export const RESENDABLE_INVITES = ["sent", "send_failed", "expired"];
