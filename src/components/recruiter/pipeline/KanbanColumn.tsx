import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";
import type { PipelineApplication, ApplicationStatus } from "@/types/pipeline";

interface KanbanColumnProps {
  id: ApplicationStatus;
  title: string;
  applications: PipelineApplication[];
  children: React.ReactNode;
  color?: string;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  applications,
  children,
  color = "bg-gray-100 dark:bg-gray-800",
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="flex flex-col h-full min-w-[280px]">
      {/* Column Header */}
      <div
        className={cn(
          "p-3 rounded-t-lg border-b-2",
          color,
          isOver && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="ml-2">
            {applications.length}
          </Badge>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 space-y-3 overflow-y-auto rounded-b-lg border-x border-b",
          color,
          isOver && "bg-primary/10"
        )}
      >
        {applications.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No candidates"
            description="Drag candidates here or they will appear automatically"
            className="py-8"
          />
        ) : (
          <SortableContext
            items={applications.map((app) => app._id)}
            strategy={verticalListSortingStrategy}
          >
            {children}
          </SortableContext>
        )}
      </div>
    </div>
  );
};
