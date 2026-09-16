// src/utils/pipelineUtils.ts

/**
 * Calculate time remaining in seconds until 24-hour window ends
 * @param startedAt - Start date/time of the pipeline
 * @returns Number of seconds remaining (0 if window has ended)
 */
export const calculateTimeRemaining = (startedAt: string | Date): number => {
  const start = new Date(startedAt);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000); // +24 hours
  const now = new Date();
  const remaining = Math.max(
    0,
    Math.floor((end.getTime() - now.getTime()) / 1000)
  );
  return remaining; // seconds
};

/**
 * Format time remaining as HH:MM:SS
 * @param seconds - Number of seconds remaining
 * @returns Formatted string like "23:45:30"
 */
export const formatTimeRemaining = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Check if pipeline is within 24-hour window
 * @param startedAt - Start date/time of the pipeline
 * @returns true if within window, false otherwise
 */
export const isWithin24HourWindow = (startedAt?: string | Date): boolean => {
  if (!startedAt) return false;
  return calculateTimeRemaining(startedAt) > 0;
};

/**
 * Format a date/time for display
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
