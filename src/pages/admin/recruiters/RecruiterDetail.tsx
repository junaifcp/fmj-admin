// src/pages/admin/recruiters/RecruiterDetail.tsx
// Recruiter admin 5.2: one recruiter. Header + actions + tabs. Each tab loads
// its own endpoint when it is opened (Radix only renders the active tab).
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { recruiterAdminApi } from "@/api/recruiterAdmin";
import type {
  AdminActivityRow,
  AdminNoteRow,
  Paged,
  RecruiterApplicationsRow,
  RecruiterDetail as Detail,
  RecruiterInviteRow,
  RecruiterJobDeskRow,
  RecruiterJobRow,
  FulfillmentPlan,
} from "@/types/recruiterAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth";
import { PATHS } from "@/routes/paths";
import {
  CompanyVerificationBadge,
  ReasonDialog,
  RecruiterStatusBadge,
} from "@/components/admin/recruiters/RecruiterBits";
import {
  AutoFlagChips,
  JobActionsMenu,
  ModerationBadge,
} from "@/components/admin/recruiters/JobModeration";
import { DeskJobActionsMenu, InviteActionsMenu } from "@/components/admin/recruiters/DeskActions";
import { INVITE_STATUS_LABELS, PLAN_LABELS } from "@/components/admin/recruiters/deskLabels";
import { fmtDate, fmtDateTime, personName } from "@/components/admin/recruiters/recruiterFormat";
import { applicationStatusLabel } from "@/constants/applicationStatus";

type ActionKind = "suspend" | "reactivate" | "reonboard" | "verify" | "role";

const FEATURE_LABELS: Record<string, string> = {
  hrms: "HRMS",
  recruitment_platform: "Recruitment platform",
};

const ACTION_LABELS: Record<string, string> = {
  "recruiter.suspend": "Suspended",
  "recruiter.reactivate": "Reactivated",
  "recruiter.reonboard": "Sent back to onboarding",
  "recruiter.verify_profile": "Profile marked verified",
  "user.role_change": "Role changed",
};

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-muted-foreground py-8 text-center">{children}</p>
);

/** Loads one paged tab endpoint and renders it with prev/next paging. */
function PagedTab<T>({
  load,
  render,
  empty,
  reloadKey = 0,
}: {
  load: (page: number, opts: { signal: AbortSignal }) => Promise<Paged<T>>;
  render: (rows: T[]) => React.ReactNode;
  empty: string;
  reloadKey?: number;
}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    load(page, { signal: ctrl.signal })
      .then((d) => setData(d))
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [load, page, reloadKey]);

  if (error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (loading && !data) return <Skeleton className="h-40 w-full" />;
  if (!data || data.data.length === 0) return <Empty>{empty}</Empty>;
  const { pagination } = data;
  return (
    <div className={loading ? "opacity-60" : undefined}>
      <div className="overflow-x-auto">{render(data.data)}</div>
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4 text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          Page {pagination.page} of {pagination.totalPages}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Employer job flow 2.3: application counts use the staff labels; other
// counts (invites) keep the plain key.
const StatusCounts: React.FC<{
  counts: Record<string, number>;
  label?: (key: string) => string;
}> = ({ counts, label }) => {
  const entries = Object.entries(counts).filter(([, n]) => n > 0);
  if (!entries.length) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([k, n]) => (
        <Badge key={k} variant="outline" className={label ? undefined : "capitalize"}>
          {label ? label(k) : k.replace("_", " ")}: {n}
        </Badge>
      ))}
    </div>
  );
};

const RecruiterDetail: React.FC = () => {
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
  const [newRole, setNewRole] = useState("admin");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [notesKey, setNotesKey] = useState(0);
  const [jobsKey, setJobsKey] = useState(0);
  const [deskKey, setDeskKey] = useState(0);
  const [invitesKey, setInvitesKey] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    recruiterAdminApi
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
  const loadJobs = useCallback(
    (page: number, o: { signal: AbortSignal }) => recruiterAdminApi.jobs(id, page, 20, o),
    [id]
  );
  const loadApps = useCallback(
    (page: number, o: { signal: AbortSignal }) => recruiterAdminApi.applications(id, page, 20, o),
    [id]
  );
  const loadDesk = useCallback(
    (page: number, o: { signal: AbortSignal }) => recruiterAdminApi.jobDesk(id, page, 20, o),
    [id]
  );
  const loadInvites = useCallback(
    (page: number, o: { signal: AbortSignal }) => recruiterAdminApi.invites(id, page, 20, o),
    [id]
  );
  const loadActivity = useCallback(
    (page: number, o: { signal: AbortSignal }) => recruiterAdminApi.activity(id, page, 20, o),
    [id]
  );
  const loadNotes = useCallback(
    (page: number, o: { signal: AbortSignal }) => recruiterAdminApi.notes(id, page, 20, o),
    [id]
  );

  const runAction = async (reason: string) => {
    if (!detail || !action) return;
    try {
      if (action === "suspend") await recruiterAdminApi.setActive(id, false, reason);
      if (action === "reactivate") await recruiterAdminApi.setActive(id, true, reason);
      if (action === "reonboard") await recruiterAdminApi.reonboard(id, reason);
      if (action === "verify") await recruiterAdminApi.verifyProfile(id, reason);
      if (action === "role") await recruiterAdminApi.changeRole(id, newRole, reason);
      toast({ title: "Saved", description: "Recorded in the activity log" });
      setAction(null);
      // An admin is no longer a recruiter, so this page would 404: go back to the list.
      if (action === "role" && newRole !== "recruiter") {
        navigate(PATHS.ADMIN.RECRUITERS_ADMIN.LIST);
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
      await recruiterAdminApi.addNote(id, noteText.trim());
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
      <Link to={PATHS.ADMIN.RECRUITERS_ADMIN.LIST}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        All recruiters
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

  const { user, profile, stats, companies } = detail;
  const name = personName(user);
  const initials = (name.match(/\b\w/g) || [user.email[0]]).slice(0, 2).join("").toUpperCase();

  const dialogs: Record<
    ActionKind,
    { title: string; description: string; confirm: string; destructive?: boolean; required?: boolean }
  > = {
    suspend: {
      title: "Suspend recruiter",
      description: `${user.email} will be signed out and blocked from the recruiter portal. Their jobs stay as they are.`,
      confirm: "Suspend",
      destructive: true,
      required: true,
    },
    reactivate: {
      title: "Reactivate recruiter",
      description: `${user.email} can sign in to the recruiter portal again.`,
      confirm: "Reactivate",
    },
    reonboard: {
      title: "Send back to onboarding",
      description: "The recruiter sees the company onboarding form again the next time they open the app.",
      confirm: "Re-onboard",
    },
    verify: {
      title: "Mark profile verified",
      description: "Marks onboarding as complete without the recruiter filling it in.",
      confirm: "Mark verified",
    },
    role: {
      title: "Change role",
      description: `${user.email} loses recruiter access if moved to an admin role.`,
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
                <img
                  src={user.profileImageUrl}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
                  {initials}
                </div>
              )}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight">{name}</h1>
                  <RecruiterStatusBadge isActive={profile.isActive} />
                  {!profile.basicInfoProvided && <Badge variant="secondary">Not onboarded</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span>{profile.company || "No company"}</span>
                  {profile.companyId && (
                    <CompanyVerificationBadge
                      value={companies.find((c) => c._id === profile.companyId)?.verified ?? "pending"}
                    />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Joined {fmtDate(user.createdAt)} · Last active {fmtDate(user.lastActive)}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    Actions
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {profile.isActive ? (
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => setAction("suspend")}
                    >
                      Suspend…
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => setAction("reactivate")}>
                      Reactivate…
                    </DropdownMenuItem>
                  )}
                  {profile.basicInfoProvided ? (
                    <DropdownMenuItem onSelect={() => setAction("reonboard")}>
                      Send back to onboarding…
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => setAction("verify")}>
                      Mark profile verified…
                    </DropdownMenuItem>
                  )}
                  {isSuperadmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => {
                          setNewRole("admin");
                          setAction("role");
                        }}
                      >
                        Change role…
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {!profile.isActive && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Suspended {fmtDateTime(profile.suspendedAt)}</AlertTitle>
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
            <TabsTrigger value="companies">Companies ({companies.length})</TabsTrigger>
            <TabsTrigger value="jobs">Jobs ({stats.jobs})</TabsTrigger>
            <TabsTrigger value="applications">Applications ({stats.applications})</TabsTrigger>
            <TabsTrigger value="job-desk">Job desk ({stats.jobDeskClaims})</TabsTrigger>
            <TabsTrigger value="invites">Employer invites</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Jobs", value: stats.jobs, sub: `${stats.jobsByStatus.active ?? 0} active` },
              { label: "Applications", value: stats.applications, sub: `${stats.applicationsByStatus.applied ?? 0} not reviewed yet` },
              { label: "Hires", value: stats.hires, sub: "on jobs they own" },
              { label: "Job desk claims", value: stats.jobDeskClaims, sub: "employer jobs" },
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
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Position</dt>
                  <dd>{profile.position || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{profile.phone ? `${profile.dialCode || ""} ${profile.phone}`.trim() : "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email verified</dt>
                  <dd>{user.isEmailVerified ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Wants</dt>
                  <dd>
                    {profile.features.length
                      ? profile.features.map((f) => FEATURE_LABELS[f] ?? f).join(", ")
                      : "Not recorded"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Bio</dt>
                  <dd className="whitespace-pre-line">{profile.bio || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Applications by stage</dt>
                  <dd className="mt-1">
                    <StatusCounts counts={stats.applicationsByStatus} label={applicationStatusLabel} />
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Employer invites</dt>
                  <dd className="mt-1">
                    <StatusCounts counts={stats.invitesByStatus} />
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardContent className="pt-6">
              {companies.length > 0 && (
                <div className="flex justify-end mb-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`${PATHS.ADMIN.HIRING.COMPANIES}?tab=all&ownerId=${user._id}`}>
                      Review in Companies
                    </Link>
                  </Button>
                </div>
              )}
              {companies.length === 0 ? (
                <Empty>No companies</Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((c) => (
                      <TableRow key={c._id}>
                        <TableCell className="font-medium">
                          {c.name}
                          {c._id === profile.companyId && (
                            <span className="ml-2 text-xs text-muted-foreground">(profile)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.website ? (
                            <a
                              href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-primary hover:underline"
                            >
                              {c.website}
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <CompanyVerificationBadge value={c.verified ?? "pending"} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(c.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardContent className="pt-6">
              {stats.jobs > 0 && (
                <div className="flex justify-end mb-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`${PATHS.ADMIN.HIRING.JOBS}?tab=all&recruiterId=${user._id}`}>
                      Open in Jobs
                    </Link>
                  </Button>
                </div>
              )}
              <PagedTab<RecruiterJobRow>
                load={loadJobs}
                reloadKey={jobsKey}
                empty="No jobs posted or claimed"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Applications</TableHead>
                        <TableHead>Poster</TableHead>
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
                          <TableCell>
                            <Badge variant="outline">
                              {j.source === "claimed" ? "Job desk" : "Posted"}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{j.status}</TableCell>
                          <TableCell className="text-right">{j.applicationCount}</TableCell>
                          <TableCell className="text-sm capitalize">
                            {j.posterStatus === "failed" ? (
                              <span className="text-destructive">Failed</span>
                            ) : (
                              j.posterStatus ?? "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <ModerationBadge status={j.moderation.status} />
                            <AutoFlagChips flags={j.moderation.autoFlags} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fmtDate(j.createdAt)}
                          </TableCell>
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

        <TabsContent value="applications">
          <Card>
            <CardContent className="pt-6">
              {stats.applications > 0 && (
                <div className="flex justify-end mb-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`${PATHS.ADMIN.HIRING.APPLICATIONS}?recruiterId=${user._id}`}>
                      Open in Applications
                    </Link>
                  </Button>
                </div>
              )}
              <PagedTab<RecruiterApplicationsRow>
                load={loadApps}
                empty="No applications on this recruiter's jobs"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>By stage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.jobId}>
                          <TableCell>
                            <div className="font-medium">{r.title || "—"}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {r.jobStatus ?? ""}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{r.total}</TableCell>
                          <TableCell>
                            <StatusCounts counts={r.byStatus} label={applicationStatusLabel} />
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

        <TabsContent value="job-desk">
          <Card>
            <CardContent className="pt-6">
              {stats.jobDeskClaims > 0 && (
                <div className="flex justify-end mb-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`${PATHS.ADMIN.EMPLOYERS_ADMIN.JOB_DESK}?tab=assigned&recruiterId=${user._id}`}>
                      Open in Job Desk
                    </Link>
                  </Button>
                </div>
              )}
              <PagedTab<RecruiterJobDeskRow>
                load={loadDesk}
                reloadKey={deskKey}
                empty="No employer jobs claimed"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Employer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Claimed</TableHead>
                        <TableHead className="text-right">Applicants</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((j) => (
                        <TableRow key={j._id}>
                          <TableCell>
                            <div className="font-medium">{j.title}</div>
                            <div className="text-xs text-muted-foreground">{j.company ?? "—"}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {j.employer ? (
                              <>
                                <div>{j.employer.name || j.employer.email}</div>
                                {j.employer.name && (
                                  <div className="text-xs text-muted-foreground">{j.employer.email}</div>
                                )}
                              </>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {PLAN_LABELS[j.fulfillmentPlan as FulfillmentPlan] ?? j.fulfillmentPlan}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fmtDate(j.assignedAt)}
                          </TableCell>
                          <TableCell className="text-right">{j.applicationCount}</TableCell>
                          <TableCell className="capitalize">{j.status}</TableCell>
                          <TableCell className="text-right">
                            <DeskJobActionsMenu
                              jobId={j._id}
                              jobTitle={j.title}
                              assignedRecruiterId={user._id}
                              plan={j.fulfillmentPlan as FulfillmentPlan}
                              closed={j.status === "closed"}
                              onDone={() => {
                                setDeskKey((n) => n + 1);
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

        <TabsContent value="invites">
          <Card>
            <CardContent className="pt-6">
              <PagedTab<RecruiterInviteRow>
                load={loadInvites}
                reloadKey={invitesKey}
                empty="No employer invites sent"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invited</TableHead>
                        <TableHead>Job</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-sm">{s.email}</TableCell>
                          <TableCell className="text-sm">{s.jobTitle || "—"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={s.status === "send_failed" ? "destructive" : "outline"}
                              className="capitalize"
                            >
                              {INVITE_STATUS_LABELS[s.status] ?? s.status}
                            </Badge>
                            {s.lastError && (
                              <div className="text-xs text-destructive mt-1">{s.lastError}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {s.whatsapp ? `${s.whatsapp.number ?? ""} · ${s.whatsapp.status}` : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fmtDate(s.sentAt ?? s.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <InviteActionsMenu
                              inviteId={s.id}
                              email={s.email}
                              status={s.status}
                              onDone={() => {
                                setInvitesKey((n) => n + 1);
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

        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end mb-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`${PATHS.ADMIN.HIRING.ACTIVITY}?targetId=${user._id}`}>
                    Open in Activity Log
                  </Link>
                </Button>
              </div>
              <PagedTab<AdminActivityRow>
                load={loadActivity}
                reloadKey={reloadKey}
                empty="No admin actions on this recruiter yet"
                render={(rows) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Admin</TableHead>
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
                          <TableCell className="text-sm">{personName(a.actorId)}</TableCell>
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

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Label htmlFor="new-note">Add a note (only admins see notes)</Label>
              <Textarea
                id="new-note"
                value={noteText}
                maxLength={2000}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Called on 11 Nov, wants help posting jobs"
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
                  <SelectItem value="recruiter">Recruiter</SelectItem>
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

export default RecruiterDetail;
