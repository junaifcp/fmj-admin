// Employer admin 6.2: labels and badges shared by the employer pages.
import type { DraftStep, EmployerSource } from "@/types/employerAdmin";

export const SOURCE_LABELS: Record<EmployerSource, string> = {
  ad_landing: "Ad",
  dashboard: "Dashboard",
  invite: "Invite",
};

export const SOURCE_LONG_LABELS: Record<EmployerSource, string> = {
  ad_landing: "Ad landing (/post-a-job)",
  dashboard: "Dashboard sign-up",
  invite: "Recruiter invite",
};

export const CHANNEL_LABELS: Record<string, string> = {
  meta_paid: "Meta ads",
  direct: "Direct",
  organic: "Organic",
};

export const DRAFT_STEP_LABELS: Record<DraftStep, string> = {
  whatsapp: "WhatsApp step",
  company: "Company step",
  basics: "Job basics",
  generate: "AI writing",
  review: "Review",
  posted: "Posted",
};

export const WHATSAPP_TEMPLATE_LABELS: Record<string, string> = {
  job_post_success_utility: "Job posted",
  recruiter_job_invite: "Recruiter invite",
};
