// src/types/candidateMetrics.ts
export interface CandidateOverviewMetrics {
  totalCandidates: number;
  newCandidates: number;
  dailyActive: number;
  weeklyActive: number;
  monthlyActive: number;
  engagementRate: number;
  totalResumes: number;
  newResumes: number;
  avgResumesPerUser: number;
  totalApplications: number;
  newApplications: number;
  totalCoverLetters: number;
  newCoverLetters: number;
  totalAtsResults: number;
  newAtsResults: number;
  totalFailedAtsAnalyses: number;
  newFailedAtsAnalyses: number;
  activeSubscriptions: number;
  newSubscriptions: number;
  subscriptionRate: number;
  inactiveUsers: number;
  totalProfileCompleted: number;
  newProfileCompleted: number;
  totalSavedJobs: number;
  newSavedJobs: number;
}

export interface ApplicationMetrics {
  statusDistribution: Array<{ status: string; count: number }>;
  successRate: number;
  totalApplications: number;
  successfulApplications: number;
}

export interface AtsMetrics {
  avgScore: number;
  totalAnalyses: number;
  scoreDistribution: Array<{ range: string; count: number }>;
}

export interface ActivityTrends {
  signupTrend: Array<{ date: string; count: number }>;
  resumeTrend: Array<{ date: string; count: number }>;
  applicationTrend: Array<{ date: string; count: number }>;
  atsTrend: Array<{ date: string; count: number }>;
}

export interface TemplateMetrics {
  templateId: string;
  count: number;
}
