import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Ban,
  Calendar,
} from "lucide-react";
import {
  getScheduledEmails,
  cancelScheduledEmail,
  EmailScheduler,
} from "@/api/admin";
import { PaginationResponse } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";

const ScheduledEmails: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [scheduledEmails, setScheduledEmails] =
    useState<PaginationResponse<EmailScheduler> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchScheduledEmails = async (page = 1) => {
    try {
      setLoading(true);
      const result = await getScheduledEmails(page, 20);
      setScheduledEmails(result);
      setCurrentPage(page);
    } catch (error) {
      toast({
        title: "Failed to load scheduled emails",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledEmails(1);
  }, [toast]);

  const handleRefresh = async () => {
    await fetchScheduledEmails(currentPage);
    toast({
      title: "Refreshed",
      description: "Scheduled emails updated",
    });
  };

  const handleCancelScheduled = async (schedulerId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this scheduled email batch?"
      )
    ) {
      return;
    }

    try {
      setCancellingId(schedulerId);
      await cancelScheduledEmail(schedulerId);
      toast({
        title: "Scheduled email cancelled",
        description: "The email batch has been cancelled successfully",
      });
      await fetchScheduledEmails(currentPage);
    } catch (error) {
      toast({
        title: "Failed to cancel scheduled email",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      pending: { variant: "secondary", className: "" },
      processing: {
        variant: "default",
        className: "bg-blue-600 text-white",
      },
      completed: {
        variant: "default",
        className: "bg-green-600 text-white",
      },
      failed: { variant: "destructive", className: "" },
      cancelled: { variant: "outline", className: "" },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scheduled Emails</h1>
        <p className="text-muted-foreground mt-2">
          View and manage scheduled email batches
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scheduled Email Batches</CardTitle>
              <CardDescription>
                Monitor progress and manage scheduled email sending
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : scheduledEmails && scheduledEmails.data.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledEmails.data.map((scheduler: any) => (
                      <TableRow key={scheduler._id}>
                        <TableCell className="font-medium">
                          {scheduler.templateId?.name || "Unknown Template"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {scheduler.subject}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            {/* Sent */}
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              <span className="text-sm font-medium text-green-600">
                                {scheduler.sentCount || 0}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                sent
                              </span>
                            </div>
                            {/* Rejected (Duplicate) - Use rejectedRecipients array length as source of truth */}
                            {((scheduler.rejectedRecipients &&
                              scheduler.rejectedRecipients.length > 0) ||
                              (scheduler.rejectedCount &&
                                scheduler.rejectedCount > 0)) && (
                              <div className="flex items-center gap-2">
                                <Ban className="h-3 w-3 text-orange-600" />
                                <span className="text-sm font-medium text-orange-600">
                                  {scheduler.rejectedRecipients?.length ||
                                    scheduler.rejectedCount ||
                                    0}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  rejected
                                </span>
                                <span className="text-xs text-orange-600 font-medium ml-1">
                                  (duplicate)
                                </span>
                              </div>
                            )}
                            {/* Failed */}
                            {scheduler.failedCount &&
                              scheduler.failedCount > 0 && (
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-3 w-3 text-red-600" />
                                  <span className="text-sm font-medium text-red-600">
                                    {scheduler.failedCount}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    failed
                                  </span>
                                </div>
                              )}
                            {/* Summary */}
                            <div className="pt-1 border-t mt-1">
                              <div className="text-xs text-muted-foreground">
                                Total:{" "}
                                <span className="font-medium">
                                  {scheduler.totalRecipients}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Processed:{" "}
                                <span className="font-medium">
                                  {(scheduler.sentCount || 0) +
                                    (scheduler.rejectedRecipients?.length ||
                                      scheduler.rejectedCount ||
                                      0) +
                                    (scheduler.failedCount || 0)}
                                </span>{" "}
                                / {scheduler.totalRecipients}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {new Date(
                                scheduler.scheduledDate
                              ).toLocaleDateString()}
                            </span>
                            {scheduler.scheduledTime && (
                              <span className="text-xs text-muted-foreground ml-1">
                                {scheduler.scheduledTime}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Calculate actual processed count using rejectedRecipients.length as source of truth
                            const sent = scheduler.sentCount || 0;
                            const rejected =
                              scheduler.rejectedRecipients?.length ||
                              scheduler.rejectedCount ||
                              0;
                            const failed = scheduler.failedCount || 0;
                            const processed = sent + rejected + failed;
                            const total = scheduler.totalRecipients || 0;
                            const allProcessed = processed >= total;

                            // Show "completed" badge if all are processed, even if backend status is "processing"
                            if (allProcessed) {
                              return (
                                <Badge
                                  variant="default"
                                  className="bg-green-600 text-white"
                                >
                                  Completed
                                </Badge>
                              );
                            }
                            // Otherwise use the backend status
                            return getStatusBadge(scheduler.status);
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2 relative overflow-hidden">
                                {/* Progress bar with multiple segments */}
                                {scheduler.totalRecipients > 0 && (
                                  <>
                                    {/* Sent segment (green) */}
                                    <div
                                      className="bg-green-600 h-2 rounded-l-full"
                                      style={{
                                        width: `${
                                          ((scheduler.sentCount || 0) /
                                            scheduler.totalRecipients) *
                                          100
                                        }%`,
                                      }}
                                    />
                                    {/* Rejected segment (orange) */}
                                    {((scheduler.rejectedRecipients &&
                                      scheduler.rejectedRecipients.length >
                                        0) ||
                                      (scheduler.rejectedCount &&
                                        scheduler.rejectedCount > 0)) && (
                                      <div
                                        className="bg-orange-600 h-2 absolute top-0 left-0"
                                        style={{
                                          width: `${
                                            ((scheduler.rejectedRecipients
                                              ?.length ||
                                              scheduler.rejectedCount ||
                                              0) /
                                              scheduler.totalRecipients) *
                                            100
                                          }%`,
                                          marginLeft: `${
                                            ((scheduler.sentCount || 0) /
                                              scheduler.totalRecipients) *
                                            100
                                          }%`,
                                        }}
                                      />
                                    )}
                                    {/* Failed segment (red) */}
                                    {scheduler.failedCount &&
                                      scheduler.failedCount > 0 && (
                                        <div
                                          className="bg-red-600 h-2 rounded-r-full absolute top-0 left-0"
                                          style={{
                                            width: `${
                                              ((scheduler.failedCount || 0) /
                                                scheduler.totalRecipients) *
                                              100
                                            }%`,
                                            marginLeft: `${
                                              (((scheduler.sentCount || 0) +
                                                (scheduler.rejectedRecipients
                                                  ?.length ||
                                                  scheduler.rejectedCount ||
                                                  0)) /
                                                scheduler.totalRecipients) *
                                              100
                                            }%`,
                                          }}
                                        />
                                      )}
                                  </>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground min-w-[3rem] text-right font-medium">
                                {(() => {
                                  const sent = scheduler.sentCount || 0;
                                  const rejected =
                                    scheduler.rejectedRecipients?.length ||
                                    scheduler.rejectedCount ||
                                    0;
                                  const failed = scheduler.failedCount || 0;
                                  const processed = sent + rejected + failed;
                                  const total = scheduler.totalRecipients || 0;
                                  return total > 0
                                    ? Math.round((processed / total) * 100)
                                    : 0;
                                })()}
                                %
                              </span>
                            </div>
                            <div className="text-xs space-y-1 pt-0.5 border-t">
                              {/* Processed count */}
                              <div className="text-muted-foreground flex items-center justify-between">
                                <span>Processed:</span>
                                <span className="font-medium">
                                  {(() => {
                                    const sent = scheduler.sentCount || 0;
                                    const rejected =
                                      scheduler.rejectedRecipients?.length ||
                                      scheduler.rejectedCount ||
                                      0;
                                    const failed = scheduler.failedCount || 0;
                                    return sent + rejected + failed;
                                  })()}{" "}
                                  / {scheduler.totalRecipients}
                                </span>
                              </div>
                              {/* Breakdown with colors */}
                              <div className="flex items-center gap-2 text-xs flex-wrap">
                                {scheduler.sentCount > 0 && (
                                  <span className="text-green-600 font-medium">
                                    ✓ {scheduler.sentCount} sent
                                  </span>
                                )}
                                {((scheduler.rejectedRecipients &&
                                  scheduler.rejectedRecipients.length > 0) ||
                                  (scheduler.rejectedCount &&
                                    scheduler.rejectedCount > 0)) && (
                                  <span className="text-orange-600 font-medium">
                                    ⚠{" "}
                                    {scheduler.rejectedRecipients?.length ||
                                      scheduler.rejectedCount ||
                                      0}{" "}
                                    rejected
                                  </span>
                                )}
                                {scheduler.failedCount > 0 && (
                                  <span className="text-red-600 font-medium">
                                    ✗ {scheduler.failedCount} failed
                                  </span>
                                )}
                              </div>
                              {/* Status indicator - use rejectedRecipients.length as source of truth */}
                              {(() => {
                                const sent = scheduler.sentCount || 0;
                                const rejected =
                                  scheduler.rejectedRecipients?.length ||
                                  scheduler.rejectedCount ||
                                  0;
                                const failed = scheduler.failedCount || 0;
                                const processed = sent + rejected + failed;
                                const total = scheduler.totalRecipients || 0;
                                const allProcessed = processed >= total;

                                // Show completed status if all emails are processed, regardless of backend status
                                if (allProcessed) {
                                  return (
                                    <div className="text-green-600 font-medium flex items-center gap-1 pt-0.5 border-t">
                                      <CheckCircle2 className="h-3 w-3" />
                                      All {total} processed
                                    </div>
                                  );
                                }
                                // Show processing status if not all processed
                                return (
                                  <div className="text-blue-600 text-xs flex items-center gap-1 pt-0.5 border-t">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Processing ({processed}/{total})...
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {scheduler.status === "pending" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleCancelScheduled(scheduler._id)
                              }
                              disabled={cancellingId === scheduler._id}
                            >
                              {cancellingId === scheduler._id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          )}
                          {scheduler.status !== "pending" && (
                            <span className="text-xs text-muted-foreground">
                              Cannot cancel
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {scheduledEmails.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing page {scheduledEmails.pagination.page} of{" "}
                    {scheduledEmails.pagination.totalPages} (
                    {scheduledEmails.pagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchScheduledEmails(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchScheduledEmails(currentPage + 1)}
                      disabled={
                        currentPage >= scheduledEmails.pagination.totalPages ||
                        loading
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scheduled emails found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduledEmails;
