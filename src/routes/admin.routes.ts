// src/routes/admin.routes.ts
import { lazy } from "react";
import { RouteConfig } from "./types";

// Lazy load admin pages with prefetch hints
const AdminLayout = lazy(
  () => import(/* webpackPrefetch: true */ "@/components/admin/AdminLayout")
);
const AdminDashboard = lazy(
  () => import(/* webpackPrefetch: true */ "@/pages/admin/Dashboard")
);
const AdminUsers = lazy(() => import("@/pages/admin/UsersPage"));
const AdminRecruiters = lazy(() => import("@/pages/admin/RecruitersPage"));
const AdminResumes = lazy(() => import("@/pages/admin/ResumesPage"));
const AdminPlans = lazy(() => import("@/pages/admin/PlansPage"));
const AdminMessages = lazy(() => import("@/pages/admin/ContactMessages"));
const AdminAtsResults = lazy(() => import("@/pages/admin/AtsResults"));

// Dashboard routes
const CandidatesDashboard = lazy(
  () => import("@/pages/admin/candidates/CandidatesDashboard")
);
const RecruitersDashboard = lazy(
  () => import("@/pages/admin/recruiters/RecruitersDashboard")
);

// Management routes
const JobTitles = lazy(() => import("@/pages/admin/management/JobTitles"));
const Skills = lazy(() => import("@/pages/admin/management/Skills"));
const Qualifications = lazy(
  () => import("@/pages/admin/management/Qualifications")
);
const ManagementCompanies = lazy(
  () => import("@/pages/admin/management/Companies")
);
const BusinessDataPage = lazy(
  () => import("@/pages/admin/management/BusinessData")
);
const SupportTicketsPage = lazy(
  () => import("@/pages/admin/SupportTicketsPage")
);
const OutsideLinks = lazy(
  () => import("@/pages/admin/management/OutsideLinks")
);
const OutsideLinkSubmissionsPage = lazy(
  () => import("@/pages/admin/management/OutsideLinkSubmissionsPage")
);
const Tags = lazy(() => import("@/pages/admin/management/Tags"));
const Certificates = lazy(
  () => import("@/pages/admin/management/Certificates")
);

// Email management routes
const EmailDashboard = lazy(() => import("@/pages/admin/email/EmailDashboard"));
const EmailServers = lazy(() => import("@/pages/admin/email/EmailServers"));
const EmailTemplates = lazy(() => import("@/pages/admin/email/EmailTemplates"));
const TemplateEditor = lazy(() => import("@/pages/admin/email/TemplateEditor"));
const SendEmail = lazy(() => import("@/pages/admin/email/SendEmail"));
const UnsubscribeManagement = lazy(
  () => import("@/pages/admin/email/UnsubscribeManagement")
);
const ScheduledEmails = lazy(
  () => import("@/pages/admin/email/ScheduledEmails")
);

export const adminLayoutRoutes: RouteConfig = {
  path: "/admin",
  element: AdminLayout,
  protected: true,
  children: [
    {
      path: "",
      index: true,
      element: AdminDashboard,
    },
    // Candidates sub-routes
    {
      path: "candidates/dashboard",
      element: CandidatesDashboard,
    },
    {
      path: "users",
      element: AdminUsers,
    },
    {
      path: "resumes",
      element: AdminResumes,
    },
    {
      path: "plans",
      element: AdminPlans,
    },
    {
      path: "ats-results",
      element: AdminAtsResults,
    },
    // Recruiters sub-routes
    {
      path: "recruiters/dashboard",
      element: RecruitersDashboard,
    },
    {
      path: "recruiters",
      element: AdminRecruiters,
    },
    // Messages
    {
      path: "messages",
      element: AdminMessages,
    },
    // Management sub-routes
    {
      path: "management/job-titles",
      element: JobTitles,
    },
    {
      path: "management/skills",
      element: Skills,
    },
    {
      path: "management/qualifications",
      element: Qualifications,
    },
    {
      path: "management/companies",
      element: ManagementCompanies,
    },
    {
      path: "management/business-data",
      element: BusinessDataPage,
    },
    {
      path: "management/support-tickets",
      element: SupportTicketsPage,
    },
    {
      path: "management/outside-links/:id/submissions",
      element: OutsideLinkSubmissionsPage,
    },
    {
      path: "management/outside-links",
      element: OutsideLinks,
    },
    {
      path: "management/tags",
      element: Tags,
    },
    {
      path: "management/certificates",
      element: Certificates,
    },
    // Email management sub-routes
    {
      path: "email/dashboard",
      element: EmailDashboard,
    },
    {
      path: "email/servers",
      element: EmailServers,
    },
    {
      path: "email/templates",
      element: EmailTemplates,
    },
    {
      path: "email/templates/new",
      element: TemplateEditor,
    },
    {
      path: "email/templates/:id/edit",
      element: TemplateEditor,
    },
    {
      path: "email/send",
      element: SendEmail,
    },
    {
      path: "email/scheduled",
      element: ScheduledEmails,
    },
    {
      path: "email/unsubscribed",
      element: UnsubscribeManagement,
    },
  ],
};
