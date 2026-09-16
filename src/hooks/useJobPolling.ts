// src/hooks/useJobPolling.ts
import { useState, useEffect, useRef } from "react";
import { getJobStatus } from "@/api/businessData";
import { JobStatus } from "@/types/businessData";

interface UseJobPollingOptions {
  enabled?: boolean;
  interval?: number; // Default: 2000ms
  onStatusChange?: (status: string) => void;
}

export function useJobPolling(
  jobId: string | null,
  options: UseJobPollingOptions = {}
): {
  job: JobStatus | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { enabled = true, interval = 2000, onStatusChange } = options;
  const [job, setJob] = useState<JobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<string | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  const isPollingRef = useRef(false);
  const jobIdRef = useRef<string | null>(jobId);
  const enabledRef = useRef(enabled);
  const intervalRef = useRef(interval);
  const isActiveRef = useRef(true);

  // Keep refs updated
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    jobIdRef.current = jobId;
    enabledRef.current = enabled;
    intervalRef.current = interval;
  }, [onStatusChange, jobId, enabled, interval]);

  // Fetch status function with recursive scheduling
  const fetchStatus = async () => {
    const currentJobId = jobIdRef.current;
    const currentEnabled = enabledRef.current;

    // Prevent multiple simultaneous fetches
    if (
      isPollingRef.current ||
      !currentEnabled ||
      !currentJobId ||
      !isActiveRef.current
    ) {
      return;
    }

    try {
      isPollingRef.current = true;
      setIsLoading(true);
      setError(null);
      const status = await getJobStatus(currentJobId);
      setJob(status);

      // Check if status changed
      if (
        previousStatusRef.current !== null &&
        previousStatusRef.current !== status.status
      ) {
        onStatusChangeRef.current?.(status.status);
      }
      previousStatusRef.current = status.status;

      // Stop polling if completed or failed
      if (
        status.status === "completed" ||
        status.status === "failed" ||
        status.status === "cancelled"
      ) {
        isActiveRef.current = false;
        isPollingRef.current = false;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }
    } catch (err: any) {
      setError(err);
      // Don't stop polling on error (might be transient)
      console.error("Error polling job status:", err);
    } finally {
      setIsLoading(false);
      isPollingRef.current = false;
    }

    // Schedule next poll using recursive setTimeout (works even when tab is hidden)
    // This continues polling even when tab is switched
    if (isActiveRef.current && currentEnabled && currentJobId) {
      timeoutRef.current = setTimeout(() => {
        fetchStatus();
      }, intervalRef.current);
    }
  };

  // Main polling effect
  useEffect(() => {
    // Reset active flag
    isActiveRef.current = true;

    // Don't poll if disabled or no jobId
    if (!enabled || !jobId) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setJob(null);
      isPollingRef.current = false;
      previousStatusRef.current = null;
      isActiveRef.current = false;
      return;
    }

    // Clear any existing timeout before starting new one
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Initial fetch immediately
    fetchStatus();

    // Cleanup
    return () => {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, [jobId, enabled, interval]);

  // Handle tab visibility changes - immediately fetch when tab becomes visible
  useEffect(() => {
    if (!enabled || !jobId) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab became visible - immediately fetch status to catch up
        console.log(
          "[useJobPolling] Tab became visible, fetching status for job:",
          jobId
        );

        // If we're not currently fetching and polling is active, fetch immediately
        if (!isPollingRef.current && isActiveRef.current) {
          fetchStatus();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [jobId, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { job, isLoading, error };
}
