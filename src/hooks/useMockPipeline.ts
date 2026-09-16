import { useQuery } from "@tanstack/react-query";
import {
  getAllPipelines,
  getPipelineById,
  getApplicationsByPipelineId,
  getApplicationById,
  getTopCandidates,
  getCandidateProfile,
} from "@/services/mock/pipelineMockData";
import type {
  Pipeline,
  PipelineApplication,
  CandidateProfile,
} from "@/types/pipeline";

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useMockPipelines() {
  return useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      await delay(500); // Simulate network delay
      return getAllPipelines();
    },
  });
}

export function useMockPipeline(pipelineId: string) {
  return useQuery({
    queryKey: ["pipeline", pipelineId],
    queryFn: async () => {
      await delay(500);
      const pipeline = getPipelineById(pipelineId);
      if (!pipeline) {
        throw new Error("Pipeline not found");
      }
      return pipeline;
    },
    enabled: !!pipelineId,
  });
}

export function useMockApplications(pipelineId: string) {
  return useQuery({
    queryKey: ["applications", pipelineId],
    queryFn: async () => {
      await delay(500);
      return getApplicationsByPipelineId(pipelineId);
    },
    enabled: !!pipelineId,
  });
}

export function useMockApplication(applicationId: string) {
  return useQuery({
    queryKey: ["application", applicationId],
    queryFn: async () => {
      await delay(500);
      const application = getApplicationById(applicationId);
      if (!application) {
        throw new Error("Application not found");
      }
      return application;
    },
    enabled: !!applicationId,
  });
}

export function useMockTopCandidates(pipelineId: string, limit: number = 5) {
  return useQuery({
    queryKey: ["top-candidates", pipelineId, limit],
    queryFn: async () => {
      await delay(500);
      return getTopCandidates(pipelineId, limit);
    },
    enabled: !!pipelineId,
  });
}

export function useMockCandidateProfile(candidateId: string | undefined) {
  return useQuery({
    queryKey: ["candidate-profile", candidateId],
    queryFn: async () => {
      if (!candidateId) return null;
      await delay(300);
      return getCandidateProfile(candidateId);
    },
    enabled: !!candidateId,
  });
}
