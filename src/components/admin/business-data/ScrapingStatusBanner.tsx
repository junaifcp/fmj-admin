// src/components/admin/business-data/ScrapingStatusBanner.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { JobStatus } from "@/types/businessData";
import { X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrapingStatusBannerProps {
  job: JobStatus;
  onCancel?: () => void;
  onDismiss?: () => void;
}

export const ScrapingStatusBanner: React.FC<ScrapingStatusBannerProps> = ({
  job,
  onCancel,
  onDismiss,
}) => {
  const isCompleted = job.status === "completed";
  const isFailed = job.status === "failed";
  const isCancelled = job.status === "cancelled";
  const canDismiss = isCompleted || isFailed || isCancelled;

  return (
    <div
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isFailed || isCancelled
          ? "border-destructive/50 bg-destructive/10"
          : isCompleted
          ? "border-success/50 bg-success/10"
          : "border-border bg-info"
      )}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Status Text */}
            <div className="flex items-center gap-2 mb-2">
              {isFailed || isCancelled ? (
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              ) : null}
              <p
                className={cn(
                  "text-sm font-medium",
                  isFailed || isCancelled
                    ? "text-destructive"
                    : isCompleted
                    ? "text-success"
                    : "text-info-foreground"
                )}
              >
                {isCompleted
                  ? `Scraping completed: ${job.keyword}`
                  : isFailed
                  ? `Scraping failed: ${job.keyword}`
                  : isCancelled
                  ? `Scraping cancelled: ${job.keyword}`
                  : `Scraping ${job.keyword}${
                      job.progress.currentLocation
                        ? ` in ${job.progress.currentLocation}`
                        : ""
                    }`}
              </p>
            </div>

            {/* Progress Bar */}
            {!isFailed && !isCancelled && (
              <div className="space-y-1">
                <Progress value={job.progress.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {job.progress.completedLocations} of{" "}
                  {job.progress.totalLocations} locations completed
                </p>
                <p className="text-xs text-muted-foreground">
                  {job.progress.totalBusinesses} businesses scraped
                  {job.progress.expectedTotal > 0 &&
                    ` of ${job.progress.expectedTotal} maximum (60 per location)`}
                </p>
              </div>
            )}

            {/* Error Message */}
            {isFailed && job.error && (
              <p className="text-xs text-destructive mt-1">{job.error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {job.status === "running" && onCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onCancel}
                className="text-xs"
              >
                Stop Scraping
              </Button>
            )}
            {canDismiss && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
