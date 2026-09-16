import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBadge } from "./ScoreBadge";
import { cn } from "@/lib/utils";
import type { MatchingScores } from "@/types/pipeline";

interface MatchingScoreBreakdownProps {
  scores: MatchingScores;
}

export const MatchingScoreBreakdown: React.FC<MatchingScoreBreakdownProps> = ({
  scores,
}) => {
  const categories = [
    {
      label: "Skills Match",
      score: scores.skillsMatch,
      color: "bg-blue-500",
    },
    {
      label: "Experience Match",
      score: scores.experienceMatch,
      color: "bg-purple-500",
    },
    {
      label: "Education Match",
      score: scores.educationMatch,
      color: "bg-green-500",
    },
    {
      label: "Location Match",
      score: scores.locationMatch,
      color: "bg-orange-500",
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matching Score Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="flex flex-col items-center justify-center py-4">
          <ScoreBadge score={scores.overallScore} size="lg" showLabel />
          <p className="text-sm text-muted-foreground mt-2">Overall Match</p>
        </div>

        {/* Category Scores */}
        <div className="space-y-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{category.label}</span>
                <span
                  className={cn(
                    "text-sm font-bold",
                    getScoreColor(category.score)
                  )}
                >
                  {category.score}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", category.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${category.score}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Vector Similarity (if available) */}
        {scores.vectorSimilarity !== undefined && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Similarity</span>
              <span
                className={cn(
                  "text-sm font-bold",
                  getScoreColor(scores.vectorSimilarity)
                )}
              >
                {scores.vectorSimilarity}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on semantic analysis of resume and job description
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
