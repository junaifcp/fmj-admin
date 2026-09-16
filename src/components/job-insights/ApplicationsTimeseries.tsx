import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { JobInsights } from "@/types/jobInsights";

interface ApplicationsTimeseriesProps {
  data: JobInsights["applicationsTimeseries"];
  onDateRangeChange?: (range: "7d" | "30d" | "90d") => void;
  selectedRange?: "7d" | "30d" | "90d";
}

export const ApplicationsTimeseries = ({ 
  data, 
  onDateRangeChange, 
  selectedRange = "30d" 
}: ApplicationsTimeseriesProps) => {
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), "MMM dd"),
    fullDate: format(parseISO(item.date), "MMMM dd, yyyy")
  }));

  const totalApplications = data.reduce((sum, item) => sum + item.count, 0);
  const avgPerDay = data.length > 0 ? (totalApplications / data.length).toFixed(1) : "0";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.fullDate}</p>
          <p className="text-sm text-primary">
            Applications: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Applications Over Time
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {totalApplications} total applications • {avgPerDay} avg per day
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedRange === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => onDateRangeChange?.("7d")}
            >
              7 days
            </Button>
            <Button
              variant={selectedRange === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => onDateRangeChange?.("30d")}
            >
              30 days
            </Button>
            <Button
              variant={selectedRange === "90d" ? "default" : "outline"}
              size="sm"
              onClick={() => onDateRangeChange?.("90d")}
            >
              90 days
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="formattedDate"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};