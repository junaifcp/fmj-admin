// src/routes/admin.routes.ts
import { lazyWithReload } from "./lazyWithReload";
import { RouteConfig } from "./types";
import { LEGACY_REDIRECTS } from "./paths";
import { redirectWithQuery } from "@/components/routing/RedirectWithQuery";

// Lazy load admin pages with prefetch hints
const AdminLayout = lazyWithReload(
  () => import(/* webpackPrefetch: true */ "@/components/admin/AdminLayout")
);
const AdminDashboard = lazyWithReload(
  () => import(/* webpackPrefetch: true */ "@/pages/admin/Dashboard")
);
const AdminUsers = lazyWithReload(() => import("@/pages/admin/UsersPage"));
const AdminRecruiters = lazyWithReload(() => import("@/pages/admin/RecruitersPage"));
const AdminResumes = lazyWithReload(() => import("@/pages/admin/ResumesPage"));
const AdminPlans = lazyWithReload(() => import("@/pages/admin/PlansPage"));
const AdminMessages = lazyWithReload(() => import("@/pages/admin/ContactMessages"));
const AdminAtsResults = lazyWithReload(() => import("@/pages/admin/AtsResults"));

// Dashboard routes
const CandidatesDashboard = lazyWithReload(
  () => import("@/pages/admin/candidates/CandidatesDashboard")
);
const FitMySkillDataPage = lazyWithReload(
  () => import("@/pages/admin/candidates/FitMySkillDataPage")
);
const VerificationPage = lazyWithReload(
  () => import("@/pages/admin/candidates/VerificationPage")
);
const RecruitersOverview = lazyWithReload(
  () => import("@/pages/admin/recruiters/RecruitersOverview")
);
const RecruiterDetail = lazyWithReload(() => import("@/pages/admin/recruiters/RecruiterDetail"));
const RecruitersDashboardRedirect = lazyWithReload(
  () => import("@/pages/admin/recruiters/RecruitersDashboardRedirect")
);

// Management routes
const JobTitles = lazyWithReload(() => import("@/pages/admin/management/JobTitles"));
const Skills = lazyWithReload(() => import("@/pages/admin/management/Skills"));
const Qualifications = lazyWithReload(
  () => import("@/pages/admin/management/Qualifications")
);
const RecruiterCompanies = lazyWithReload(() => import("@/pages/admin/recruiters/Companies"));
const RecruiterJobs = lazyWithReload(() => import("@/pages/admin/recruiters/Jobs"));
const RecruiterJobDesk = lazyWithReload(() => import("@/pages/admin/recruiters/JobDesk"));
const RecruiterApplications = lazyWithReload(() => import("@/pages/admin/recruiters/Applications"));
const RecruiterActivityLog = lazyWithReload(() => import("@/pages/admin/recruiters/ActivityLog"));
const RecruiterEmployerInvites = lazyWithReload(() => import("@/pages/admin/recruiters/EmployerInvites"));
const EmployersOverview = lazyWithReload(() => import("@/pages/admin/employers/EmployersOverview"));
const EmployersPage = lazyWithReload(() => import("@/pages/admin/employers/EmployersPage"));
const EmployerDetail = lazyWithReload(() => import("@/pages/admin/employers/EmployerDetail"));
const EmployersFunnel = lazyWithReload(() => import("@/pages/admin/employers/Funnel"));
const EmployersCvDrops = lazyWithReload(() => import("@/pages/admin/employers/CvDrops"));
const EmployersCareerPages = lazyWithReload(() => import("@/pages/admin/employers/CareerPages"));
const EmployersWhatsapp = lazyWithReload(() => import("@/pages/admin/employers/Whatsapp"));
const EmployersPayments = lazyWithReload(() => import("@/pages/admin/employers/Payments"));
const BusinessDataPage = lazyWithReload(
  () => import("@/pages/admin/management/BusinessData")
);
const SupportTicketsPage = lazyWithReload(
  () => import("@/pages/admin/SupportTicketsPage")
);
const OutsideLinks = lazyWithReload(
  () => import("@/pages/admin/management/OutsideLinks")
);
const OutsideLinkSubmissionsPage = lazyWithReload(
  () => import("@/pages/admin/management/OutsideLinkSubmissionsPage")
);
const Tags = lazyWithReload(() => import("@/pages/admin/management/Tags"));
const Certificates = lazyWithReload(
  () => import("@/pages/admin/management/Certificates")
);

// Email management routes
const EmailDashboard = lazyWithReload(() => import("@/pages/admin/email/EmailDashboard"));
const EmailServers = lazyWithReload(() => import("@/pages/admin/email/EmailServers"));
const EmailTemplates = lazyWithReload(() => import("@/pages/admin/email/EmailTemplates"));
const TemplateEditor = lazyWithReload(() => import("@/pages/admin/email/TemplateEditor"));
const SendEmail = lazyWithReload(() => import("@/pages/admin/email/SendEmail"));
const UnsubscribeManagement = lazyWithReload(
  () => import("@/pages/admin/email/UnsubscribeManagement")
);
const ScheduledEmails = lazyWithReload(
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
      path: "candidates/fitmyskill-data",
      element: FitMySkillDataPage,
    },
    {
      path: "candidates/verification",
      element: VerificationPage,
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
      path: "recruiters/overview",
      element: RecruitersOverview,
    },
    {
      path: "recruiters/dashboard",
      element: RecruitersDashboardRedirect,
    },
    {
      path: "recruiters",
      element: AdminRecruiters,
    },
    // Employer admin 4.1: old Recruiters/Management URLs keep working.
    ...LEGACY_REDIRECTS.map(({ from, to }) => ({ path: from, element: redirectWithQuery(to) })),
    // Employers section (employer admin). Job Desk moved here in 4.1.
    {
      path: "employers/overview",
      element: EmployersOverview,
    },
    {
      path: "employers/job-desk",
      element: RecruiterJobDesk,
    },
    {
      path: "employers/funnel",
      element: EmployersFunnel,
    },
    {
      path: "employers/cv-drops",
      element: EmployersCvDrops,
    },
    {
      path: "employers/career-pages",
      element: EmployersCareerPages,
    },
    {
      path: "employers/whatsapp",
      element: EmployersWhatsapp,
    },
    {
      path: "employers/payments",
      element: EmployersPayments,
    },
    {
      path: "employers",
      element: EmployersPage,
    },
    // Must stay after the fixed employers/* paths above.
    {
      path: "employers/:id",
      element: EmployerDetail,
    },
    // Hiring section shared by recruiters and employers (employer admin 4.1).
    {
      path: "hiring/companies",
      element: RecruiterCompanies,
    },
    {
      path: "hiring/jobs",
      element: RecruiterJobs,
    },
    {
      path: "hiring/applications",
      element: RecruiterApplications,
    },
    {
      path: "hiring/activity",
      element: RecruiterActivityLog,
    },
    {
      path: "recruiters/employer-invites",
      element: RecruiterEmployerInvites,
    },
    {
      path: "recruiters/:id",
      element: RecruiterDetail,
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
