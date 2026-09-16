import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface JobInsightsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  tooltip?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const JobInsightsCard = ({
  title,
  value,
  subtitle,
  trend,
  tooltip,
  icon,
  className = ""
}: JobInsightsCardProps) => {
  const TrendIcon = trend?.isPositive === true 
    ? TrendingUp 
    : trend?.isPositive === false 
    ? TrendingDown 
    : Minus;

  const trendColor = trend?.isPositive === true
    ? "text-green-600"
    : trend?.isPositive === false
    ? "text-red-600"
    : "text-muted-foreground";

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {title}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 text-xs mt-2 ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span>{trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};