// src/hooks/useJobInsights.ts
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuthToken } from "@/utils/auth";
import { apiBaseUrl } from "@/config/env";
import type {
  JobInsights,
  CandidateWithDetails,
  JobNote,
  JobAction,
  CandidateAction,
  DateRangeFilter,
  CandidateFilters,
  ExportOptions,
} from "@/types/jobInsights";
import type { Job } from "@/types/recruiter";

const API_BASE = apiBaseUrl;

// --- helpers to map backend -> frontend shape ---
function mapBackendInsightsToFrontend(raw: any): JobInsights {
  const kpis = raw.kpis || {};
  const funnelArray = raw.funnel || [];
  const funnelObj = {
    applied: 0,
    screened: 0,
    interview: 0,
    offer: 0,
    hired: 0,
  };
  for (const f of funnelArray) {
    const key = (f.stage || f._id || "").toString().toLowerCase();
    if (key.includes("apply")) funnelObj.applied = f.count;
    else if (key.includes("screen")) funnelObj.screened = f.count;
    else if (key.includes("interview")) funnelObj.interview = f.count;
    else if (key.includes("offer")) funnelObj.offer = f.count;
    else if (key.includes("hire")) funnelObj.hired = f.count;
    else if (f.stage && typeof f.count === "number") {
      (funnelObj as any)[f.stage] = f.count;
    }
  }

  const safePct = (part: number, whole: number) =>
    whole > 0 ? Math.round((part / whole) * 100 * 10) / 10 : 0;

  const applicantsTotal = kpis.totalApplicants ?? 0;
  const applicantsNew7Days =
    kpis.newApplicants7d ?? kpis.newApplicants7Days ?? 0;
  const applicantsNew30Days =
    kpis.newApplicants30d ?? kpis.newApplicants30Days ?? 0;

  const funnelConversions = {
    appliedToScreened: safePct(funnelObj.screened, funnelObj.applied),
    screenedToInterview: safePct(funnelObj.interview, funnelObj.screened),
    interviewToOffer: safePct(funnelObj.offer, funnelObj.interview),
    offerToHired: safePct(funnelObj.hired, funnelObj.offer),
    overallConversion: raw.kpis?.funnelConversionRate
      ? Math.round(Number(raw.kpis.funnelConversionRate) * 100) / 100
      : applicantsTotal > 0
      ? safePct(funnelObj.hired, funnelObj.applied)
      : 0,
  };

  const applicationsTimeseries = (
    raw.applicationsOverTime ||
    raw.applicationsTimeseries ||
    []
  ).map((t: any) => ({
    date: t._id ?? t.date,
    count: t.count ?? t.value ?? 0,
  }));

  const sources =
    (raw.sources || []).map((s: any) => ({
      source: s.source ?? s._id ?? "unknown",
      count: s.count ?? s.total ?? 0,
      conversion:
        s.conversion ?? (s.total ? safePct(s.hired ?? 0, s.total) : 0),
    })) || [];

  // normalize topSkills: server may return either a string id/name or an object
  // like { skill: "...", proficiency, name, _id }
  const topSkills = (raw.topSkills || []).map((s: any) => {
    let skillVal: any = s.skill ?? s._id ?? s.name ?? "";

    // If server nested the skill inside another object (common if aggregated from resumes)
    if (skillVal && typeof skillVal === "object") {
      // prefer explicit fields in this order
      skillVal =
        skillVal.skill ?? skillVal._id ?? skillVal.name ?? String(skillVal);
    }

    // Ensure it's a string for the frontend components
    return {
      skill: String(skillVal || ""),
      count: s.count ?? 0,
    };
  });

  const traffic = {
    impressions: raw.analytics?.impressions ?? raw.traffic?.impressions ?? 0,
    clicks: raw.analytics?.clicks ?? raw.traffic?.clicks ?? 0,
    ctr:
      raw.analytics && raw.analytics.impressions
        ? Math.round(
            (raw.analytics.clicks / raw.analytics.impressions) * 10000
          ) / 100
        : raw.traffic?.ctr ?? 0,
    ctrTimeseries: raw.traffic?.ctrTimeseries ?? [],
  };

  return {
    applicantsTotal,
    applicantsNew: applicantsNew7Days,
    applicantsNew7Days,
    applicantsNew30Days,
    funnel: funnelObj,
    funnelConversions,
    timeToHireAvgDays:
      raw.kpis?.avgTimeToHireDays ?? raw.timeToHireAvgDays ?? 0,
    views: raw.analytics?.views ?? 0,
    applies: raw.analytics?.applies ?? 0,
    applicationRate:
      raw.analytics && raw.analytics.views
        ? Math.round((raw.analytics.applies / raw.analytics.views) * 10000) /
          100
        : raw.applicationRate ?? 0,
    applicationsTimeseries,
    sources,
    topSkills,
    candidateQualityDistribution: raw.candidateQualityDistribution ?? {
      high: 0,
      medium: 0,
      low: 0,
    },
    benchmarks: raw.benchmarks ?? {
      companyAvgTimeToHire: 0,
      industryAvgTimeToHire: 0,
      companyAvgApplicationRate: 0,
      industryAvgApplicationRate: 0,
    },
    traffic,
  } as JobInsights;
}

// ---------- Hook ----------
export const useJobInsights = (jobId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuthToken();
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
    preset: "30d",
  });

  // Get job insights
  const {
    data: rawInsights,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useQuery({
    queryKey: ["job-insights", jobId, dateRange],
    queryFn: async (): Promise<JobInsights> => {
      try {
        const token = await getAuthToken();
        const resp = await fetch(
          `${API_BASE}/recruiter/jobs/${jobId}/insights?from=${dateRange.from}&to=${dateRange.to}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (!resp.ok) throw new Error("Failed to fetch job insights");
        const payload = await resp.json();
        const raw = payload?.data ?? payload;
        return mapBackendInsightsToFrontend(raw);
      } catch (err) {
        console.warn("Job insights API not available, using mock data");
        return {
          applicantsTotal: 0,
          applicantsNew: 0,
          applicantsNew7Days: 0,
          applicantsNew30Days: 0,
          funnel: { applied: 0, screened: 0, interview: 0, offer: 0, hired: 0 },
          funnelConversions: {
            appliedToScreened: 0,
            screenedToInterview: 0,
            interviewToOffer: 0,
            offerToHired: 0,
            overallConversion: 0,
          },
          timeToHireAvgDays: 0,
          views: 0,
          applies: 0,
          applicationRate: 0,
          applicationsTimeseries: [],
          sources: [],
          topSkills: [],
          candidateQualityDistribution: { high: 0, medium: 0, low: 0 },
          benchmarks: {
            companyAvgTimeToHire: 0,
            industryAvgTimeToHire: 0,
            companyAvgApplicationRate: 0,
            industryAvgApplicationRate: 0,
          },
          traffic: { impressions: 0, clicks: 0, ctr: 0, ctrTimeseries: [] },
        } as JobInsights;
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!jobId,
  });

  // Get job candidates
  const getCandidates = async (
    page = 1,
    limit = 25,
    filters: CandidateFilters = {}
  ) => {
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(",") : String(value),
          ])
        ),
      });

      const resp = await fetch(
        `${API_BASE}/recruiter/jobs/${jobId}/candidates?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!resp.ok) throw new Error("Failed to fetch candidates");
      const payload = await resp.json();
      const data = payload?.data ?? payload;
      const pagination = payload?.pagination ?? null;
      return { data, pagination };
    } catch (err) {
      console.warn("Candidates API not available, using mock data");
      const MOCK_CANDIDATES: CandidateWithDetails[] = [];
      return {
        data: MOCK_CANDIDATES,
        pagination: {
          page,
          limit,
          total: MOCK_CANDIDATES.length,
          totalPages: 1,
        },
      };
    }
  };

  // Job actions
  const jobActionMutation = useMutation<any, Error, JobAction, unknown>({
    mutationFn: async (action: JobAction) => {
      try {
        const token = await getAuthToken();
        const resp = await fetch(
          `${API_BASE}/recruiter/jobs/${jobId}/actions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(action),
          }
        );
        if (!resp.ok) throw new Error(`Failed to ${action.action} job`);
        const payload = await resp.json();
        return payload?.data ?? payload;
      } catch (err) {
        throw err;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-insights", jobId] });
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      toast({
        title: "Success",
        description: `Job ${variables.action} successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Action failed",
        variant: "destructive",
      });
    },
  });

  // Candidate actions
  const candidateActionMutation = useMutation<
    any,
    Error,
    CandidateAction,
    unknown
  >({
    mutationFn: async (action: CandidateAction) => {
      const token = await getAuthToken();
      const resp = await fetch(`${API_BASE}/recruiter/candidates/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(action),
      });
      if (!resp.ok) throw new Error(`Failed to ${action.action} candidates`);
      return resp.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-insights", jobId] });
      toast({
        title: "Success",
        description: `Candidate ${variables.action} completed successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Action failed",
        variant: "destructive",
      });
    },
  });

  // Add job note
  const addNoteMutation = useMutation<
    any,
    Error,
    { content: string; private: boolean },
    unknown
  >({
    mutationFn: async (note) => {
      const token = await getAuthToken();
      const resp = await fetch(`${API_BASE}/recruiter/jobs/${jobId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(note),
      });
      if (!resp.ok) throw new Error("Failed to add note");
      const payload = await resp.json();
      return payload?.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-insights", jobId] });
      toast({ title: "Success", description: "Note added successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add note",
        variant: "destructive",
      });
    },
  });

  // Export data
  const exportData = async (options: ExportOptions): Promise<Blob> => {
    try {
      const token = await getAuthToken();
      const resp = await fetch(`${API_BASE}/recruiter/jobs/${jobId}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(options),
      });
      if (!resp.ok) throw new Error("Failed to export data");
      return resp.blob();
    } catch (err) {
      console.warn("Export API not available, generating mock CSV");
      const mockCsv =
        "Name,Email,Applied Date,Source,Stage\nJohn Doe,john.doe@email.com,2024-09-20,LinkedIn,interview";
      return new Blob([mockCsv], { type: "text/csv" });
    }
  };
  const jobActionLoading = jobActionMutation.status === "pending";
  const candidateActionLoading = candidateActionMutation.status === "pending";
  const addNoteLoading = addNoteMutation.status === "pending";
  return {
    insights: rawInsights,
    insightsLoading,
    insightsError,
    refetchInsights,
    dateRange,
    setDateRange,
    getCandidates,
    executeJobAction: jobActionMutation.mutateAsync,
    isExecutingJobAction: jobActionLoading,
    executeCandidateAction: candidateActionMutation.mutateAsync,
    isExecutingCandidateAction: candidateActionLoading,
    addNote: addNoteMutation.mutateAsync,
    isAddingNote: addNoteLoading,
    exportData,
  };
};
