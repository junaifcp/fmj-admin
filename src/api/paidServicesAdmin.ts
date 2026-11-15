// src/api/paidServicesAdmin.ts
// Employer admin 9.1 / 10.1: /api/admin/whatsapp and /api/admin/payments.
import { createApiClient } from "./apiClient";
import { getAuthToken, clearTokenCache } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";
import type { Paged } from "@/types/recruiterAdmin";
import type {
  ConsentState,
  EmployerPaymentRow,
  PaidPlan,
  PaymentFilters,
  PaymentsSummary,
  RecordPaymentInput,
  WhatsappConsentRow,
  WhatsappMessageFilters,
  WhatsappMessagesResult,
  WhatsappSummary,
} from "@/types/employerAdmin";

type Opts = { signal?: AbortSignal };
const base = `${apiBaseUrl.replace(/\/$/, "")}/admin`;
const make = (path: string) =>
  createApiClient({ baseURL: `${base}/${path}`, getAuthToken, onAuthError: () => clearTokenCache() });
const whatsapp = make("whatsapp");
const payments = make("payments");

const toParams = (o: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== "") p.set(k, String(v));
  return p.toString();
};

export const whatsappAdminApi = {
  async messages(page: number, limit: number, f: WhatsappMessageFilters, opts?: Opts): Promise<WhatsappMessagesResult> {
    const res = await whatsapp.get(`/messages?${toParams({ page, limit, ...f })}`, { signal: opts?.signal });
    return res.data.data;
  },
  async consent(
    page: number,
    limit: number,
    f: { state?: ConsentState; q?: string },
    opts?: Opts
  ): Promise<Paged<WhatsappConsentRow>> {
    const res = await whatsapp.get(`/consent?${toParams({ page, limit, ...f })}`, { signal: opts?.signal });
    return res.data.data;
  },
  async summary(f: { from?: string; to?: string }, opts?: Opts): Promise<WhatsappSummary> {
    const res = await whatsapp.get(`/summary?${toParams(f)}`, { signal: opts?.signal });
    return res.data.data;
  },
};

export const paymentsAdminApi = {
  async list(page: number, limit: number, f: PaymentFilters, opts?: Opts): Promise<Paged<EmployerPaymentRow>> {
    const res = await payments.get(`/?${toParams({ page, limit, ...f })}`, { signal: opts?.signal });
    return res.data.data;
  },
  async summary(f: { from?: string; to?: string }, opts?: Opts): Promise<PaymentsSummary> {
    const res = await payments.get(`/summary?${toParams(f)}`, { signal: opts?.signal });
    return res.data.data;
  },
  async prices(opts?: Opts): Promise<Record<PaidPlan, number>> {
    const res = await payments.get("/prices", { signal: opts?.signal });
    return res.data.data;
  },
  async record(input: RecordPaymentInput): Promise<{ _id: string; fulfillmentPlan: PaidPlan }> {
    const res = await payments.post("/", input);
    return res.data.data;
  },
  /** Superadmin only (enforced on the server). */
  async refund(id: string, reason: string): Promise<void> {
    await payments.post(`/${encodeURIComponent(id)}/refund`, { reason });
  },
};
