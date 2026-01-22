"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
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
  User,
  Copy,
  Wand2,
  Check,
  RotateCcw,
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
  ListChecks,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import type { Task, TaskAssignee, WorkspaceSection, Subtask } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
import { TaskAssignees } from "./TaskAssignees";
import { SubtaskList } from "./SubtaskList";

interface TaskCardProps {
  task: Task;
  workspaceId: string;
  sections?: WorkspaceSection[];
  currentSectionId?: string | null;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onGeneratePrompt: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onMoveToSection?: (task: Task, sectionId: string) => void;
  onAssigneesChange?: (taskId: string, assignees: TaskAssignee[]) => void;
  onDueDateChange?: (taskId: string, dueDate: string | null) => void;
  onImportanceChange?: (taskId: string, importance: number) => void;
  onSubtasksChange?: (taskId: string, subtasks: Subtask[]) => void;
  onQuickDelete?: (task: Task) => void; // Para eliminar directamente sin confirmación (vista completadas)
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

export function TaskCard({
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
  onSubtasksChange,
  onQuickDelete,
}: TaskCardProps) {
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  
  const timeAgo = formatDistanceToNow(new Date(task.createdAt), {
    addSuffix: true,
    locale: es,
  });

  const importanceColor = getImportanceColor(task.importance);
  const importanceLabel = getImportanceLabel(task.importance);

  const hasAssignees = task.assignees && task.assignees.length > 0;
  const hasDueDate = !!task.dueDate;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  // Función para generar subtareas con IA
  const handleGenerateSubtasks = async () => {
    if (!onSubtasksChange) return;
    
    setIsGeneratingSubtasks(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generate: true, workspaceId }),
      });

      if (!res.ok) throw new Error("Error al generar subtareas");

      const data = await res.json();
      if (data.subtasks) {
        onSubtasksChange(task.id, [...(task.subtasks || []), ...data.subtasks]);
        toast.success(`${data.subtasks.length} subtareas generadas`);
      }
    } catch {
      toast.error("Error al generar subtareas");
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  return (
    <div className={cn(
      "group relative flex gap-4 p-4 rounded-lg border bg-card transition-all duration-200 hover:shadow-md hover:border-primary/20",
      task.completed && "opacity-70 bg-muted/30"
    )}>
      {/* Importance indicator bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all",
          task.completed
            ? "bg-green-500"
            : task.importance >= 9
            ? "bg-red-500"
            : task.importance >= 7
            ? "bg-orange-500"
            : task.importance >= 5
            ? "bg-yellow-500"
            : task.importance >= 3
            ? "bg-blue-500"
            : "bg-slate-400"
        )}
      />

      {/* Botones de estado (completar y mover) */}
      <div className="flex flex-col items-center gap-1">
        {/* Botón de completar */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={task.completed ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all shadow-sm",
                  task.completed 
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/25" 
                    : "hover:bg-green-500/15 hover:text-green-600 hover:border-green-500 hover:shadow-md hover:shadow-green-500/20"
                )}
                onClick={() => onToggleComplete(task)}
              >
                {task.completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4 opacity-60" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{task.completed ? "Marcar como pendiente" : "Completar tarea"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Botón de mover a sección (solo si no está completada y hay secciones) */}
        {!task.completed && sections.length > 0 && onMoveToSection && (
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full transition-all hover:bg-primary/10 hover:text-primary hover:border-primary"
                    >
                      <MoveRight className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mover a sección</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="start">
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
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header with title and badges */}
        <div className="flex items-start gap-2 mb-2">
          <h3 className={cn(
            "font-medium leading-snug flex-1 break-words",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h3>
        </div>

        {/* Description if exists */}
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Footer with badges and meta */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Importancia - editable inline si no está completada */}
          {!task.completed && onImportanceChange ? (
            <ImportancePicker
              value={task.importance}
              onChange={(importance) => onImportanceChange(task.id, importance)}
              compact
            />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={cn("text-xs", importanceColor)}>
                    {task.importance}/10 · {importanceLabel}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Importancia: {task.importance} de 10</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Badge
            variant="secondary"
            className="text-xs gap-1"
          >
            {task.source === "ai" ? (
              <>
                <Sparkles className="h-3 w-3" />
                IA
              </>
            ) : (
              <>
                <User className="h-3 w-3" />
                Manual
              </>
            )}
          </Badge>

          {/* Asignados - visible siempre si hay, hover si vacío */}
          {!task.completed && onAssigneesChange && (
            <div className={cn(!hasAssignees && "opacity-0 group-hover:opacity-100 transition-opacity")}>
              <TaskAssignees
                taskId={task.id}
                workspaceId={workspaceId}
                assignees={task.assignees || []}
                onAssigneesChange={(assignees) => onAssigneesChange(task.id, assignees)}
                compact
              />
            </div>
          )}

          {/* Fecha límite - visible siempre si hay, hover si vacío */}
          {!task.completed && onDueDateChange && (
            <div className={cn(!hasDueDate && "opacity-0 group-hover:opacity-100 transition-opacity")}>
              <DatePicker
                value={task.dueDate}
                onChange={(date) => onDueDateChange(task.id, date)}
                compact
                showTime
              />
            </div>
          )}

          <span className="text-xs text-muted-foreground ml-auto">
            {timeAgo}
          </span>
        </div>

        {/* Subtareas */}
        {!task.completed && onSubtasksChange && (
          <SubtaskList
            taskId={task.id}
            workspaceId={workspaceId}
            subtasks={task.subtasks || []}
            onSubtasksChange={(subtasks) => onSubtasksChange(task.id, subtasks)}
          />
        )}

        {/* Indicador de subtareas si está completada */}
        {task.completed && hasSubtasks && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3" />
            {task.subtasks?.filter(s => s.completed).length}/{task.subtasks?.length} subtareas
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-start gap-1">
        {/* Botón restaurar si está completada */}
        {task.completed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onToggleComplete(task)}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="sr-only">Restaurar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Restaurar tarea</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Botón generar subtareas con IA */}
        {!task.completed && onSubtasksChange && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary hover:bg-primary/10"
                  onClick={handleGenerateSubtasks}
                  disabled={isGeneratingSubtasks}
                >
                  {isGeneratingSubtasks ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ListChecks className="h-4 w-4" />
                  )}
                  <span className="sr-only">Generar subtareas</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generar subtareas con IA</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Botón eliminar directo para vista de completadas */}
        {onQuickDelete && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onQuickDelete(task)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Eliminar tarea</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Opciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!task.completed && (
              <>
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGeneratePrompt(task)}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generar prompt
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(task.title)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar título
            </DropdownMenuItem>
            {/* Submenú Mover a sección */}
            {sections.length > 0 && onMoveToSection && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <MoveRight className="mr-2 h-4 w-4" />
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
            <DropdownMenuItem
              onClick={() => onDelete(task)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
