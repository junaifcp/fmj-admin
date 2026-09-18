import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "card" | "text" | "circle" | "rect";
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = "rect",
  count = 1,
  className,
}) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";

  const variantClasses = {
    card: "h-48 w-full",
    text: "h-4 w-full",
    circle: "h-12 w-12 rounded-full",
    rect: "h-20 w-full",
  };

  if (count > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={cn(baseClasses, variantClasses[variant])}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)} />
  );
};
