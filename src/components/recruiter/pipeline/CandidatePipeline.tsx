import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { KanbanColumn } from "./KanbanColumn";
import { CandidateCard } from "./CandidateCard";
import { cn } from "@/lib/utils";
import type { PipelineApplication, ApplicationStatus } from "@/types/pipeline";

interface CandidatePipelineProps {
  applications: PipelineApplication[];
  onStatusChange?: (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => void;
  onView?: (application: PipelineApplication) => void;
  onShortlist?: (application: PipelineApplication) => void;
  onReject?: (application: PipelineApplication) => void;
}

const columns: Array<{
  id: ApplicationStatus;
  title: string;
  color: string;
}> = [
  {
    id: "pending",
    title: "Applied",
    color:
      "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
  },
  {
    id: "shortlisted",
    title: "Shortlisted",
    color:
      "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
  },
  {
    id: "hired",
    title: "Hired",
    color:
      "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900",
  },
  {
    id: "rejected",
    title: "Rejected",
    color: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
  },
];

function SortableCandidateCard({
  application,
  onView,
  onShortlist,
  onReject,
}: {
  application: PipelineApplication;
  onView?: (application: PipelineApplication) => void;
  onShortlist?: (application: PipelineApplication) => void;
  onReject?: (application: PipelineApplication) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CandidateCard
        application={application}
        onView={onView}
        onShortlist={onShortlist}
        onReject={onReject}
        isDragging={isDragging}
      />
    </div>
  );
}

export const CandidatePipeline: React.FC<CandidatePipelineProps> = ({
  applications,
  onStatusChange,
  onView,
  onShortlist,
  onReject,
}) => {
  const normalizedApplications = useMemo(
    () =>
      applications.map((app) =>
        app.status === "top-candidate"
          ? {
              ...app,
              status: "pending" as ApplicationStatus,
            }
          : app
      ),
    [applications]
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [localApplications, setLocalApplications] = useState(
    normalizedApplications
  );

  useEffect(() => {
    setLocalApplications(normalizedApplications);
  }, [normalizedApplications]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group applications by status
  const applicationsByStatus = useMemo(() => {
    return columns.reduce((acc, column) => {
      const columnApps = localApplications
        .filter((app) => app.status === column.id)
        .slice();

      if (column.id === "pending") {
        columnApps.sort((a, b) => b.matchingScore - a.matchingScore);
      }

      acc[column.id] = columnApps;
      return acc;
    }, {} as Record<ApplicationStatus, PipelineApplication[]>);
  }, [localApplications]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      // Dropped on a column - change status
      const application = localApplications.find((app) => app._id === activeId);
      if (application && application.status !== targetColumn.id) {
        const updated = localApplications.map((app) =>
          app._id === activeId
            ? { ...app, status: targetColumn.id as ApplicationStatus }
            : app
        );
        setLocalApplications(updated);
        onStatusChange?.(activeId, targetColumn.id as ApplicationStatus);
      }
      return;
    }

    // Check if dropped on another card
    const targetApplication = localApplications.find(
      (app) => app._id === overId
    );
    if (targetApplication) {
      // Same column - reorder
      const activeApp = localApplications.find((app) => app._id === activeId);
      if (activeApp && activeApp.status === targetApplication.status) {
        const columnApps = applicationsByStatus[activeApp.status];
        const oldIndex = columnApps.findIndex((app) => app._id === activeId);
        const newIndex = columnApps.findIndex((app) => app._id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(columnApps, oldIndex, newIndex);
          const updated = localApplications.map((app) => {
            const newIndex = reordered.findIndex((r) => r._id === app._id);
            if (newIndex !== -1) {
              return reordered[newIndex];
            }
            return app;
          });
          setLocalApplications(updated);
        }
      } else {
        // Different column - change status
        const updated = localApplications.map((app) =>
          app._id === activeId
            ? { ...app, status: targetApplication.status }
            : app
        );
        setLocalApplications(updated);
        onStatusChange?.(activeId, targetApplication.status);
      }
    }
  };

  const activeApplication = activeId
    ? localApplications.find((app) => app._id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max px-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              applications={applicationsByStatus[column.id] || []}
              color={column.color}
            >
              {(applicationsByStatus[column.id] || []).map((application) => (
                <SortableCandidateCard
                  key={application._id}
                  application={application}
                  onView={onView}
                  onShortlist={onShortlist}
                  onReject={onReject}
                />
              ))}
            </KanbanColumn>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeApplication ? (
          <div className="opacity-90">
            <CandidateCard application={activeApplication} isDragging={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
