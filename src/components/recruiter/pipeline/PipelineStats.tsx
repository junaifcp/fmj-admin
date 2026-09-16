import React from "react";
import { StatCard } from "./StatCard";
import { Briefcase, Users, CheckCircle2, XCircle } from "lucide-react";
import type { Pipeline } from "@/types/pipeline";

interface PipelineStatsProps {
  pipelines: Pipeline[];
}

export const PipelineStats: React.FC<PipelineStatsProps> = ({ pipelines }) => {
  const activePipelines = pipelines.filter((p) => p.status === "active").length;
  const totalApplications = pipelines.reduce(
    (sum, p) => sum + p.totalApplications,
    0
  );
  const totalShortlisted = pipelines.reduce((sum, p) => sum + p.shortlisted, 0);
  const totalHired = pipelines.reduce((sum, p) => sum + p.hired, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Active Pipelines"
        value={activePipelines}
        icon={Briefcase}
        delay={0}
        gradient="from-blue-500/20 via-blue-400/20 to-blue-600/20"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="Total Applications"
        value={totalApplications}
        icon={Users}
        delay={0.1}
        gradient="from-purple-500/20 via-purple-400/20 to-purple-600/20"
        iconColor="text-purple-600 dark:text-purple-400"
      />
      <StatCard
        title="Shortlisted"
        value={totalShortlisted}
        icon={CheckCircle2}
        delay={0.2}
        gradient="from-green-500/20 via-green-400/20 to-green-600/20"
        iconColor="text-green-600 dark:text-green-400"
      />
      <StatCard
        title="Hired"
        value={totalHired}
        icon={CheckCircle2}
        delay={0.3}
        gradient="from-emerald-500/20 via-emerald-400/20 to-emerald-600/20"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
    </div>
  );
};
