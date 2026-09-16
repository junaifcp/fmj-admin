import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { JobInsights } from "@/types/jobInsights";

interface FunnelVisualizationProps {
  funnel: JobInsights["funnel"];
  conversions: JobInsights["funnelConversions"];
}

const funnelStages = [
  { key: "applied", label: "Applied", color: "bg-blue-500" },
  { key: "screened", label: "Screened", color: "bg-green-500" },
  { key: "interview", label: "Interview", color: "bg-yellow-500" },
  { key: "offer", label: "Offer", color: "bg-orange-500" },
  { key: "hired", label: "Hired", color: "bg-purple-500" },
] as const;

const conversionKeys = [
  "appliedToScreened",
  "screenedToInterview", 
  "interviewToOffer",
  "offerToHired"
] as const;

export const FunnelVisualization = ({ funnel, conversions }: FunnelVisualizationProps) => {
  const maxCount = Math.max(...Object.values(funnel));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Candidate Funnel</span>
          <span className="text-sm font-normal text-muted-foreground">
            Overall Conversion: {conversions.overallConversion}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {funnelStages.map((stage, index) => {
          const count = funnel[stage.key];
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const conversionRate = index < conversionKeys.length 
            ? conversions[conversionKeys[index]]
            : null;

          return (
            <div key={stage.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-3 h-3 rounded-full ${stage.color}`}
                    aria-hidden="true"
                  />
                  <span className="font-medium">{stage.label}</span>
                  <span className="text-lg font-bold">{count}</span>
                </div>
                {conversionRate !== null && (
                  <span className="text-sm text-muted-foreground">
                    {conversionRate}% conversion
                  </span>
                )}
              </div>
              
              <div className="relative">
                <Progress 
                  value={percentage} 
                  className="h-8"
                  aria-label={`${stage.label}: ${count} candidates (${percentage.toFixed(1)}%)`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-white mix-blend-difference">
                    {count}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};