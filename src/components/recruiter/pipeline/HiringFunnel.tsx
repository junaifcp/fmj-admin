// src/components/recruiter/pipeline/HiringFunnel.tsx
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  Link as LinkIcon,
  FileText,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  TrendingUp,
} from "lucide-react";
import { PipelineStatusTracking } from "@/types/pipeline";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface HiringFunnelProps {
  statusTracking?: PipelineStatusTracking;
  isLoading?: boolean;
  timeRemaining?: number;
}

const funnelStages = [
  {
    id: "database",
    label: "Database Search",
    icon: Database,
    color: "blue",
    gradient: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-50 to-blue-100",
    getValue: (tracking?: PipelineStatusTracking) =>
      tracking?.database?.found || 0,
    getSubValue: (tracking?: PipelineStatusTracking) =>
      tracking?.database?.applications || 0,
    getProgress: (tracking?: PipelineStatusTracking) => {
      const found = tracking?.database?.found || 0;
      const emailsSent = tracking?.database?.emailsSent || 0;
      return found > 0 ? Math.min(100, (emailsSent / found) * 100) : 0;
    },
    subLabel: "applications",
  },
  {
    id: "publicLink",
    label: "Public Link",
    icon: LinkIcon,
    color: "green",
    gradient: "from-green-500 to-green-600",
    bgGradient: "from-green-50 to-green-100",
    getValue: (tracking?: PipelineStatusTracking) =>
      tracking?.publicLink?.clicks || 0,
    getSubValue: (tracking?: PipelineStatusTracking) =>
      tracking?.publicLink?.applications || 0,
    getProgress: (tracking?: PipelineStatusTracking) => {
      const clicks = tracking?.publicLink?.clicks || 0;
      const applications = tracking?.publicLink?.applications || 0;
      return clicks > 0 ? Math.min(100, (applications / clicks) * 100) : 0;
    },
    subLabel: "applications",
  },
  //   {
  //     id: "blog",
  //     label: "Blog Post",
  //     icon: FileText,
  //     color: "purple",
  //     gradient: "from-purple-500 to-purple-600",
  //     bgGradient: "from-purple-50 to-purple-100",
  //     getValue: (tracking?: PipelineStatusTracking) =>
  //       tracking?.blog?.status === "published" ? 1 : 0,
  //     getSubValue: (tracking?: PipelineStatusTracking) => 0,
  //     getProgress: (tracking?: PipelineStatusTracking) =>
  //       tracking?.blog?.status === "published" ? 100 : 0,
  //     subLabel: "",
  //   },
  {
    id: "applications",
    label: "Applications Collected",
    icon: Users,
    color: "indigo",
    gradient: "from-indigo-500 to-indigo-600",
    bgGradient: "from-indigo-50 to-indigo-100",
    getValue: (tracking?: PipelineStatusTracking) => {
      const db = tracking?.database?.applications || 0;
      const publicLink = tracking?.publicLink?.applications || 0;
      return db + publicLink;
    },
    getSubValue: () => 0,
    getProgress: () => 0,
    subLabel: "",
  },
  {
    id: "matching",
    label: "AI Matching",
    icon: Sparkles,
    color: "orange",
    gradient: "from-orange-500 to-orange-600",
    bgGradient: "from-orange-50 to-orange-100",
    getValue: () => 0,
    getSubValue: () => 0,
    getProgress: () => 0,
    subLabel: "",
  },
];

const iconVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0 },
  hover: { scale: 1.1, rotate: 5 },
};

const cardVariants = {
  initial: { opacity: 0, x: -30, scale: 0.9 },
  animate: { opacity: 1, x: 0, scale: 1 },
  hover: { scale: 1.02, y: -2 },
};

export const HiringFunnel: React.FC<HiringFunnelProps> = ({
  statusTracking,
  isLoading,
  timeRemaining = 0,
}) => {
  if (isLoading && !statusTracking) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalApplications =
    (statusTracking?.database?.applications || 0) +
    (statusTracking?.publicLink?.applications || 0);

  const isMatchingReady = timeRemaining <= 0 && totalApplications > 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="py-6">
        <div className="space-y-4">
          <div className="text-center mb-6">
            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
            >
              Hiring Funnel
            </motion.h3>
            <p className="text-sm text-muted-foreground">
              {timeRemaining > 0
                ? "Real-time candidate engagement tracking"
                : "24-hour window complete - AI matching in progress"}
            </p>
          </div>

          {/* Funnel Visualization */}
          <div className="space-y-3">
            {funnelStages.map((stage, index) => {
              const Icon = stage.icon;
              const value = stage.getValue(statusTracking);
              const subValue = stage.getSubValue(statusTracking);
              const progress = stage.getProgress(statusTracking);
              const isActive =
                value > 0 || (stage.id === "matching" && isMatchingReady);
              const isCompleted =
                (stage.id === "database" &&
                  statusTracking?.database?.emailsSent > 0) ||
                (stage.id === "publicLink" &&
                  statusTracking?.publicLink?.clicks > 0) ||
                (stage.id === "blog" &&
                  statusTracking?.blog?.status === "published") ||
                (stage.id === "applications" && totalApplications > 0) ||
                (stage.id === "matching" && isMatchingReady);

              return (
                <React.Fragment key={stage.id}>
                  <motion.div
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    transition={{
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all duration-300",
                      isActive
                        ? cn(
                            stage.color === "blue" &&
                              "border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 shadow-md",
                            stage.color === "green" &&
                              "border-green-300 bg-gradient-to-r from-green-50 to-green-100 shadow-md",
                            stage.color === "purple" &&
                              "border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100 shadow-md",
                            stage.color === "indigo" &&
                              "border-indigo-300 bg-gradient-to-r from-indigo-50 to-indigo-100 shadow-md",
                            stage.color === "orange" &&
                              "border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 shadow-md"
                          )
                        : "border-gray-200 bg-gray-50/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Icon and Label */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <motion.div
                          variants={iconVariants}
                          initial="initial"
                          animate="animate"
                          whileHover="hover"
                          transition={{
                            delay: index * 0.1 + 0.2,
                            type: "spring",
                            stiffness: 400,
                            damping: 15,
                          }}
                          className={cn(
                            "p-2.5 rounded-lg shrink-0",
                            isActive
                              ? cn(
                                  stage.color === "blue" &&
                                    "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg",
                                  stage.color === "green" &&
                                    "bg-gradient-to-br from-green-500 to-green-600 shadow-lg",
                                  stage.color === "purple" &&
                                    "bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg",
                                  stage.color === "indigo" &&
                                    "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg",
                                  stage.color === "orange" &&
                                    "bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg"
                                )
                              : "bg-gray-200"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5 transition-colors",
                              isActive ? "text-white" : "text-gray-400"
                            )}
                          />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className={cn(
                              "font-semibold text-sm mb-0.5",
                              isActive ? "text-gray-900" : "text-gray-500"
                            )}
                          >
                            {stage.label}
                          </h4>
                          {subValue > 0 && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.3 }}
                              className="text-xs text-muted-foreground"
                            >
                              {subValue} {stage.subLabel}
                            </motion.p>
                          )}
                          {/* Progress Bar */}
                          {progress > 0 && (
                            <div className="mt-2">
                              <Progress value={progress} className="h-1.5" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Value and Status */}
                      <div className="flex items-center gap-3 shrink-0">
                        {stage.id === "matching" && timeRemaining > 0 ? (
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="text-right"
                          >
                            <div className="text-xs text-muted-foreground mb-1">
                              Waiting...
                            </div>
                            <Clock className="h-4 w-4 text-muted-foreground mx-auto" />
                          </motion.div>
                        ) : (
                          <>
                            {isCompleted && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 15,
                                }}
                              >
                                <Badge
                                  variant="default"
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Complete
                                </Badge>
                              </motion.div>
                            )}
                            <div className="text-right min-w-[60px]">
                              {stage.id === "blog" ? (
                                <motion.div
                                  animate={{
                                    scale:
                                      statusTracking?.blog?.status ===
                                      "published"
                                        ? [1, 1.2, 1]
                                        : 1,
                                  }}
                                  transition={{
                                    duration: 0.5,
                                    repeat:
                                      statusTracking?.blog?.status ===
                                      "published"
                                        ? Infinity
                                        : 0,
                                    repeatDelay: 1,
                                  }}
                                  className="text-2xl font-bold"
                                >
                                  {statusTracking?.blog?.status ===
                                  "published" ? (
                                    <span className="text-green-600">✓</span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </motion.div>
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 + 0.2 }}
                                  className="text-xl font-bold"
                                >
                                  <AnimatedCounter value={value} />
                                </motion.div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Arrow Connector */}
                  {index < funnelStages.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{
                        delay: index * 0.1 + 0.15,
                        type: "spring",
                        stiffness: 200,
                      }}
                      className="flex justify-center -my-1"
                    >
                      <motion.div
                        animate={{
                          y: [0, 4, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <ArrowRight className="h-5 w-5 text-gray-300 rotate-90" />
                      </motion.div>
                    </motion.div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pt-4 mt-4 border-t"
          >
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </motion.div>
                <span className="text-sm font-semibold text-gray-700">
                  Total Applications Collected
                </span>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  delay: 0.7,
                }}
              >
                <Badge
                  variant="default"
                  className="text-base px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                >
                  <Zap className="h-4 w-4 mr-1.5" />
                  <AnimatedCounter value={totalApplications} />
                </Badge>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};
