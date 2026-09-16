import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronRight } from "lucide-react";
import { CandidateCard } from "./CandidateCard";
import { AIAnalysis } from "@/components/recruiter/matching/AIAnalysis";
import type { PipelineApplication } from "@/types/pipeline";

interface TopCandidatesProps {
  candidates: PipelineApplication[];
  onView?: (application: PipelineApplication) => void;
  onShortlist?: (application: PipelineApplication) => void;
  onReject?: (application: PipelineApplication) => void;
  onRevealNext?: () => void;
  maxVisible?: number;
}

export const TopCandidates: React.FC<TopCandidatesProps> = ({
  candidates,
  onView,
  onShortlist,
  onReject,
  onRevealNext,
  maxVisible = 5,
}) => {
  const [visibleCount, setVisibleCount] = useState(3);
  const visibleCandidates = candidates.slice(0, visibleCount);
  const hasMore = candidates.length > visibleCount;

  const handleRevealNext = () => {
    if (visibleCount < maxVisible) {
      setVisibleCount(Math.min(visibleCount + 1, maxVisible));
    }
    onRevealNext?.();
  };

  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Top Candidates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-ranked best matches for this position
          </p>
        </div>
        {hasMore && visibleCount < maxVisible && (
          <Button
            variant="outline"
            onClick={handleRevealNext}
            className="animate-pulse"
          >
            Reveal Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {visibleCandidates.map((candidate, index) => (
            <motion.div
              key={candidate._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden border-l-4 border-l-primary">
                {candidate.position && (
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={
                        candidate.position === 1
                          ? "default"
                          : candidate.position === 2
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs font-bold"
                    >
                      #{candidate.position}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {candidate.candidateName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Match Score</span>
                      <span
                        className={`text-lg font-bold ${
                          candidate.matchingScore >= 80
                            ? "text-green-600"
                            : candidate.matchingScore >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {candidate.matchingScore}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          candidate.matchingScore >= 80
                            ? "bg-green-500"
                            : candidate.matchingScore >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${candidate.matchingScore}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                    </div>
                  </div>

                  {candidate.matchingDetails.aiAnalysis && (
                    <div className="pt-2 border-t">
                      <AIAnalysis
                        analysis={candidate.matchingDetails.aiAnalysis}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {onView && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onView(candidate)}
                      >
                        View Details
                      </Button>
                    )}
                    {onShortlist && candidate.status !== "shortlisted" && (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => onShortlist(candidate)}
                      >
                        Shortlist
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
