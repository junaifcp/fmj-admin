import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare,
  Phone,
  Video,
  Building,
  TrendingUp,
  UserX,
  Plus
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getLocationLabel } from "@/utils/format";
import type { CandidateWithDetails } from "@/types/jobInsights";

interface CandidateDetailPanelProps {
  candidate: CandidateWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onAddNote?: (content: string) => Promise<void>;
  onAdvanceStage?: (newStage: CandidateWithDetails["stage"]) => Promise<void>;
  onReject?: () => Promise<void>;
  onScheduleInterview?: (type: "phone" | "video" | "onsite") => Promise<void>;
  onSendMessage?: (message: string) => Promise<void>;
}

const stageColors = {
  applied: "bg-blue-100 text-blue-800",
  screened: "bg-yellow-100 text-yellow-800", 
  interview: "bg-purple-100 text-purple-800",
  offer: "bg-orange-100 text-orange-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800"
};

const qualityColors = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-red-100 text-red-800"
};

export const CandidateDetailPanel = ({
  candidate,
  isOpen,
  onClose,
  onAddNote,
  onAdvanceStage,
  onReject,
  onScheduleInterview,
  onSendMessage
}: CandidateDetailPanelProps) => {
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  if (!candidate) return null;

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setIsAddingNote(true);
    try {
      await onAddNote?.(newNote);
      setNewNote("");
    } finally {
      setIsAddingNote(false);
    }
  };

  const nextStage = {
    applied: "screened",
    screened: "interview", 
    interview: "offer",
    offer: "hired"
  }[candidate.stage] as CandidateWithDetails["stage"];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl">
        <ScrollArea className="h-full">
          <SheetHeader className="pb-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={candidate.profileImageUrl} />
                <AvatarFallback className="text-lg">
                  {(candidate.firstName?.[0] || '') + (candidate.lastName?.[0] || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-xl">
                  {candidate.firstName} {candidate.lastName}
                </SheetTitle>
                <SheetDescription className="text-base">
                  {candidate.email}
                </SheetDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant="secondary"
                    className={stageColors[candidate.stage]}
                  >
                    {candidate.stage}
                  </Badge>
                  {candidate.qualityScore && (
                    <Badge 
                      variant="secondary"
                      className={qualityColors[candidate.qualityScore]}
                    >
                      {candidate.qualityScore} quality
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {nextStage && (
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => onAdvanceStage?.(nextStage)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Move to {nextStage}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => onSendMessage?.("")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => onScheduleInterview?.("video")}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Schedule Video
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => onScheduleInterview?.("phone")}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Schedule Call
                  </Button>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => onReject?.()}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Reject Candidate
                </Button>
              </CardContent>
            </Card>

            {/* Candidate Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Candidate Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.email}</span>
                  </div>
                  {candidate.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{getLocationLabel(candidate.location)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Applied {format(parseISO(candidate.appliedAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Source: {candidate.source}</span>
                  </div>
                  {candidate.experience && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{candidate.experience} years experience</span>
                    </div>
                  )}
                </div>

                {candidate.skills && candidate.skills.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {(candidate.skills as any[]).map((s, index) => {
                        const label = typeof s === "string" ? s : (s?.name || s?.skill || "");
                        return (
                          <Badge key={index} variant="outline">
                            {label || "Skill"}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resume */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Resume
                </Button>
              </CardContent>
            </Card>

            {/* Cover Letter */}
            {candidate.coverLetter && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cover Letter</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {candidate.coverLetter}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            {candidate.timeline && candidate.timeline.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {candidate.timeline.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.action}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(item.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.notes && candidate.notes.length > 0 && (
                  <div className="space-y-3">
                    {candidate.notes.map((note) => (
                      <div key={note.id} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(note.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || isAddingNote}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};