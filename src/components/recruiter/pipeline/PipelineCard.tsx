import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Briefcase,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Pipeline } from "@/types/pipeline";

interface PipelineCardProps {
  pipeline: Pipeline;
  index?: number;
}

const statusConfig: Record<
  Pipeline["status"],
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

export const PipelineCard: React.FC<PipelineCardProps> = ({
  pipeline,
  index = 0,
}) => {
  const navigate = useNavigate();
  const statusInfo = statusConfig[pipeline.status];
  const StatusIcon = statusInfo.icon;

  const handleClick = () => {
    navigate(`/recruiter/pipelines/${pipeline._id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary"
        onClick={handleClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold mb-1 truncate">
                {pipeline.jobTitle}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{pipeline.companyName}</span>
              </div>
              <Badge variant={statusInfo.variant} className="w-fit">
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {pipeline.totalApplications}
                </span>
                <span className="text-muted-foreground">Applications</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium">{pipeline.shortlisted}</span>
                <span className="text-muted-foreground">Shortlisted</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{pipeline.hired}</span>
                <span className="text-muted-foreground">Hired</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium">{pipeline.rejected}</span>
                <span className="text-muted-foreground">Rejected</span>
              </div>
            </div>
            {pipeline.startedAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Calendar className="h-3 w-3" />
                <span>
                  Started{" "}
                  {formatDistanceToNow(new Date(pipeline.startedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
