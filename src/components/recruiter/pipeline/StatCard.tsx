import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  delay?: number;
  gradient?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  delay = 0,
  gradient = "from-blue-500/20 via-blue-400/20 to-blue-600/20",
  iconColor = "text-blue-600 dark:text-blue-400",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        "relative overflow-hidden rounded-lg border-2 bg-gradient-to-br",
        gradient,
        "dark:from-background/50 dark:via-muted/20 dark:to-background/50",
        "hover:shadow-lg transition-all duration-300 border-primary/10",
        "p-6"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {title}
          </p>
          <AnimatedCounter
            value={value}
            duration={2}
            className="text-3xl font-bold text-foreground"
          />
        </div>
        <div
          className={cn(
            "p-3 rounded-lg bg-gradient-to-br shadow-md",
            iconColor
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};
