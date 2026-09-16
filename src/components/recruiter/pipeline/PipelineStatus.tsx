// src/components/recruiter/pipeline/PipelineStatus.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Database,
  Link as LinkIcon,
  FileText,
  Copy,
  CheckCircle2,
  ExternalLink,
  Clock,
  Mail,
  Users,
  MousePointerClick,
} from "lucide-react";
import { usePipelineStatus } from "@/hooks/usePipelineStatus";
import {
  formatTimeRemaining,
  isWithin24HourWindow,
} from "@/utils/pipelineUtils";
import { PipelineStatusTracking } from "@/types/pipeline";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface PipelineStatusProps {
  pipelineId: string;
  startedAt?: string;
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
}

export const PipelineStatus: React.FC<PipelineStatusProps> = ({
  pipelineId,
  startedAt,
  status,
}) => {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Bypass 24-hour check for testing
  const skip24HourCheck =
    import.meta.env.VITE_SKIP_24_HOUR_MATCHING_CHECK === "true";

  const isActive =
    status === "active" &&
    startedAt &&
    (skip24HourCheck || isWithin24HourWindow(startedAt));
  const {
    data: statusData,
    isLoading,
    error,
  } = usePipelineStatus(pipelineId, isActive || false);

  // Update time remaining every second when active (but skip if bypassing)
  useEffect(() => {
    if (!isActive || !startedAt || skip24HourCheck) {
      setTimeRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      const start = new Date(startedAt);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      const remaining = Math.max(
        0,
        Math.floor((end.getTime() - now.getTime()) / 1000)
      );
      setTimeRemaining(remaining);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [isActive, startedAt, skip24HourCheck]);

  const handleCopyLink = async (link: string, type: "public" | "blog") => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(type);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };

  if (!isActive) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {status === "draft" &&
            "Start the pipeline to see real-time status updates"}
          {status === "paused" &&
            "Pipeline is paused. Resume to continue tracking."}
          {status === "completed" &&
            "24-hour window completed. AI matching in progress..."}
          {status === "cancelled" && "Pipeline has been cancelled"}
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !statusData) {
    return (
      <Card>
        <CardContent className="py-8 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Failed to load pipeline status. Please refresh the page.
        </CardContent>
      </Card>
    );
  }

  const tracking = statusData || ({} as PipelineStatusTracking);
  const displayTimeRemaining = statusData?.timeRemaining ?? timeRemaining;

  return (
    <div className="space-y-6">
      {/* 24-Hour Countdown - Hide when bypassing */}
      {!skip24HourCheck && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              24-Hour Engagement Window
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {formatTimeRemaining(displayTimeRemaining)}
              </div>
              <p className="text-sm text-muted-foreground">
                {displayTimeRemaining > 0
                  ? "Time remaining until AI matching begins"
                  : "Window closed - AI matching in progress"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Database Source */}
        {tracking.database && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  Database Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Candidates Found
                  </span>
                  <Badge variant="outline" className="text-lg font-semibold">
                    {tracking.database.found}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Emails Sent
                  </span>
                  <Badge variant="outline" className="text-lg font-semibold">
                    {tracking.database.emailsSent}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Applications
                  </span>
                  <Badge variant="default" className="text-lg font-semibold">
                    {tracking.database.applications}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Public Link Source */}
        {tracking.publicLink && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-green-500" />
                  Public Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tracking.publicLink.link && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={tracking.publicLink.link}
                        readOnly
                        className="text-xs font-mono"
                      />
                      <Button
                        size="sm"
                        variant={
                          copiedLink === "public" ? "default" : "outline"
                        }
                        onClick={() =>
                          handleCopyLink(tracking.publicLink.link!, "public")
                        }
                      >
                        {copiedLink === "public" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MousePointerClick className="h-3 w-3" />
                    Clicks
                  </span>
                  <Badge variant="outline" className="text-lg font-semibold">
                    {tracking.publicLink.clicks}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Applications
                  </span>
                  <Badge variant="default" className="text-lg font-semibold">
                    {tracking.publicLink.applications}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Blog Source */}
        {/* {tracking.blog && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  Blog Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      tracking.blog.status === "published"
                        ? "default"
                        : tracking.blog.status === "failed"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {tracking.blog.status === "creating" && "Creating..."}
                    {tracking.blog.status === "published" && "Published"}
                    {tracking.blog.status === "failed" && "Failed"}
                  </Badge>
                </div>
                {tracking.blog.link && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={tracking.blog.link}
                        readOnly
                        className="text-xs font-mono"
                      />
                      <Button
                        size="sm"
                        variant={copiedLink === "blog" ? "default" : "outline"}
                        onClick={() =>
                          handleCopyLink(tracking.blog.link!, "blog")
                        }
                      >
                        {copiedLink === "blog" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(tracking.blog.link, "_blank")
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {tracking.blog.publishedAt && (
                  <div className="text-xs text-muted-foreground">
                    Published:{" "}
                    {new Date(tracking.blog.publishedAt).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )} */}
      </div>
    </div>
  );
};
