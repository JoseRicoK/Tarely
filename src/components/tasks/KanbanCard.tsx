"use client";

import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { ImportancePicker } from "@/components/ui/importance-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Sparkles,
  Copy,
  Wand2,
  Check,
  UserPlus,
  MoveRight,
  Circle,
  CheckCircle2,
  Clock,
  ListTodo,
  Star,
  Flag,
  Bookmark,
  Tag,
  Folder,
  Archive,
  Inbox,
  Box,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import type { Task, TaskAssignee, WorkspaceSection, Subtask } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { SubtaskIndicator } from "./SubtaskList";

// Icon map for dynamic section icons
const iconMap: Record<string, LucideIcon> = {
  Circle,
  CheckCircle2,
  Clock,
  ListTodo,
  Star,
  Flag,
  Bookmark,
  Tag,
  Folder,
  Archive,
  Inbox,
  Box,
};

interface KanbanCardDraggableProps {
  task: Task;
  workspaceId: string;
  sections?: WorkspaceSection[];
  currentSectionId?: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onGeneratePrompt: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onMoveToSection?: (task: Task, sectionId: string) => void;
  onAssigneesChange?: (taskId: string, assignees: TaskAssignee[]) => void;
  onDueDateChange?: (taskId: string, dueDate: string | null) => void;
  onImportanceChange?: (taskId: string, importance: number) => void;
  onSubtasksChange?: (taskId: string, subtasks: Subtask[]) => void;
  onQuickDelete?: (task: Task) => void;
}

interface KanbanCardStaticProps {
  task: Task;
  isDragging?: boolean;
}

function getImportanceColor(importance: number): string {
  if (importance >= 9) return "bg-red-500/10 text-red-500 border-red-500/20";
  if (importance >= 7) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
  if (importance >= 5) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  if (importance >= 3) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  return "bg-slate-500/10 text-slate-500 border-slate-500/20";
}

function getImportanceLabel(importance: number): string {
  if (importance >= 9) return "Crítica";
  if (importance >= 7) return "Alta";
  if (importance >= 5) return "Media";
  if (importance >= 3) return "Baja";
  return "Muy baja";
}

function getImportanceBarColor(task: Task): string {
  if (task.completed) return "bg-green-500";
  if (task.importance >= 9) return "bg-red-500";
  if (task.importance >= 7) return "bg-orange-500";
  if (task.importance >= 5) return "bg-yellow-500";
  if (task.importance >= 3) return "bg-blue-500";
  return "bg-slate-400";
}

// Compact assignees display - just avatars
function AssigneesAvatars({ assignees }: { assignees: TaskAssignee[] }) {
  if (!assignees || assignees.length === 0) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const displayAssignees = assignees.slice(0, 3);
  const remaining = assignees.length - 3;

  return (
    <div className="flex -space-x-1.5">
      {displayAssignees.map((assignee) => {
        const avatarUrl = assignee.avatar?.startsWith("http")
          ? assignee.avatar
          : `${supabaseUrl}/storage/v1/object/public/avatars/${assignee.avatar}`;

        return (
          <TooltipProvider key={assignee.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative h-5 w-5 rounded-full border border-background overflow-hidden bg-muted">
                  <Image
                    src={avatarUrl}
                    alt={assignee.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{assignee.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      {remaining > 0 && (
        <div className="h-5 w-5 rounded-full border border-background bg-muted flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">+{remaining}</span>
        </div>
      )}
    </div>
  );
}

// Static card component without hooks - used for DragOverlay
export function KanbanCardStatic({
  task,
  isDragging = false,
}: KanbanCardStaticProps) {
  const timeAgo = formatDistanceToNow(new Date(task.createdAt), {
    addSuffix: true,
    locale: es,
  });

  const importanceColor = getImportanceColor(task.importance);
  const importanceLabel = getImportanceLabel(task.importance);

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card p-3 shadow-sm w-72",
        isDragging && "shadow-lg ring-2 ring-primary/50 opacity-90",
        task.completed && "opacity-70 bg-muted/30"
      )}
    >
      {/* Importance indicator bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
          getImportanceBarColor(task)
        )}
      />

      <div className="flex items-start gap-2">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5 mb-2">
            {/* Indicador de tarea nueva */}
            {task.isNew && (
              <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 animate-pulse" />
            )}
            <h3 className="font-medium text-sm leading-tight line-clamp-2">
              {task.title}
            </h3>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn("text-xs px-1.5 py-0", importanceColor)}
              >
                {task.importance} - {importanceLabel}
              </Badge>
              {task.dueDate && (() => {
                try {
                  const date = parseISO(task.dueDate);
                  if (isValid(date)) {
                    const isOverdue = date < new Date() && date.toDateString() !== new Date().toDateString();
                    return (
                      <span className={cn(
                        "text-xs",
                        isOverdue ? "text-red-500" : "text-muted-foreground"
                      )}>
                        📅 {format(date, "d MMM", { locale: es })}
                      </span>
                    );
                  }
                } catch { return null; }
                return null;
              })()}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {timeAgo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Draggable card component with hooks
export function KanbanCardDraggable({
  task,
  workspaceId,
  sections = [],
  currentSectionId,
  onEdit,
  onDelete,
  onGeneratePrompt,
  onToggleComplete,
  onMoveToSection,
  onAssigneesChange,
  onDueDateChange,
  onImportanceChange,
  onQuickDelete,
}: KanbanCardDraggableProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  // Track if we're dragging to prevent click navigation
  const wasDragging = React.useRef(false);

  // Update ref when dragging state changes
  React.useEffect(() => {
    if (isDragging) {
      wasDragging.current = true;
    }
  }, [isDragging]);

  const timeAgo = formatDistanceToNow(new Date(task.createdAt), {
    addSuffix: true,
    locale: es,
  });

  const importanceColor = getImportanceColor(task.importance);
  const hasAssignees = task.assignees && task.assignees.length > 0;
  const hasDueDate = !!task.dueDate;

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(task.title);
  };

  const handleNavigateToTask = () => {
    router.push(`/workspace/${workspaceId}/task/${task.id}`);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if we just finished dragging
    if (wasDragging.current) {
      wasDragging.current = false;
      return;
    }
    handleNavigateToTask();
  };

  // Placeholder for assign action - will open assignees popover
  const handleAssign = () => {
    // This would typically open a popover or dialog to manage assignees
    // For now, we'll just log it - the actual functionality is in TaskAssignees
    console.log("Assign user to task:", task.id, workspaceId);
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={cn(
        "group relative rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing touch-none",
        "hover:shadow-md hover:border-primary/20 transition-shadow",
        isDragging && "opacity-50",
        task.completed && "opacity-70 bg-muted/30"
      )}
    >
      {/* Importance indicator bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
          getImportanceBarColor(task)
        )}
      />

      <div className="flex items-start gap-2">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with title and menu */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-start gap-1.5 flex-1 min-w-0">
              {/* Indicador de tarea nueva */}
              {task.isNew && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 animate-pulse" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Tarea recién creada</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <h3 className="font-medium text-sm leading-tight line-clamp-2">
                {task.title}
              </h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNavigateToTask}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyTitle}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar título
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGeneratePrompt(task)}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generar prompt
                </DropdownMenuItem>
                {onAssigneesChange && (
                  <DropdownMenuItem onClick={handleAssign}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Asignar usuario
                  </DropdownMenuItem>
                )}
                {/* Submenú Mover a sección */}
                {sections.length > 0 && onMoveToSection && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <MoveRight className="h-4 w-4 mr-2" />
                        Mover a
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {sections.map((section) => {
                          const IconComponent = iconMap[section.icon] || Circle;
                          const isCurrentSection = section.id === currentSectionId;
                          return (
                            <DropdownMenuItem
                              key={section.id}
                              onClick={() => onMoveToSection(task, section.id)}
                              disabled={isCurrentSection}
                              className={cn(isCurrentSection && "opacity-50")}
                            >
                              <IconComponent 
                                className="h-4 w-4 mr-2" 
                                style={{ color: section.color }} 
                              />
                              {section.name}
                              {isCurrentSection && (
                                <Check className="h-3 w-3 ml-auto text-muted-foreground" />
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggleComplete(task)}>
                  <Check className="h-4 w-4 mr-2" />
                  {task.completed ? "Restaurar" : "Completar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => (onQuickDelete ? onQuickDelete(task) : onDelete(task))}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description preview */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
              {task.description}
            </p>
          )}

          {/* Footer with badges, assignees, date and time */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Importance badge/picker */}
              {!task.completed && onImportanceChange ? (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <ImportancePicker
                    value={task.importance}
                    onChange={(importance) => onImportanceChange(task.id, importance)}
                    compact
                  />
                </div>
              ) : (
                <Badge
                  variant="outline"
                  className={cn("text-xs px-1.5 py-0", importanceColor)}
                >
                  {task.importance}
                </Badge>
              )}

              {/* Source badge */}
              {task.source === "ai" && (
                <Sparkles className="h-3 w-3 text-primary" />
              )}

              {/* Assignees avatars */}
              <div className={cn(
                "transition-opacity duration-200",
                !hasAssignees && "opacity-0 group-hover:opacity-100"
              )}>
                <AssigneesAvatars assignees={task.assignees || []} />
              </div>

              {/* Date picker inline */}
              {!task.completed && onDueDateChange && (
                <div 
                  className={cn(
                    "transition-opacity duration-200",
                    !hasDueDate && "opacity-0 group-hover:opacity-100"
                  )}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <DatePicker
                    value={task.dueDate}
                    onChange={(date) => onDueDateChange(task.id, date)}
                    compact
                    showTime
                  />
                </div>
              )}
            </div>

            {/* Time and subtasks indicator */}
            <div className="flex items-center gap-2">
              {task.subtasks && task.subtasks.length > 0 && (
                <SubtaskIndicator subtasks={task.subtasks} />
              )}
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {timeAgo}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default export for backward compatibility
export const KanbanCard = KanbanCardDraggable;
