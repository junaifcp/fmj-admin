import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";
import type { CandidateProfile } from "@/types/pipeline";

interface ResumeViewerProps {
  profile?: CandidateProfile | null;
  resumeData?: any;
  resumeUrl?: string;
  coverLetter?: string;
}

export const ResumeViewer: React.FC<ResumeViewerProps> = ({
  profile,
  resumeData,
  resumeUrl,
  coverLetter,
}) => {
  const url = resumeUrl || profile?.resumeUrl;
  const handleDownload = () => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume
          </CardTitle>
          {url && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(url, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {coverLetter && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Cover Letter</h3>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{coverLetter}</p>
            </div>
          </div>
        )}
        {url ? (
          <div className="aspect-[8.5/11] bg-muted rounded-lg flex items-center justify-center">
            <iframe
              src={url}
              className="w-full h-full rounded-lg"
              title="Resume Preview"
            />
          </div>
        ) : (
          <div className="aspect-[8.5/11] bg-muted rounded-lg flex flex-col items-center justify-center text-center p-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Resume not available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
