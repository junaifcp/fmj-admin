import React, { useState, useEffect } from "react";
import { getAtsResults, getAtsResult } from "@/api/admin";
import { AdminAtsResult, PaginationResponse } from "@/types/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart3,
  FileText,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AtsResults: React.FC = () => {
  const [results, setResults] =
    useState<PaginationResponse<AdminAtsResult> | null>(null);
  const [selectedResult, setSelectedResult] = useState<AdminAtsResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [resumeFilter, setResumeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { toast } = useToast();

  const fetchResults = async (page = 1, resumeId = "") => {
    try {
      setLoading(true);
      const data = await getAtsResults(page, 20, resumeId);
      setResults(data);
      setCurrentPage(page);
    } catch (err) {
      toast({
        title: "Failed to load ATS results",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchResultDetail = async (resultId: string) => {
    try {
      const result = await getAtsResult(resultId);
      setSelectedResult(result);
      setIsDetailModalOpen(true);
    } catch (err) {
      toast({
        title: "Failed to load result details",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchResults(1, "");
  }, []);

  useEffect(() => {
    if (resumeFilter === "") return; // Don't debounce empty filter

    const debounceTimer = setTimeout(() => {
      fetchResults(1, resumeFilter);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [resumeFilter]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80)
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Excellent
        </Badge>
      );
    if (score >= 60)
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Good
        </Badge>
      );
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        Needs Improvement
      </Badge>
    );
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Unknown
          </Badge>
        );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-200 bg-red-50";
      case "important":
        return "border-yellow-200 bg-yellow-50";
      case "suggestion":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const analytics = results?.analytics;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">
          ATS Analysis Results
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor resume optimization scores and feedback across the platform
        </p>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Analyses
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.total || results?.pagination.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time analyses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.averageScore || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed analyses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              High Scores (80+)
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics?.highScores || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Excellent resumes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics?.failed || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Failed analyses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.completed || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.processing || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.pending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Medium (60-79)
            </CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {analytics?.mediumScores || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All ATS Results</CardTitle>
              <CardDescription>
                {results
                  ? `${results.pagination.total} total analyses`
                  : "Loading results..."}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by resume ID..."
                  value={resumeFilter}
                  onChange={(e) => setResumeFilter(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                onClick={() => fetchResults(currentPage, resumeFilter)}
                size="sm"
                variant="outline"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="max-w-[200px]">Resume</TableHead>
                      <TableHead className="max-w-[150px]">User</TableHead>
                      <TableHead className="w-[100px]">Score</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead className="text-right w-[80px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results?.data.length ? (
                      results.data.map((result) => (
                        <TableRow key={result._id}>
                          <TableCell className="max-w-[200px]">
                            <div className="truncate">
                              <div className="font-medium truncate">
                                {result.resumeName || "Untitled Resume"}
                              </div>
                              {result.jobTitle?.name && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {result.jobTitle.name}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px]">
                            <div className="truncate">
                              {result.userName && (
                                <div className="font-medium text-sm truncate">
                                  {result.userName}
                                </div>
                              )}
                              <div className="text-sm text-muted-foreground truncate">
                                {result.userEmail || result.userId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="w-[100px]">
                            {result.overallScore > 0 ? (
                              <span
                                className={`text-lg font-bold ${getScoreColor(
                                  result.overallScore
                                )}`}
                              >
                                {result.overallScore}%
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="w-[120px]">
                            {getStatusBadge(result.status)}
                          </TableCell>
                          <TableCell className="w-[100px] text-sm text-muted-foreground">
                            {new Date(result.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right w-[80px]">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchResultDetail(result._id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground"
                        >
                          No results found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {results && results.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(results.pagination.page - 1) * 20 + 1} to{" "}
                    {Math.min(
                      results.pagination.page * 20,
                      results.pagination.total
                    )}{" "}
                    of {results.pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage - 1;
                        fetchResults(newPage, resumeFilter);
                      }}
                      disabled={currentPage <= 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Page {results.pagination.page} of{" "}
                      {results.pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage + 1;
                        fetchResults(newPage, resumeFilter);
                      }}
                      disabled={
                        currentPage >= results.pagination.totalPages || loading
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Result Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ATS Analysis Details</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="scores">Scores</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Resume:
                    </span>
                    <p className="mt-1">
                      {selectedResult.resumeName || "Untitled"}
                    </p>
                  </div>
                  {selectedResult.jobTitle?.name && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Job Title:
                      </span>
                      <p className="mt-1">{selectedResult.jobTitle.name}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      User Name:
                    </span>
                    <p className="mt-1">{selectedResult.userName || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      User Email:
                    </span>
                    <p className="mt-1">{selectedResult.userEmail || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Overall Score:
                    </span>
                    <p
                      className={`mt-1 text-2xl font-bold ${getScoreColor(
                        selectedResult.overallScore
                      )}`}
                    >
                      {selectedResult.overallScore}%
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Status:
                    </span>
                    <div className="mt-1">
                      {getStatusBadge(selectedResult.status)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Analysis Date:
                    </span>
                    <p className="mt-1">
                      {new Date(selectedResult.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedResult.processingTime && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Processing Time:
                      </span>
                      <p className="mt-1">
                        {(selectedResult.processingTime / 1000).toFixed(2)}s
                      </p>
                    </div>
                  )}
                </div>

                {selectedResult.summary && (
                  <div className="space-y-4">
                    {selectedResult.summary.strengths &&
                      selectedResult.summary.strengths.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2">
                            Strengths
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {selectedResult.summary.strengths.map(
                              (strength, idx) => (
                                <li key={idx}>{strength}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {selectedResult.summary.weaknesses &&
                      selectedResult.summary.weaknesses.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-700 mb-2">
                            Weaknesses
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {selectedResult.summary.weaknesses.map(
                              (weakness, idx) => (
                                <li key={idx}>{weakness}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {selectedResult.summary.quickWins &&
                      selectedResult.summary.quickWins.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-700 mb-2">
                            Quick Wins
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {selectedResult.summary.quickWins.map(
                              (win, idx) => (
                                <li key={idx}>{win}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}

                {selectedResult.error && (
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-700 mb-2">Error</h4>
                    <p className="text-sm text-red-600">
                      {selectedResult.error}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="scores" className="space-y-4">
                <div className="space-y-4">
                  {selectedResult.sections &&
                  selectedResult.sections.length > 0 ? (
                    selectedResult.sections.map((section, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{section.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-bold ${getScoreColor(
                                section.score
                              )}`}
                            >
                              {section.score}%
                            </span>
                            <Progress value={section.score} className="w-24" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No score breakdown available
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="feedback" className="space-y-4">
                {selectedResult.feedback &&
                selectedResult.feedback.length > 0 ? (
                  <div className="space-y-4">
                    {selectedResult.feedback.map((item, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${getSeverityColor(
                          item.severity
                        )}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge
                              className={
                                item.severity === "critical"
                                  ? "bg-red-600"
                                  : item.severity === "important"
                                  ? "bg-yellow-600"
                                  : "bg-blue-600"
                              }
                            >
                              {item.severity}
                            </Badge>
                            <span className="ml-2 text-sm font-medium text-muted-foreground">
                              {item.category}
                            </span>
                          </div>
                          {item.impact && (
                            <Badge variant="outline">{item.impact}</Badge>
                          )}
                        </div>
                        <h4 className="font-semibold mb-2">{item.issue}</h4>
                        <p className="text-sm mb-2">{item.recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No feedback available
                  </p>
                )}
              </TabsContent>

              <TabsContent value="keywords" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedResult.presentKeywords &&
                    selectedResult.presentKeywords.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">
                          Present Keywords (
                          {selectedResult.presentKeywords.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedResult.presentKeywords.map(
                            (keyword, idx) => (
                              <Badge
                                key={idx}
                                className="bg-green-100 text-green-800 hover:bg-green-100"
                              >
                                {keyword}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {selectedResult.missingKeywords &&
                    selectedResult.missingKeywords.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-700 mb-2">
                          Missing Keywords (
                          {selectedResult.missingKeywords.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedResult.missingKeywords.map(
                            (keyword, idx) => (
                              <Badge
                                key={idx}
                                className="bg-red-100 text-red-800 hover:bg-red-100"
                              >
                                {keyword}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                {selectedResult.aiAnalysis ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-sm">
                      {selectedResult.aiAnalysis}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No AI analysis available
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AtsResults;
