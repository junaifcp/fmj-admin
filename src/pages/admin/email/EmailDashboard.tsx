import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Server,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Send,
  TrendingUp,
  Calendar,
} from "lucide-react";
import {
  getEmailServers,
  getDefaultEmailServer,
  getEmailAnalytics,
  EmailServer,
  EmailAnalytics,
} from "@/api/admin";
import { useToast } from "@/hooks/use-toast";

const EmailDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [defaultServer, setDefaultServer] = useState<EmailServer | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const data = await getEmailAnalytics();
      setAnalytics(data);
    } catch (error) {
      toast({
        title: "Failed to load analytics",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [serversResult, defaultServerResult] = await Promise.all([
          getEmailServers(1, 100),
          getDefaultEmailServer().catch(() => null),
        ]);

        setStats({
          total: serversResult.pagination.total,
          active: serversResult.data.filter((s) => s.isActive).length,
          inactive: serversResult.data.filter((s) => !s.isActive).length,
        });

        if (defaultServerResult) {
          setDefaultServer(defaultServerResult);
        }
      } catch (error) {
        toast({
          title: "Failed to load email dashboard",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchAnalytics();
  }, [toast]);

  const handleRefreshStatus = async () => {
    await fetchAnalytics();
    toast({
      title: "Status refreshed",
      description: "Email analytics updated",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Email Dashboard</h1>
        <div className="grid gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="h-32 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of email server management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Email servers configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Servers
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently enabled servers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Servers
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Disabled servers</p>
          </CardContent>
        </Card>
      </div>

      {defaultServer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Default Email Server
            </CardTitle>
            <CardDescription>
              The server currently used for sending emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Name:</span> {defaultServer.name}
              </div>
              <div>
                <span className="font-medium">Provider:</span>{" "}
                {defaultServer.provider.toUpperCase()}
              </div>
              <div>
                <span className="font-medium">From Email:</span>{" "}
                {defaultServer.fromEmail}
              </div>
              {defaultServer.fromName && (
                <div>
                  <span className="font-medium">From Name:</span>{" "}
                  {defaultServer.fromName}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!defaultServer && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No default email server configured. Please configure an email
              server to start sending emails.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Email Analytics */}
      {analytics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Email Sending Analytics</CardTitle>
                <CardDescription>
                  Overview of email sending performance
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStatus}
                disabled={loadingAnalytics}
              >
                {loadingAnalytics ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Sent
                  </CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.totalSent}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time emails sent
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Success Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.successRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Emails successfully delivered
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Sent Today
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.sentToday}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Emails sent today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Sent This Month
                  </CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.sentThisMonth}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Emails sent this month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sent</span>
                    <span className="font-medium">
                      {analytics.statusBreakdown.sent}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Delivered</span>
                    <span className="font-medium text-green-600">
                      {analytics.statusBreakdown.delivered}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed</span>
                    <span className="font-medium text-red-600">
                      {analytics.statusBreakdown.failed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bounced</span>
                    <span className="font-medium text-orange-600">
                      {analytics.statusBreakdown.bounced}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Recent Activity (24h)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sent</span>
                    <span className="font-medium">
                      {analytics.recentActivity.sent}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed</span>
                    <span className="font-medium text-red-600">
                      {analytics.recentActivity.failed}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailDashboard;
