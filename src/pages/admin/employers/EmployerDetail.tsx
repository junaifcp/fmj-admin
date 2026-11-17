// src/pages/admin/employers/EmployerDetail.tsx
// Employer admin 6.2: one employer. Header + actions + tabs. Each tab loads its
// own endpoint when opened (Radix only renders the active tab). Every action
// goes through ReasonDialog and is audited on the server (6.1).
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { employerAdminApi } from "@/api/employerAdmin";
import type { AdminActivityRow, AdminNoteRow } from "@/types/recruiterAdmin";
import type {
  EmployerApplicationsRow,
  EmployerCvDropRow,
  EmployerDetail as Detail,
  EmployerDraftRow,
  EmployerJobRow,
  EmployerPaymentRow,
  EmployerSharedJobRow,
  EmployerWhatsappRow,
} from "@/types/employerAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, ChevronDown, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth";
import { PATHS } from "@/routes/paths";
import {
  CompanyVerificationBadge,
  ReasonDialog,
  RecruiterStatusBadge,
} from "@/components/admin/recruiters/RecruiterBits";
import { AutoFlagChips, JobActionsMenu, ModerationBadge } from "@/components/admin/recruiters/JobModeration";
import { PLAN_LABELS } from "@/components/admin/recruiters/deskLabels";
import { fmtDate, fmtDateTime, personName } from "@/components/admin/recruiters/recruiterFormat";
import { PagedTab } from "@/components/admin/hiring/PagedTab";
import OwnerLink from "@/components/admin/hiring/OwnerLink";
import {
  CHANNEL_LABELS,
  DRAFT_STEP_LABELS,
  SOURCE_LONG_LABELS,
  WHATSAPP_TEMPLATE_LABELS,
} from "@/components/admin/employers/employerLabels";
import SourceBadge from "@/components/admin/employers/SourceBadge";
import CvDropRowMenu from "@/components/admin/employers/CvDropRowMenu";
import RecordPaymentDialog from "@/components/admin/employers/RecordPaymentDialog";
import { applicationStatusLabel } from "@/constants/applicationStatus";

type ActionKind =
  | "suspend"
  | "reactivate"
  | "revoke"
  | "reonboard"
  | "whatsappOff"
  | "whatsappOn"
  | "cvDropOff"
  | "cvDropOn"
  | "cvDropRotate"
  | "careerOff"
  | "careerOn"
  | "role";

const ACTION_LABELS: Record<string, string> = {
  "employer.suspend": "Deactivated",
  "employer.delete": "Deleted",
  "employer.reactivate": "Reactivated",
  "employer.revoke_sessions": "Signed out everywhere",
  "employer.reonboard": "Sent back to onboarding",
  "employer.whatsapp_opt_out": "WhatsApp turned off",
  "employer.whatsapp_opt_in": "WhatsApp turned on",
  "employer.cv_drop_toggle": "CV drop link turned on/off",
  "employer.cv_drop_rotate": "CV drop code changed",
  "employer.career_page_toggle": "Career page turned on/off",
  "user.role_change": "Role changed",
  "company.reset_pending": "Company sent back to review",
};

const StatusCounts: React.FC<{ counts: Record<string, number> }> = ({ counts }) => {
  const entries = Object.entries(counts).filter(([, n]) => n > 0);
  if (!entries.length) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([k, n]) => (
        <Badge key={k} variant="outline">
          {applicationStatusLabel(k)}: {n}
        </Badge>
      ))}
    </div>
  );
};

type TabFetcher<T> = (id: string, page: number, limit: number, o: { signal: AbortSignal }) => Promise<T>;

/** A loader for one tab, stable for a given employer id (the API functions never change). */
function useTabLoader<T>(id: string, fn: TabFetcher<T>) {
  return useCallback((page: number, o: { signal: AbortSignal }) => fn(id, page, 20, o), [id, fn]);
}

const rupees = (paise?: number) =>
  paise == null ? "—" : `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const EmployerDetail: React.FC = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const isSuperadmin = me?.role === "superadmin";

  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [action, setAction] = useState<ActionKind | null>(null);
  const [newRole, setNewRole] = useState("recruiter");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [notesKey, setNotesKey] = useState(0);
  const [jobsKey, setJobsKey] = useState(0);
  const [cvKey, setCvKey] = useState(0);
  const [paymentsKey, setPaymentsKey] = useState(0);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    employerAdminApi
      .getDetail(id, { signal: ctrl.signal })
      .then(setDetail)
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [id, reloadKey]);

  // Stable loaders so tabs don't refetch on every render.
  const loadJobs = useTabLoader(id, employerAdminApi.jobs);
  const loadApps = useTabLoader(id, employerAdminApi.applications);
  const loadDrafts = useTabLoader(id, employerAdminApi.drafts);
  const loadCvDrops = useTabLoader(id, employerAdminApi.cvDrops);
  const loadShared = useTabLoader(id, employerAdminApi.sharedJobs);
  const loadWhatsapp = useTabLoader(id, employerAdminApi.whatsapp);
  const loadPayments = useTabLoader(id, employerAdminApi.payments);
  const loadActivity = useTabLoader(id, employerAdminApi.activity);
  const loadNotes = useTabLoader(id, employerAdminApi.notes);

  const runAction = async (reason: string) => {
    if (!detail || !action) return;
    try {
      switch (action) {
        case "suspend":
          await employerAdminApi.setActive(id, false, reason);
          break;
        case "reactivate":
          await employerAdminApi.setActive(id, true, reason);
          break;
        case "revoke":
          await employerAdminApi.revokeSessions(id, reason);
          break;
        case "reonboard":
          await employerAdminApi.reonboard(id, reason);
          break;
        case "whatsappOff":
          await employerAdminApi.setWhatsappOptOut(id, true, reason);
          break;
        case "whatsappOn":
          await employerAdminApi.setWhatsappOptOut(id, false, reason);
          break;
        case "cvDropOff":
          await employerAdminApi.setCvDrop(id, false, reason);
          break;
        case "cvDropOn":
          await employerAdminApi.setCvDrop(id, true, reason);
          break;
        case "cvDropRotate":
          await employerAdminApi.rotateCvDrop(id, reason);
          break;
        case "careerOff":
          await employerAdminApi.setCareerPage(id, false, reason);
          break;
        case "careerOn":
          await employerAdminApi.setCareerPage(id, true, reason);
          break;
        case "role":
          await employerAdminApi.changeRole(id, newRole, reason);
          break;
      }
      toast({ title: "Saved", description: "Recorded in the activity log" });
      setAction(null);
      // Someone who is no longer an employer has no Employer Detail page.
      if (action === "role" && newRole !== "employer") {
        navigate(PATHS.ADMIN.EMPLOYERS_ADMIN.LIST);
        return;
      }
      setReloadKey((n) => n + 1);
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const addNote = async () => {
    try {
      setSavingNote(true);
      await employerAdminApi.addNote(id, noteText.trim());
      setNoteText("");
      setNotesKey((n) => n + 1);
    } catch (e) {
      toast({
        title: "Could not add note",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSavingNote(false);
    }
  };

  const back = (
    <Button asChild variant="ghost" size="sm">
      <Link to={PATHS.ADMIN.EMPLOYERS_ADMIN.LIST}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        All employers
      </Link>
    </Button>
  );

  if (loading && !detail) {
    return (
      <div className="space-y-6">
        {back}
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (error && !detail) {
    return (
      <div className="space-y-4">
        {back}
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => setReloadKey((n) => n + 1)}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (!detail) return null;

  const { user, profile, company, careerPage, cvDrop, stats } = detail;
  const name = personName(user);
  const initials = (name.match(/\b\w/g) || [user.email[0]]).slice(0, 2).join("").toUpperCase();
  const wa = profile.whatsapp;
  const waStatus = wa.optOutAt
    ? `Opted out ${fmtDate(wa.optOutAt)}`
    : wa.consentAt
      ? `Consented ${fmtDate(wa.consentAt)}`
      : wa.skippedAt
        ? `Skipped ${fmtDate(wa.skippedAt)}`
        : "No WhatsApp";
  const acq = profile.acquisition;

  const dialogs: Record<
    ActionKind,
    { title: string; description: string; confirm: string; destructive?: boolean; required?: boolean }
  > = {
    suspend: {
      title: "Deactivate employer",
      description: `${user.email} is signed out and can't sign in until reactivated. Their career page and CV drop link stop working. Their jobs stay up; remove them in Hiring → Jobs if needed.`,
      confirm: "Deactivate",
      destructive: true,
      required: true,
    },
    reactivate: {
      title: "Reactivate employer",
      description: `${user.email} can sign in again, and their career page and CV drop link work again.`,
      confirm: "Reactivate",
    },
    revoke: {
      title: "Sign out everywhere",
      description: "Ends every session on every device. They can sign in again with a code.",
      confirm: "Sign out",
    },
    reonboard: {
      title: "Send back to onboarding",
      description: "The employer sees the company onboarding form again the next time they open the app.",
      confirm: "Re-onboard",
    },
    whatsappOff: {
      title: "Turn off WhatsApp",
      description: "No WhatsApp message will be sent to this employer. They still get emails.",
      confirm: "Turn off",
      destructive: true,
      required: true,
    },
    whatsappOn: {
      title: "Turn WhatsApp back on",
      description: "Only do this if the employer asked for WhatsApp messages again.",
      confirm: "Turn on",
    },
    cvDropOff: {
      title: "Turn off the CV drop link",
      description: "The QR code and link show “This link is not active” until turned back on.",
      confirm: "Turn off",
      destructive: true,
    },
    cvDropOn: {
      title: "Turn on the CV drop link",
      description: "The existing QR code and link work again.",
      confirm: "Turn on",
    },
    cvDropRotate: {
      title: "Change the CV drop code",
      description: "The old QR code and link stop working at once. The employer must print the new poster.",
      confirm: "Change code",
      destructive: true,
    },
    careerOff: {
      title: "Turn off the career page",
      description: "The public career page shows “not found” until turned back on.",
      confirm: "Turn off",
      destructive: true,
    },
    careerOn: {
      title: "Turn on the career page",
      description: "The public career page is visible again.",
      confirm: "Turn on",
    },
    role: {
      title: "Change role",
      description: `${user.email} loses employer access if moved to another role.`,
      confirm: "Change role",
      required: true,
    },
  };
  const d = action ? dialogs[action] : null;

  return (
    <div className="space-y-6">
      {back}

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
                  {initials}
                </div>
              )}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight">{name}</h1>
                  <RecruiterStatusBadge isActive={profile.isActive} deletedAt={profile.deletedAt} />
                  <SourceBadge source={acq?.source ?? null} />
                  {!profile.basicInfoProvided && <Badge variant="secondary">Not onboarded</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span>{company?.name || "No company"}</span>
                  {company && <CompanyVerificationBadge value={company.verified} />}
                </div>
                <div className="text-xs text-muted-foreground">
                  Joined {fmtDate(user.createdAt)} · Last active {fmtDate(user.lastActive)} · WhatsApp:{" "}
                  {waStatus}
                  {acq?.utmCampaign && ` · Campaign ${acq.utmCampaign}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReloadKey((n) => n + 1)}
                aria-label="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              {!profile.deletedAt && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      Actions
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {profile.isActive ? (
                      <DropdownMenuItem className="text-destructive" onSelect={() => setAction("suspend")}>
                        Deactivate…
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => setAction("reactivate")}>Reactivate…</DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={() => setAction("revoke")}>Sign out everywhere…</DropdownMenuItem>
                    {profile.basicInfoProvided && (
                      <DropdownMenuItem onSelect={() => setAction("reonboard")}>
                        Send back to onboarding…
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {wa.optOutAt ? (
                      <DropdownMenuItem onSelect={() => setAction("whatsappOn")}>Turn WhatsApp on…</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => setAction("whatsappOff")}>Turn WhatsApp off…</DropdownMenuItem>
                    )}
                    {cvDrop.code && (
                      <>
                        {cvDrop.enabled ? (
                          <DropdownMenuItem onSelect={() => setAction("cvDropOff")}>
                            Turn CV drop link off…
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => setAction("cvDropOn")}>
                            Turn CV drop link on…
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => setAction("cvDropRotate")}>
                          Change CV drop code…
                        </DropdownMenuItem>
                      </>
                    )}
                    {careerPage.enabled ? (
                      <DropdownMenuItem onSelect={() => setAction("careerOff")}>Turn career page off…</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => setAction("careerOn")}>Turn career page on…</DropdownMenuItem>
                    )}
                    {isSuperadmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => {
                            setNewRole("recruiter");
                            setAction("role");
                          }}
                        >
                          Change role…
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {profile.deletedAt ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Deleted {fmtDateTime(profile.deletedAt)}</AlertTitle>
              <AlertDescription>
                {profile.deletedReason || "No reason recorded"}
                {profile.deletedBy && ` — by ${profile.deletedBy.name || profile.deletedBy.email}`}
                . This email can't sign in or sign up again.
              </AlertDescription>
            </Alert>
          ) : !profile.isActive && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Deactivated {fmtDateTime(profile.suspendedAt)}</AlertTitle>
              <AlertDescription>
                {profile.suspendedReason || "No reason recorded"}
                {profile.suspendedBy && ` — by ${profile.suspendedBy.name || profile.suspendedBy.email}`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Jobs ({stats.jobs})</TabsTrigger>
            <TabsTrigger value="applications">Applications ({stats.applications})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="cv-drops">CV drops ({cvDrop.total})</TabsTrigger>
            <TabsTrigger value="career">Career page</TabsTrigger>
            <TabsTrigger value="shared">Shared jobs ({stats.sharedJobs})</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp ({stats.whatsappMessages})</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Jobs", value: stats.jobs, sub: `${stats.jobsByStatus.active ?? 0} active` },
              {
                label: "Applications",
                value: stats.applications,
                sub: `${stats.applicationsByStatus.applied ?? 0} not reviewed yet`,
              },
              { label: "Hires", value: stats.hires, sub: "on jobs they posted" },
              {
                label: "CV drops",
                value: cvDrop.total,
                sub: cvDrop.new ? `${cvDrop.new} not contacted` : "all contacted",
              },
            ].map((c) => (
              <Card key={c.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{c.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile and sign-up</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{profile.phone ? `${profile.dialCode || ""} ${profile.phone}`.trim() : "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">WhatsApp</dt>
                  <dd>
                    {wa.number ?? "—"} · {waStatus}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Position</dt>
                  <dd>{profile.position || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email verified</dt>
                  <dd>{user.isEmailVerified ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Came from</dt>
                  <dd>{acq?.source ? SOURCE_LONG_LABELS[acq.source] : "Not recorded"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Channel and campaign</dt>
                  <dd>
                    {acq
                      ? [
                          CHANNEL_LABELS[acq.channel ?? ""] ?? acq.channel,
                          acq.utmSource,
                          acq.utmMedium,
                          acq.utmCampaign,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Open post-a-job draft</dt>
                  <dd>{stats.openDraftStep ? DRAFT_STEP_LABELS[stats.openDraftStep] : "None"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Company</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    {company ? (
                      <>
                        <Link
                          to={`${PATHS.ADMIN.HIRING.COMPANIES}?tab=all&ownerId=${user._id}`}
                          className="text-primary hover:underline"
                        >
                          {company.name}
                        </Link>
                        {company.website && (
                          <a
                            href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-muted-foreground hover:text-primary"
                            aria-label="Open company website"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Applications by stage</dt>
                  <dd className="mt-1">
                    <StatusCounts counts={stats.applicationsByStatus} />
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs */}
        <TabsContent value="jobs">
          <Card>
            <CardContent className="pt-6">
              {stats.jobs > 0 && (
                <div className="flex justify-end mb-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`${PATHS.ADMIN.HIRING.JOBS}?tab=all&recruiterId=${user._id}`}>Open in Jobs</Link>
                  </Button>
                </div>
              )}
              <PagedTab<EmployerJobRow>
                load={loadJobs}
                reloadKey={jobsKey}
                empty="No jobs posted yet"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Applications</TableHead>
                        <TableHead>Job desk</TableHead>
                        <TableHead>Moderation</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((j) => (
                        <TableRow key={j._id}>
                          <TableCell>
                            <div className="font-medium flex items-center gap-1">
                              {j.title}
                              {j.publicUrl && (
                                <a
                                  href={j.publicUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  aria-label="Open public job page"
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {[j.company?.name, j.city].filter(Boolean).join(" · ") || "—"}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{j.status}</TableCell>
                          <TableCell className="text-right">{j.applicationCount}</TableCell>
                          <TableCell className="text-sm">
                            <div>{PLAN_LABELS[j.fulfillmentPlan] ?? j.fulfillmentPlan}</div>
                            {j.assignee ? (
                              <OwnerLink id={j.assignee._id} role="recruiter" className="text-xs">
                                {j.assignee.name || j.assignee.email}
                              </OwnerLink>
                            ) : (
                              <div className="text-xs text-muted-foreground">Unclaimed</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <ModerationBadge status={j.moderation.status} />
                            <AutoFlagChips flags={j.moderation.autoFlags} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmtDate(j.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <JobActionsMenu
                              jobId={j._id}
                              jobTitle={j.title}
                              status={j.status}
                              moderationStatus={j.moderation.status}
                              posterStatus={j.posterStatus}
                              onDone={() => {
                                setJobsKey((n) => n + 1);
                                setReloadKey((n) => n + 1);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications */}
        <TabsContent value="applications">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-3">Counts per job. Candidate details are not shown here.</p>
              <PagedTab<EmployerApplicationsRow>
                load={loadApps}
                empty="No applications yet"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead className="text-right">Applications</TableHead>
                        <TableHead>By stage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.jobId}>
                          <TableCell>
                            <div className="font-medium">{r.title || "—"}</div>
                            {r.jobStatus && (
                              <div className="text-xs text-muted-foreground capitalize">{r.jobStatus}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{r.total}</TableCell>
                          <TableCell>
                            <StatusCounts counts={r.byStatus} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drafts */}
        <TabsContent value="drafts">
          <Card>
            <CardContent className="pt-6">
              <PagedTab<EmployerDraftRow>
                load={loadDrafts}
                empty="No /post-a-job drafts"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job title</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Step</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Last saved</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r._id}>
                          <TableCell className="font-medium">{r.title || "(no title yet)"}</TableCell>
                          <TableCell className="text-sm">{r.company || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "posted" ? "default" : "secondary"}>
                              {DRAFT_STEP_LABELS[r.step] ?? r.step}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmtDateTime(r.createdAt)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmtDateTime(r.lastSavedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CV drops */}
        <TabsContent value="cv-drops" className="space-y-4">
          <Card>
            <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <div className="font-medium">
                  CV drop link{" "}
                  <Badge variant={cvDrop.enabled ? "outline" : "destructive"}>{cvDrop.enabled ? "On" : "Off"}</Badge>
                </div>
                <div className="text-muted-foreground">
                  {cvDrop.publicUrl ? (
                    <a href={cvDrop.publicUrl} target="_blank" rel="noreferrer noopener" className="hover:underline">
                      {cvDrop.publicUrl}
                    </a>
                  ) : (
                    "Not created yet (made when the employer opens CV drop)"
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-3">
                Phone and email are masked. Opening a CV file is recorded in the activity log.
              </p>
              <PagedTab<EmployerCvDropRow>
                load={loadCvDrops}
                reloadKey={cvKey}
                empty="No CVs dropped yet"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Role / job</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r._id}>
                          <TableCell>
                            <div className="font-medium">{r.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {[r.phone, r.email].filter(Boolean).join(" · ")}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{r.job?.title || r.roleInterest || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "new" ? "secondary" : "outline"}>
                              {r.status === "new" ? "New" : `Contacted ${fmtDate(r.contactedAt)}`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmtDateTime(r.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <CvDropRowMenu
                              id={r._id}
                              candidateName={r.name}
                              onDeleted={() => {
                                setCvKey((n) => n + 1);
                                setReloadKey((n) => n + 1);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Career page */}
        <TabsContent value="career">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant={careerPage.enabled ? "outline" : "destructive"}>
                      {careerPage.enabled ? "On" : "Off"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Search engines</dt>
                  <dd>{careerPage.verified ? "Indexed (company verified)" : "Not indexed until the company is verified"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Public page</dt>
                  <dd>
                    {careerPage.publicUrl ? (
                      <a
                        href={careerPage.publicUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {careerPage.publicUrl}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      "No link yet (made when the employer opens Career page)"
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shared jobs */}
        <TabsContent value="shared">
          <Card>
            <CardContent className="pt-6">
              <PagedTab<EmployerSharedJobRow>
                load={loadShared}
                empty="No jobs shared with this employer"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Shared by</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Accepted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((s) => (
                        <TableRow key={s._id}>
                          <TableCell className="font-medium">{s.job?.title ?? "—"}</TableCell>
                          <TableCell className="text-sm">
                            {s.recruiter ? (
                              <OwnerLink id={s.recruiter._id} role="recruiter">
                                {s.recruiter.name || s.recruiter.email}
                              </OwnerLink>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {s.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmtDate(s.acceptedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp */}
        <TabsContent value="whatsapp">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-3">
                Template and delivery status only; message text is not stored. Messages from before 12 Nov 2026
                appear once the log backfill runs.
              </p>
              <PagedTab<EmployerWhatsappRow>
                load={loadWhatsapp}
                empty="No WhatsApp messages to this employer"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Message</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((m) => (
                        <TableRow key={m._id}>
                          <TableCell>
                            <div className="font-medium">{WHATSAPP_TEMPLATE_LABELS[m.template] ?? m.template}</div>
                            {m.job && <div className="text-xs text-muted-foreground">{m.job.title}</div>}
                          </TableCell>
                          <TableCell className="text-sm">{m.to ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant={m.status === "failed" ? "destructive" : "outline"} className="capitalize">
                              {m.error === "opted_out" ? "Skipped (opted out)" : m.status}
                            </Badge>
                            {m.error && m.error !== "opted_out" && (
                              <div className="text-xs text-destructive mt-1">{m.error}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmtDateTime(m.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end gap-2 mb-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`${PATHS.ADMIN.EMPLOYERS_ADMIN.PAYMENTS}?employerId=${user._id}`}>Open in Paid Services</Link>
                </Button>
                <Button size="sm" onClick={() => setPaying(true)} disabled={stats.jobs === 0}>
                  Record payment
                </Button>
              </div>
              <PagedTab<EmployerPaymentRow>
                load={loadPayments}
                reloadKey={paymentsKey}
                empty="No paid services recorded for this employer"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((p) => (
                        <TableRow key={p._id}>
                          <TableCell>{p.plan ? (PLAN_LABELS as Record<string, string>)[p.plan] ?? p.plan : "—"}</TableCell>
                          <TableCell className="text-right">{rupees(p.amountPaise)}</TableCell>
                          <TableCell className="capitalize">{p.status ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmtDate(p.paidAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end mb-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`${PATHS.ADMIN.HIRING.ACTIVITY}?targetId=${user._id}`}>Open in Activity Log</Link>
                </Button>
              </div>
              <PagedTab<AdminActivityRow>
                load={loadActivity}
                reloadKey={reloadKey}
                empty="No admin actions on this employer yet"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>By</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((a) => (
                        <TableRow key={a._id}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {fmtDateTime(a.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {a.actorRole === "system" ? "System" : personName(a.actorId)}
                          </TableCell>
                          <TableCell className="text-sm">{ACTION_LABELS[a.action] ?? a.action}</TableCell>
                          <TableCell className="text-xs font-mono">
                            {a.before || a.after
                              ? `${JSON.stringify(a.before ?? {})} → ${JSON.stringify(a.after ?? {})}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm">{a.reason || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Label htmlFor="new-note">Add a note (only admins see notes)</Label>
              <Textarea
                id="new-note"
                value={noteText}
                maxLength={2000}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Called on 12 Nov, wants Smart Hire for the sales role"
              />
              <div className="flex justify-end">
                <Button onClick={addNote} disabled={savingNote || !noteText.trim()}>
                  {savingNote ? "Saving…" : "Add note"}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <PagedTab<AdminNoteRow>
                load={loadNotes}
                reloadKey={notesKey}
                empty="No notes yet"
                render={(rows) => (
                  <ul className="space-y-4">
                    {rows.map((n) => (
                      <li key={n._id} className="border-b pb-3 last:border-0">
                        <div className="text-xs text-muted-foreground">
                          {personName(n.createdBy)} · {fmtDateTime(n.createdAt)}
                        </div>
                        <p className="text-sm whitespace-pre-line mt-1">{n.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RecordPaymentDialog
        open={paying}
        onOpenChange={setPaying}
        employerId={user._id}
        onRecorded={() => {
          setPaymentsKey((n) => n + 1);
          setJobsKey((n) => n + 1);
        }}
      />

      {d && (
        <ReasonDialog
          open={!!action}
          title={d.title}
          description={d.description}
          confirmLabel={d.confirm}
          destructive={d.destructive}
          reasonRequired={d.required}
          confirmDisabled={action === "role" && newRole === user.role}
          onCancel={() => setAction(null)}
          onConfirm={runAction}
        >
          {action === "role" && (
            <div className="space-y-2">
              <Label htmlFor="new-role">New role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employer">Employer</SelectItem>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                  <SelectItem value="user">Candidate</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </ReasonDialog>
      )}
    </div>
  );
};

export default EmployerDetail;

