// src/routes/recruiter.routes.ts
import { lazy } from "react";
import { RouteConfig } from "./types";

// Lazy load recruiter pages with prefetch hints
const RecruiterLayout = lazy(
  () =>
    import(/* webpackPrefetch: true */ "@/components/recruiter/RecruiterLayout")
);
const RecruiterDashboard = lazy(
  () => import(/* webpackPrefetch: true */ "@/pages/recruiter/Dashboard")
);
const RecruiterJobs = lazy(() => import("@/pages/recruiter/Jobs"));
const RecruiterPostJob = lazy(() => import("@/pages/recruiter/PostJob"));
const RecruiterApplications = lazy(
  () => import("@/pages/recruiter/Applications")
);
const RecruiterCandidates = lazy(() => import("@/pages/recruiter/Candidates"));
const RecruiterProfile = lazy(() => import("@/pages/recruiter/Profile"));
const RecruiterJobDetails = lazy(() => import("@/pages/recruiter/JobDetails"));
const RecruiterCompanies = lazy(() => import("@/pages/recruiter/Companies"));
const PipelineList = lazy(
  () => import("@/pages/recruiter/pipelines/PipelineList")
);
const PipelineDetail = lazy(
  () => import("@/pages/recruiter/pipelines/PipelineDetail")
);

// Standalone recruiter routes (outside layout)
export const recruiterStandaloneRoutes: RouteConfig[] = [];

// Main recruiter routes (with layout)
export const recruiterLayoutRoutes: RouteConfig = {
  path: "/recruiter",
  element: RecruiterLayout,
  protected: true,
  children: [
    {
      path: "",
      index: true,
      element: RecruiterDashboard,
    },
    {
      path: "dashboard",
      element: RecruiterDashboard,
    },
    {
      path: "companies",
      element: RecruiterCompanies,
    },
    {
      path: "jobs",
      element: RecruiterJobs,
    },
    {
      path: "jobs/:id",
      element: RecruiterJobDetails,
    },
    {
      path: "post-job",
      element: RecruiterPostJob,
    },
    {
      path: "applications",
      element: RecruiterApplications,
    },
    {
      path: "candidates",
      element: RecruiterCandidates,
    },
    {
      path: "profile",
      element: RecruiterProfile,
    },
    {
      path: "pipelines",
      element: PipelineList,
    },
    {
      path: "pipelines/:id",
      element: PipelineDetail,
    },
  ],
};
