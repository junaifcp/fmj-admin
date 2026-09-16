import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIAnalysis as AIAnalysisType } from "@/types/pipeline";

interface AIAnalysisProps {
  analysis: AIAnalysisType;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ analysis }) => {
  const recommendationColors = {
    strong:
      "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400",
    moderate:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400",
    weak: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Analysis</CardTitle>
          <Badge
            className={cn(
              "capitalize",
              recommendationColors[analysis.recommendation]
            )}
          >
            {analysis.recommendation} Match
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div>
          <div className="flex items-start gap-2 mb-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          </div>
        </div>

        {/* Strengths */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Strengths
            </h4>
            <ul className="space-y-1">
              {analysis.strengths.map((strength, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>{strength}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {analysis.concerns && analysis.concerns.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Concerns
            </h4>
            <ul className="space-y-1">
              {analysis.concerns.map((concern, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{concern}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
