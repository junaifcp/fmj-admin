import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Building2,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Clock,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { cn } from "@/lib/utils";
import {
  formatTimeRemaining,
  isWithin24HourWindow,
} from "@/utils/pipelineUtils";
import type { Pipeline, PipelineStatus } from "@/types/pipeline";

interface PipelineHeaderProps {
  pipeline: Pipeline;
  onStatusChange?: (status: PipelineStatus) => void;
  isLoading?: boolean;
}

const statusConfig: Record<
  PipelineStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
  }
> = {
  draft: {
    label: "Draft",
    variant: "outline",
    icon: Clock,
  },
  active: {
    label: "Active",
    variant: "default",
    icon: PlayCircle,
  },
  paused: {
    label: "Paused",
    variant: "secondary",
    icon: PauseCircle,
  },
  completed: {
    label: "Completed",
    variant: "secondary",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    icon: XCircle,
  },
};

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({
  pipeline,
  onStatusChange,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const statusInfo = statusConfig[pipeline.status];
  const StatusIcon = statusInfo.icon;
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Bypass 24-hour check for testing
  const skip24HourCheck =
    import.meta.env.VITE_SKIP_24_HOUR_MATCHING_CHECK === "true";

  const isActive =
    pipeline.status === "active" &&
    pipeline.startedAt &&
    (skip24HourCheck || isWithin24HourWindow(pipeline.startedAt));

  // Update time remaining every second when active (but skip if bypassing)
  useEffect(() => {
    if (!isActive || !pipeline.startedAt || skip24HourCheck) {
      setTimeRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      const start = new Date(pipeline.startedAt!);
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
  }, [isActive, pipeline.startedAt, skip24HourCheck]);

  const handleStatusAction = () => {
    if (!onStatusChange) return;

    if (pipeline.status === "active") {
      onStatusChange("paused");
    } else if (pipeline.status === "paused") {
      onStatusChange("active");
    } else if (pipeline.status === "draft") {
      onStatusChange("active");
    }
  };

  const getStatusButton = () => {
    if (pipeline.status === "completed" || pipeline.status === "cancelled") {
      return null;
    }

    if (pipeline.status === "active") {
      return (
        <Button
          variant="secondary"
          onClick={handleStatusAction}
          disabled={isLoading}
        >
          <PauseCircle className="h-4 w-4 mr-2" />
          Pause
        </Button>
      );
    }

    if (pipeline.status === "paused") {
      return (
        <Button
          variant="default"
          onClick={handleStatusAction}
          disabled={isLoading}
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          Resume
        </Button>
      );
    }

    if (pipeline.status === "draft") {
      return (
        <Button
          variant="default"
          onClick={handleStatusAction}
          disabled={isLoading}
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          Start Pipeline
        </Button>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {/* Back Button and Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/recruiter/pipelines")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold mb-1 truncate">
                {pipeline.jobTitle}
              </h1>
              <div className="flex items-center gap-2 text-blue-100">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{pipeline.companyName}</span>
              </div>
            </div>
            <Badge variant={statusInfo.variant} className="hidden sm:flex">
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>

          {/* Statistics and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 w-full sm:w-auto">
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={pipeline.totalApplications} />
                </div>
                <div className="text-sm text-blue-100 flex items-center justify-center sm:justify-start gap-1">
                  <Users className="h-3 w-3" />
                  Applications
                </div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={pipeline.shortlisted} />
                </div>
                <div className="text-sm text-blue-100 flex items-center justify-center sm:justify-start gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Shortlisted
                </div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={pipeline.hired} />
                </div>
                <div className="text-sm text-blue-100 flex items-center justify-center sm:justify-start gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Hired
                </div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={pipeline.rejected} />
                </div>
                <div className="text-sm text-blue-100 flex items-center justify-center sm:justify-start gap-1">
                  <XCircle className="h-3 w-3" />
                  Rejected
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {isActive && timeRemaining > 0 && !skip24HourCheck && (
                <div className="text-center sm:text-right px-4 py-2 bg-white/10 rounded-lg">
                  <div className="text-xs text-blue-100 mb-1">
                    Time Remaining
                  </div>
                  <div className="text-xl font-bold">
                    {formatTimeRemaining(timeRemaining)}
                  </div>
                </div>
              )}
              {getStatusButton()}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
