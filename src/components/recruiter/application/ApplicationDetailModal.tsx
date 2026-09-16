import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { MatchingScoreBreakdown } from "@/components/recruiter/matching/MatchingScoreBreakdown";
import { AIAnalysis } from "@/components/recruiter/matching/AIAnalysis";
import { ResumeViewer } from "./ResumeViewer";
import { ProfileSections } from "./ProfileSections";
import { useMockCandidateProfile } from "@/hooks/useMockPipeline";
import { getApplicationResumeData } from "@/api/recruiter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PipelineApplication } from "@/types/pipeline";

interface ApplicationDetailModalProps {
  application: PipelineApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onShortlist?: (application: PipelineApplication) => void;
  onReject?: (application: PipelineApplication) => void;
  onScheduleInterview?: (application: PipelineApplication) => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  isOpen,
  onClose,
  onShortlist,
  onReject,
  onScheduleInterview,
}) => {
  const { data: profile } = useMockCandidateProfile(application?.candidateId);
  const [activeTab, setActiveTab] = useState("overview");
  const [resumeData, setResumeData] = useState<any>(null);
  const [loadingResume, setLoadingResume] = useState(false);

  // Fetch resume data for public-link applications
  useEffect(() => {
    if (
      isOpen &&
      application &&
      application.source === "public-link" &&
      !application.resumeData
    ) {
      setLoadingResume(true);
      getApplicationResumeData(application.pipelineId, application._id)
        .then((data) => {
          setResumeData(data);
        })
        .catch((error) => {
          console.error("Failed to fetch resume data:", error);
          toast.error("Failed to load resume data");
        })
        .finally(() => {
          setLoadingResume(false);
        });
    } else if (application?.resumeData) {
      // Use resume data from application if already available
      setResumeData(application.resumeData);
    } else {
      setResumeData(null);
    }
  }, [isOpen, application]);

  if (!application) return null;

  const matchingScores = {
    overallScore:
      application.matchingDetails.overallFit ?? application.matchingScore ?? 0,
    skillsMatch: application.matchingDetails.skillsMatch ?? 0,
    experienceMatch: application.matchingDetails.experienceMatch ?? 0,
    educationMatch: application.matchingDetails.educationMatch ?? 0,
    locationMatch: application.matchingDetails.locationMatch ?? 0,
    vectorSimilarity: application.matchingDetails.vectorSimilarity,
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={application.candidatePhoto} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {getInitials(application.candidateName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-2xl mb-1">
                        {application.candidateName}
                      </DialogTitle>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">
                            {application.candidateEmail}
                          </span>
                        </div>
                        {application.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{application.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Applied{" "}
                            {format(
                              new Date(application.appliedAt),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="shrink-0"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>
            </motion.div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="resume">Resume</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="communication">Communication</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MatchingScoreBreakdown scores={matchingScores} />
                    {application.matchingDetails.aiAnalysis && (
                      <AIAnalysis
                        analysis={application.matchingDetails.aiAnalysis}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="resume" className="mt-6">
                  {loadingResume ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : resumeData?.structuredData ? (
                    <ResumeViewer
                      profile={null}
                      resumeData={resumeData.structuredData}
                      resumeUrl={resumeData.resumeUrl}
                      coverLetter={resumeData.coverLetter}
                    />
                  ) : profile ? (
                    <ResumeViewer profile={profile} />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Resume data not available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="profile" className="mt-6">
                  {loadingResume ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : resumeData?.structuredData ? (
                    <ProfileSections
                      profile={null}
                      resumeData={resumeData.structuredData}
                    />
                  ) : profile ? (
                    <ProfileSections profile={profile} />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Profile data not available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="mt-6">
                  <div className="space-y-4">
                    {application.notes && application.notes.length > 0 ? (
                      application.notes.map((note, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-l-primary pl-4"
                        >
                          <p className="text-sm">{note.note}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(
                              new Date(note.addedAt),
                              "MMM d, yyyy 'at' h:mm a"
                            )}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No notes added yet.
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="communication" className="mt-6">
                  <div className="space-y-4">
                    {application.emails && application.emails.length > 0 ? (
                      application.emails.map((email, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">
                              {email.subject}
                            </span>
                            <Badge variant="outline">{email.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {email.body}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sent{" "}
                            {format(
                              new Date(email.sentAt),
                              "MMM d, yyyy 'at' h:mm a"
                            )}{" "}
                            • Status: {email.status}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No communication history.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Separator />

            <div className="px-6 py-4 flex items-center justify-between gap-4 border-t bg-muted/50">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    application.status === "shortlisted"
                      ? "default"
                      : application.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {application.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Match Score: {application.matchingScore}%
                </span>
              </div>
              <div className="flex gap-2">
                {onShortlist && application.status !== "shortlisted" && (
                  <Button
                    variant="default"
                    onClick={() => onShortlist(application)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Shortlist
                  </Button>
                )}
                {onReject && application.status !== "rejected" && (
                  <Button
                    variant="destructive"
                    onClick={() => onReject(application)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                )}
                {onScheduleInterview && (
                  <Button
                    variant="outline"
                    onClick={() => onScheduleInterview(application)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
