import React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Briefcase,
  Eye,
  CheckCircle2,
  XCircle,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineApplication } from "@/types/pipeline";

interface CandidateCardProps {
  application: PipelineApplication;
  onView?: (application: PipelineApplication) => void;
  onShortlist?: (application: PipelineApplication) => void;
  onReject?: (application: PipelineApplication) => void;
  isDragging?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  application,
  onView,
  onShortlist,
  onReject,
  isDragging = false,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "border-green-500 bg-green-50 dark:bg-green-950/20";
    if (score >= 60)
      return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
    return "border-red-500 bg-red-50 dark:bg-red-950/20";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const scoreColor = getScoreColor(application.matchingScore);

  return (
    <motion.div
      animate={
        isDragging ? { scale: 0.95, opacity: 0.8 } : { scale: 1, opacity: 1 }
      }
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "cursor-move hover:shadow-lg transition-all duration-200 border-l-4",
          scoreColor,
          isDragging && "shadow-xl"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={application.candidatePhoto} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(application.candidateName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">
                {application.candidateName}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {application.candidateEmail}
              </p>
            </div>
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>

          {/* Matching Score */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                Match Score
              </span>
              <span
                className={cn(
                  "text-sm font-bold",
                  application.matchingScore >= 80
                    ? "text-green-600"
                    : application.matchingScore >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
                )}
              >
                {application.matchingScore}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  application.matchingScore >= 80
                    ? "bg-green-500"
                    : application.matchingScore >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${application.matchingScore}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </div>

          {/* Skills Preview */}
          {application.skills && application.skills.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {application.skills.slice(0, 3).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs px-1.5 py-0"
                  >
                    {skill}
                  </Badge>
                ))}
                {application.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    +{application.skills.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Experience and Location */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {application.experience > 0 && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                <span>{application.experience} yrs</span>
              </div>
            )}
            {application.location && (
              <div className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{application.location}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(application);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            )}
            {onShortlist && application.status !== "shortlisted" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onShortlist(application);
                }}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Shortlist
              </Button>
            )}
            {onReject && application.status !== "rejected" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(application);
                }}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
