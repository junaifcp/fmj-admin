// src/components/admin/MetricCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatRevenue } from "@/utils/dateFilters";

interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  total: number;
  newCount: number;
  isLoading: boolean;
  isFiltering: boolean;
  isRevenue?: boolean;
  iconColor?: string;
  filterLabel?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  icon,
  total,
  newCount,
  isLoading,
  isFiltering,
  isRevenue = false,
  iconColor = "text-blue-600",
  filterLabel = "Yesterday",
}) => {
  const formatValue = (value: number) => {
    if (isRevenue) {
      return formatRevenue(value);
    }
    return formatNumber(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={iconColor}>{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="text-right">
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">
          {title}
        </CardTitle>
        <div className={iconColor}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-start">
          {/* Left Side: Total Count */}
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatValue(total)}
            </div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          {/* Right Side: New Count (if filtering) */}
          {isFiltering ? (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {formatValue(newCount)}
              </div>
              <p className="text-xs text-gray-500 mt-1">{filterLabel}</p>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-300">-</div>
              <p className="text-xs text-gray-400 mt-1">No filter</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
