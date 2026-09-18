// src/utils/dateFilters.ts
import { DateFilterPreset, DateRange } from "@/types/admin";

/**
 * Calculate date range for a given preset filter
 */
export function getDateRangeFromPreset(preset: DateFilterPreset): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let from: Date;
  let to: Date = new Date(today); // End of today (00:00:00)
  to.setHours(23, 59, 59, 999);

  switch (preset) {
    case "today":
      from = new Date(today);
      break;

    case "yesterday":
      from = new Date(today);
      from.setDate(from.getDate() - 1);
      to = new Date(from);
      to.setHours(23, 59, 59, 999);
      break;

    case "last7days":
      from = new Date(today);
      from.setDate(from.getDate() - 7);
      break;

    case "last15days":
      from = new Date(today);
      from.setDate(from.getDate() - 15);
      break;

    case "last30days":
      from = new Date(today);
      from.setDate(from.getDate() - 30);
      break;

    case "thisMonth":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;

    case "lastMonth":
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
      to.setHours(23, 59, 59, 999);
      break;

    case "3months":
      from = new Date(today);
      from.setMonth(from.getMonth() - 3);
      break;

    case "6months":
      from = new Date(today);
      from.setMonth(from.getMonth() - 6);
      break;

    default:
      // For "custom", return empty - caller should provide their own dates
      from = new Date(today);
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

/**
 * Format date range for display
 */
export function formatDateRangeForDisplay(from: string, to: string): string {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  return `${fromDate.toLocaleDateString(
    "en-US",
    options
  )} - ${toDate.toLocaleDateString("en-US", options)}`;
}

/**
 * Get all available filter preset options
 */
export function getFilterPresetOptions(): Array<{
  value: DateFilterPreset;
  label: string;
}> {
  return [
    { value: "yesterday", label: "Yesterday" },
    { value: "today", label: "Today" },
    { value: "last7days", label: "Last 7 Days" },
    { value: "last15days", label: "Last 15 Days" },
    { value: "last30days", label: "Last 30 Days" },
    { value: "thisMonth", label: "This Month" },
    { value: "lastMonth", label: "Last Month" },
    { value: "3months", label: "Last 3 Months" },
    { value: "6months", label: "Last 6 Months" },
    { value: "custom", label: "Custom Date Range" },
  ];
}

/**
 * Format revenue from paise to rupees with proper formatting
 */
export function formatRevenue(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Format large numbers with K, M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}
