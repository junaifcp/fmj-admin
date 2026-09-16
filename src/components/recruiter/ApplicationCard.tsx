import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Mail,
  FileText,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Star,
} from "lucide-react";
import type { Application } from "@/types/recruiter";

interface ApplicationCardProps {
  application: Application;
  onUpdateStatus?: (
    applicationId: string,
    status: Application["status"]
  ) => void;
  onViewResume?: (candidateId: string) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onUpdateStatus,
  onViewResume,
}) => {
  const getStatusColor = (status: Application["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "reviewed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shortlisted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "hired":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: Application["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "reviewed":
        return <Eye className="h-3 w-3" />;
      case "shortlisted":
        return <Star className="h-3 w-3" />;
      case "rejected":
        return <XCircle className="h-3 w-3" />;
      case "hired":
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const candidate = application.candidate ?? {
    firstName: "",
    lastName: "",
    email: "",
    profileImageUrl: "",
    _id: application.candidateId,
  };

  const firstName = candidate.firstName || "Candidate";
  const lastName = candidate.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`
      : firstName?.[0] || "?";

  const jobTitle = application.job?.title ?? "Job Title";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={candidate.profileImageUrl} alt={fullName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{fullName}</h3>
              <p className="text-sm text-muted-foreground">
                Applied for: {jobTitle}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewResume && (
                <DropdownMenuItem onClick={() => onViewResume(candidate._id)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Resume
                </DropdownMenuItem>
              )}
              {onUpdateStatus && application.status !== "reviewed" && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(application._id, "reviewed")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Mark as Reviewed
                </DropdownMenuItem>
              )}
              {onUpdateStatus && application.status !== "shortlisted" && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(application._id, "shortlisted")}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Shortlist
                </DropdownMenuItem>
              )}
              {onUpdateStatus && application.status !== "rejected" && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(application._id, "rejected")}
                  className="text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </DropdownMenuItem>
              )}
              {onUpdateStatus && application.status !== "hired" && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(application._id, "hired")}
                  className="text-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Hire
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(application.status)}>
            {getStatusIcon(application.status)}
            <span className="ml-1 capitalize">{application.status}</span>
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>{candidate.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              Applied {new Date(application.appliedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {application.coverLetter && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Cover Letter:</h4>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {application.coverLetter}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {onViewResume && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewResume(candidate._id)}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Resume
            </Button>
          )}
          {onUpdateStatus && application.status === "pending" && (
            <Button
              size="sm"
              onClick={() => onUpdateStatus(application._id, "reviewed")}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Review
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;
