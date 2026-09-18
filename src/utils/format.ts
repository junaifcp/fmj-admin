// src/utils/format.ts
import { parseISO, isValid, format } from "date-fns";

export function getLocationLabel(loc?: any): string {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  // prefer formattedAddress, then city/region/country
  return (
    loc.formattedAddress ||
    (loc.city ? String(loc.city) : "") ||
    (loc.region ? String(loc.region) : "") ||
    (loc.country ? String(loc.country) : "")
  ).trim();
}

export function safeFormatDate(iso?: string, pattern = "MMM dd, yyyy"): string {
  if (!iso) return "";
  try {
    const d = parseISO(iso);
    if (isValid(d)) return format(d, pattern);
    return String(iso);
  } catch {
    return String(iso);
  }
}
