// src/hooks/usePipelineStatus.ts
import { useQuery } from "@tanstack/react-query";
import { getPipelineStatus } from "@/api/recruiter";
import { PipelineStatusTracking } from "@/types/pipeline";

export const usePipelineStatus = (
  pipelineId: string | undefined,
  enabled: boolean
) => {
  return useQuery({
    queryKey: ["pipeline-status", pipelineId],
    queryFn: () => {
      if (!pipelineId) throw new Error("Pipeline ID is required");
      return getPipelineStatus(pipelineId);
    },
    enabled: enabled && !!pipelineId,
    refetchInterval: (query) => {
      // Poll every 10 seconds if pipeline is active and within 24h window
      const status = query.state.data as PipelineStatusTracking | undefined;
      if (!status) return false;
      return status.timeRemaining > 0 ? 10000 : false; // Changed from 5000 to 10000
    },
    staleTime: 0, // Always consider stale for real-time updates
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};
