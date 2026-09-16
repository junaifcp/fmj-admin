import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Calendar,
  UserX,
  TrendingUp,
  Download,
  Mail,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getLocationLabel } from "@/utils/format";
import type {
  CandidateWithDetails,
  CandidateFilters,
} from "@/types/jobInsights";

interface CandidateTableProps {
  candidates: CandidateWithDetails[];
  isLoading?: boolean;
  onCandidateSelect?: (candidate: CandidateWithDetails) => void;
  onBulkAction?: (action: string, candidateIds: string[]) => void;
  onSort?: (field: string, direction: "asc" | "desc") => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

const stageColors = {
  applied: "bg-blue-100 text-blue-800",
  screened: "bg-yellow-100 text-yellow-800",
  interview: "bg-purple-100 text-purple-800",
  offer: "bg-orange-100 text-orange-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const qualityColors = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-red-100 text-red-800",
};

export const CandidateTable = ({
  candidates,
  isLoading = false,
  onCandidateSelect,
  onBulkAction,
  onSort,
  sortField,
  sortDirection,
}: CandidateTableProps) => {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  const handleSort = (field: string) => {
    const newDirection =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    onSort?.(field, newDirection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(candidates.map((c) => c._id));
    } else {
      setSelectedCandidates([]);
    }
  };

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates((prev) => [...prev, candidateId]);
    } else {
      setSelectedCandidates((prev) => prev.filter((id) => id !== candidateId));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedCandidates.length > 0) {
      onBulkAction?.(action, selectedCandidates);
      setSelectedCandidates([]);
    }
  };

  const SortableHeader = ({
    field,
    children,
  }: {
    field: string;
    children: React.ReactNode;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field &&
          (sortDirection === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          ))}
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applicants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Candidates ({candidates.length})</CardTitle>

          {selectedCandidates.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedCandidates.length} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkAction("advance")}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Advance Stage
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction("message")}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction("export")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction("reject")}>
                    <UserX className="h-4 w-4 mr-2" />
                    Reject All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedCandidates.length === candidates.length &&
                      candidates.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all candidates"
                  />
                </TableHead>
                <SortableHeader field="name">Candidate</SortableHeader>
                <SortableHeader field="appliedAt">Applied</SortableHeader>
                <SortableHeader field="source">Source</SortableHeader>
                <SortableHeader field="stage">Stage</SortableHeader>
                <SortableHeader field="qualityScore">Quality</SortableHeader>
                <SortableHeader field="experience">Experience</SortableHeader>
                <TableHead>Location</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow
                  key={candidate._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onCandidateSelect?.(candidate)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedCandidates.includes(candidate._id)}
                      onCheckedChange={(checked) =>
                        handleSelectCandidate(candidate._id, !!checked)
                      }
                      aria-label={`Select ${candidate.firstName} ${candidate.lastName}`}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={candidate.profileImageUrl} />
                        <AvatarFallback>
                          {(candidate.firstName?.[0] || "") +
                            (candidate.lastName?.[0] || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {candidate.firstName} {candidate.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {candidate.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {format(parseISO(candidate.appliedAt), "MMM dd, yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(candidate.appliedAt), "HH:mm")}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{candidate.source}</Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={stageColors[candidate.stage]}
                    >
                      {candidate.stage}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {candidate.qualityScore && (
                      <Badge
                        variant="secondary"
                        className={qualityColors[candidate.qualityScore]}
                      >
                        {candidate.qualityScore}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    {candidate.experience
                      ? `${candidate.experience} years`
                      : "-"}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {getLocationLabel(candidate.location) || "-"}
                    </div>
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Resume
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Interview
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Advance Stage
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <UserX className="h-4 w-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {candidates.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No candidates found</p>
            <p className="text-sm text-muted-foreground">
              Candidates will appear here as they apply to this job
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
