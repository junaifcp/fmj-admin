import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { useState } from "react";
import type { JobInsights } from "@/types/jobInsights";

interface SourceBreakdownChartProps {
  sources: JobInsights["sources"];
  onSourceFilter?: (source: string) => void;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const SourceBreakdownChart = ({
  sources,
  onSourceFilter,
}: SourceBreakdownChartProps) => {
  const [viewType, setViewType] = useState<"pie" | "bar">("pie");

  const chartData = sources.map((source, index) => ({
    ...source,
    fill: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.source}</p>
          <p className="text-sm text-muted-foreground">
            Applications: {data.count}
          </p>
          <p className="text-sm text-muted-foreground">
            Conversion: {data.conversion}%
          </p>
        </div>
      );
    }
    return null;
  };

  const handleSourceClick = (source: string) => {
    onSourceFilter?.(source);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Application Sources</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewType === "pie" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("pie")}
              disabled={!sources.length}
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewType === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("bar")}
              disabled={!sources.length}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sources.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Data not available
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {viewType === "pie" ? (
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      onClick={(data) => handleSourceClick(data.source)}
                      className="cursor-pointer"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          className="hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                ) : (
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="source"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      onClick={(data) => handleSourceClick(data.source)}
                      className="cursor-pointer"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          className="hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Source list */}
            <div className="mt-4 space-y-2">
              {sources.map((source, index) => (
                <div
                  key={source.source}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleSourceClick(source.source)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{source.source}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{source.count}</div>
                    <div className="text-xs text-muted-foreground">
                      {source.conversion}% conversion
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
