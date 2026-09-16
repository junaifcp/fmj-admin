import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ApplicationCard from "@/components/recruiter/ApplicationCard";
import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  getRecruiterStats,
  updateApplicationStatus,
  linkReferralCode,
} from "@/api/recruiter";
import type { RecruiterStats } from "@/types/recruiter";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";

const RecruiterDashboard: React.FC = () => {
  const [stats, setStats] = useState<RecruiterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { trackDashboardViewed, trackApplicationStatusUpdated } =
    useAnalytics();

  useEffect(() => {
    let mounted = true;

    const REF_LOCAL_KEY = "signup_referral";

    const tryLinkReferral = async () => {
      // only attempt if there's a referral saved
      const code = localStorage.getItem(REF_LOCAL_KEY);
      if (!code) {
        // no referral to process
        return;
      }

      console.debug("[REF LINK] Found referral in localStorage:", code);

      // wait for token (with small retries)
      try {
        const result = await linkReferralCode(code);
        console.debug("[REF LINK] API result:", result);

        // treat success if backend returns success===true or a message
        if (
          result &&
          (result.success === true || typeof result.message === "string")
        ) {
          // remove from storage on success
          localStorage.removeItem(REF_LOCAL_KEY);
          if (!mounted) return;

          toast.success(
            result.success === true
              ? "Referral applied — thanks for signing up!"
              : result.message || "Referral applied"
          );
        } else {
          // If backend returned an explicit error object, decide policy:
          // - If it's an invalid code (400/404), remove from storage (no retry).
          // - If it's an empty/unexpected response, log and keep for retry.
          console.warn(
            "[REF LINK] Unexpected response from linkReferralCode:",
            result
          );
          // attempt safe removal if server says invalid
          if (
            result &&
            (result.error === "INVALID_CODE" ||
              (result.success === false &&
                result.message?.toLowerCase()?.includes("invalid")))
          ) {
            localStorage.removeItem(REF_LOCAL_KEY);
            if (mounted) {
              toast.error(result.message || "Invalid referral code.");
            }
          }
        }
      } catch (err: any) {
        // createAuthenticatedRequest throws RecruiterAPIError for non-2xx
        console.error("[REF LINK] request failed:", err);
        // On network / transient errors, keep referral in localStorage for a retry later
        if (mounted) {
          toast.error(
            "Could not apply referral automatically — we'll try again next time."
          );
        }
      }
    };

    // run non-blocking
    tryLinkReferral();

    return () => {
      mounted = false;
    };
    // only run when dashboard mounts; getAuthToken is stable
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getRecruiterStats();
        setStats(data);

        // Track dashboard viewed once stats are loaded
        trackDashboardViewed({
          statsLoaded: true,
        });
      } catch (error) {
        console.error("Failed to fetch recruiter stats:", error);
        toast.error("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    status: "pending" | "reviewed" | "shortlisted" | "rejected" | "hired"
  ) => {
    // Find the application to get its details
    const application = stats?.recentApplications?.find(
      (app) => app._id === applicationId
    );

    try {
      await updateApplicationStatus(applicationId, status);

      // Track application status update
      trackApplicationStatusUpdated({
        applicationId,
        jobId: application?.job?._id,
        candidateId: application?.candidate?._id,
        oldStatus: application?.status,
        newStatus: status,
        actionType: status,
      });

      toast.success("Application status updated");

      // Refresh stats
      const data = await getRecruiterStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to update application status:", error);
      toast.error("Failed to update application status");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your job postings and applications
          </p>
        </div>
        <Button asChild>
          <Link to="/recruiter/post-job">
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {stats?.activeJobs || 0} active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalApplications || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {stats?.pendingApplications || 0} pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalCandidates || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total candidates in pool
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalApplications && stats?.totalJobs
                ? Math.round(stats.totalApplications / stats.totalJobs)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg applications per job
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/recruiter/post-job" className="block p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Post a New Job</h3>
                <p className="text-sm text-muted-foreground">
                  Create and publish job listings
                </p>
              </div>
              <Plus className="h-8 w-8 text-primary" />
            </div>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/recruiter/applications" className="block p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Review Applications</h3>
                <p className="text-sm text-muted-foreground">
                  {stats?.pendingApplications || 0} pending review
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link to="/recruiter/candidates" className="block p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Search Candidates</h3>
                <p className="text-sm text-muted-foreground">
                  Find the perfect fit
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </Link>
        </Card>
      </div>

      {/* Recent Applications */}
      {stats?.recentApplications && stats.recentApplications.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Applications</h2>
            <Button variant="ghost" asChild>
              <Link
                to="/recruiter/applications"
                className="flex items-center gap-2"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.recentApplications.slice(0, 4).map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
                onUpdateStatus={handleUpdateApplicationStatus}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
