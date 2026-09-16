// src/components/public/ApplicationReview.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Mail, Phone, User, Briefcase } from "lucide-react";

interface ApplicationReviewProps {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  resumeFile: File | null;
  resumeUrl?: string;
  coverLetter?: string;
  jobTitle: string;
}

export const ApplicationReview: React.FC<ApplicationReviewProps> = ({
  personalInfo,
  resumeFile,
  resumeUrl,
  coverLetter,
  jobTitle,
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold text-lg">{jobTitle}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{personalInfo.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{personalInfo.email}</p>
            </div>
          </div>
          {personalInfo.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{personalInfo.phone}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resumeFile ? (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{resumeFile.name}</span>
              <Badge variant="secondary" className="ml-auto">
                {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
              </Badge>
            </div>
          ) : resumeUrl ? (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Resume uploaded</span>
              <Badge variant="secondary" className="ml-auto">
                Ready
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No resume uploaded</p>
          )}
        </CardContent>
      </Card>

      {coverLetter && (
        <Card>
          <CardHeader>
            <CardTitle>Cover Letter</CardTitle>
            <CardDescription>Your cover letter message</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{coverLetter}</p>
          </CardContent>
        </Card>
      )}

      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Please review your information carefully.</strong> Once you
          submit, you won't be able to make changes to your application.
        </p>
      </div>
    </div>
  );
};
