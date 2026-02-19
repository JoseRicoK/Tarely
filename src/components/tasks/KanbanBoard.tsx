"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { Task, TaskAssignee, TaskTag, WorkspaceSection } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCardDraggable, KanbanCardStatic } from "./KanbanCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface KanbanBoardProps {
  tasks: Task[];
  sections: WorkspaceSection[];
  workspaceId: string;
  onTaskSectionChange: (taskId: string, sectionId: string) => Promise<void>;
  onMoveToSection?: (task: Task, sectionId: string) => void;
  onSectionsReorder?: (sections: WorkspaceSection[]) => void;
  onEditSection?: (section: WorkspaceSection) => void;
  onDeleteSection?: (section: WorkspaceSection) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onGeneratePrompt: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onAssigneesChange?: (taskId: string, assignees: TaskAssignee[]) => void;
  onDueDateChange?: (taskId: string, dueDate: string | null) => void;
  onImportanceChange?: (taskId: string, importance: number) => void;
  onTagsChange?: (taskId: string, tags: TaskTag[]) => void;
  onQuickDelete?: (task: Task) => void;
  onAddSection?: () => void;
  searchQuery: string;
  selectedTagIds?: string[];
  sortField: "importance" | "createdAt";
  sortOrder: "asc" | "desc";
}

export function KanbanBoard({
  tasks,
  sections,
  workspaceId,
  onTaskSectionChange,
  onMoveToSection,
  onSectionsReorder,
  onEditSection,
  onDeleteSection,
  onEdit,
  onDelete,
  onGeneratePrompt,
  onToggleComplete,
  onAssigneesChange,
  onDueDateChange,
  onImportanceChange,
  onTagsChange,
  onQuickDelete,
  onAddSection,
  searchQuery,
  selectedTagIds,
  sortField,
  sortOrder,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeType, setActiveType] = useState<"task" | "section" | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  // Section IDs for sortable context
  const sectionIds = useMemo(() => sections.map(s => s.id), [sections]);

  // Filter and sort tasks
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    // Filter by selected tags
    if (selectedTagIds && selectedTagIds.length > 0) {
      result = result.filter((t) =>
        selectedTagIds.some(tagId => t.tags?.some(tt => tt.tagId === tagId))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === "importance") {
        return sortOrder === "desc"
          ? b.importance - a.importance
          : a.importance - b.importance;
      } else {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      }
    });

    return result;
  }, [tasks, searchQuery, selectedTagIds, sortField, sortOrder]);

  // Helper to determine which section a task belongs to
  // Uses sectionId if available, otherwise falls back to legacy completed flag
  const getTaskSection = useCallback((task: Task): string | null => {
    if (task.sectionId) return task.sectionId;
    
    // Legacy fallback based on completed flag
    if (task.completed) {
      const completedSection = sections.find(s => s.name === "Completadas");
      return completedSection?.id || null;
    }
    const pendingSection = sections.find(s => s.name === "Pendientes");
    return pendingSection?.id || sections[0]?.id || null;
  }, [sections]);

  // Group tasks by section
  const tasksBySection = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    sections.forEach((section) => {
      grouped[section.id] = [];
    });
    
    processedTasks.forEach((task) => {
      const sectionId = getTaskSection(task);
      if (sectionId && grouped[sectionId]) {
        grouped[sectionId].push(task);
      } else if (sections.length > 0) {
        // Fallback to first section
        grouped[sections[0].id].push(task);
      }
    });
    
    return grouped;
  }, [processedTasks, sections, getTaskSection]);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId),
    [tasks, activeId]
  );

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeId),
    [sections, activeId]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    // Determine if dragging a section or a task
    const isSection = sections.some(s => s.id === id);
    setActiveType(isSection ? "section" : "task");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeItemId = active.id as string;
    const overId = over.id as string;

    // Handle section reordering
    if (activeType === "section") {
      if (activeItemId !== overId) {
        const oldIndex = sections.findIndex(s => s.id === activeItemId);
        const newIndex = sections.findIndex(s => s.id === overId);
        if (oldIndex !== -1 && newIndex !== -1 && onSectionsReorder) {
          onSectionsReorder(arrayMove(sections, oldIndex, newIndex));
        }
      }
      return;
    }

    // Handle task dragging
    const task = tasks.find((t) => t.id === activeItemId);
    if (!task) return;

    // Check if dropped on a section
    const targetSection = sections.find((s) => s.id === overId);
    if (targetSection) {
      const currentSectionId = getTaskSection(task);
      if (currentSectionId !== targetSection.id) {
        await onTaskSectionChange(activeItemId, targetSection.id);
      }
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      const overTaskSectionId = getTaskSection(overTask);
      const currentSectionId = getTaskSection(task);
      if (overTaskSectionId && currentSectionId !== overTaskSectionId) {
        await onTaskSectionChange(activeItemId, overTaskSectionId);
      }
    }
  };

  const handleMoveSection = useCallback((section: WorkspaceSection, direction: "left" | "right") => {
    if (!onSectionsReorder) return;
    const idx = sections.findIndex(s => s.id === section.id);
    if (idx === -1) return;
    const newIndex = direction === "left" ? idx - 1 : idx + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    onSectionsReorder(arrayMove(sections, idx, newIndex));
  }, [sections, onSectionsReorder]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full pb-4">
        <SortableContext items={sectionIds} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-4 min-h-[500px] pb-4">
            {sections.map((section, index) => (
              <KanbanColumn
                key={section.id}
                section={section}
                count={tasksBySection[section.id]?.length || 0}
                onEditSection={onEditSection}
                onDeleteSection={onDeleteSection}
                onMoveLeft={onSectionsReorder ? (s) => handleMoveSection(s, "left") : undefined}
                onMoveRight={onSectionsReorder ? (s) => handleMoveSection(s, "right") : undefined}
                isFirst={index === 0}
                isLast={index === sections.length - 1}
              >
                {(tasksBySection[section.id] || []).map((task) => (
                  <KanbanCardDraggable
                    key={task.id}
                    task={task}
                    workspaceId={workspaceId}
                    sections={sections}
                    currentSectionId={section.id}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onGeneratePrompt={onGeneratePrompt}
                    onToggleComplete={onToggleComplete}
                    onMoveToSection={onMoveToSection}
                    onAssigneesChange={onAssigneesChange}
                    onDueDateChange={onDueDateChange}
                    onImportanceChange={onImportanceChange}
                    onTagsChange={onTagsChange}
                    onQuickDelete={section.name === "Completadas" ? onQuickDelete : undefined}
                  />
                ))}
              </KanbanColumn>
            ))}
            
            {/* Add section button */}
            {onAddSection && (
              <div className="flex-shrink-0 w-64 sm:w-80">
                <Button
                  variant="outline"
                  className="w-full h-full min-h-[400px] border-dashed flex flex-col gap-2 text-muted-foreground hover:text-foreground hover:border-ta/50"
                  onClick={onAddSection}
                >
                  <Plus className="h-6 w-6" />
                  <span>Añadir sección</span>
                </Button>
              </div>
            )}
          </div>
        </SortableContext>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay dropAnimation={null}>
        {activeType === "task" && activeTask ? (
          <KanbanCardStatic
            task={activeTask}
            isDragging
          />
        ) : activeType === "section" && activeSection ? (
          <div 
            className="w-64 sm:w-80 h-12 rounded-lg border-2 border-dashed border-ta/50 bg-ta/10 flex items-center justify-center"
            style={{ backgroundColor: `${activeSection.color}30` }}
          >
            <span className="font-medium text-sm">{activeSection.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
