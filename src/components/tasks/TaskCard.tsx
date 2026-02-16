"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Wand2,
  UserPlus,
  CalendarIcon,
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
  ExternalLink,
  FileText,
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
import { RecurrenceBadge } from "./RecurrenceSelector";

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
  const router = useRouter();
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const timeAgo = formatDistanceToNow(new Date(task.createdAt), {
    addSuffix: true,
    locale: es,
  });

  const importanceColor = getImportanceColor(task.importance);
  const importanceLabel = getImportanceLabel(task.importance);

  // Navegar a la página de detalle de la tarea
  const handleNavigateToTask = () => {
    router.push(`/workspace/${workspaceId}/task/${task.id}`);
  };

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
    <div 
      className={cn(
        "group relative flex gap-3 md:gap-4 p-3 md:p-4 rounded-lg border bg-card transition-all duration-200 hover:shadow-md hover:border-ta/20 cursor-pointer",
        task.completed && "opacity-70 bg-muted/30"
      )}
      onClick={handleNavigateToTask}
    >
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
      <div className="flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {/* Botón de completar */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={task.completed ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-7 w-7 md:h-8 md:w-8 rounded-full transition-all shadow-sm",
                  task.completed 
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/25" 
                    : "hover:bg-green-500/15 hover:text-green-600 hover:border-green-500 hover:shadow-md hover:shadow-green-500/20"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(task);
                }}
              >
                {task.completed ? (
                  <Check className="h-3.5 w-3.5 md:h-4 md:w-4" />
                ) : (
                  <Check className="h-3.5 w-3.5 md:h-4 md:w-4 opacity-60" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{task.completed ? "Marcar como pendiente" : "Completar tarea"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Botón de mover a sección - solo desktop (en móvil va dentro del dropdown) */}
        {!task.completed && sections.length > 0 && onMoveToSection && (
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="hidden md:flex h-7 w-7 rounded-full transition-all hover:bg-ta/10 hover:text-ta-light hover:border-ta"
                      onClick={(e) => e.stopPropagation()}
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
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
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
        {/* Indicador de nota vinculada - DISEÑO MEJORADO Y CLICKABLE */}
        {task.noteId && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border-l-[3px] border-purple-500 hover:from-purple-500/25 hover:to-indigo-500/25 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/notes?noteId=${task.noteId}`);
            }}
          >
            <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 block">Nota Vinculada</span>
            </div>
            <ExternalLink className="h-3 w-3 text-purple-600 dark:text-purple-400 shrink-0" />
          </div>
        )}
        
        {/* Header with title and badges */}
        <div className="flex items-start gap-2 mb-1.5 md:mb-2">
          {/* Indicador de tarea nueva */}
          {task.isNew && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 md:mt-2 flex-shrink-0 animate-pulse" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Tarea recién creada</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <h3 className={cn(
            "font-medium leading-snug flex-1 break-words text-[15px] md:text-base",
            task.completed && "line-through text-muted-foreground",
            task.noteId && "font-semibold"
          )}>
            {task.title}
          </h3>
        </div>

        {/* Description if exists */}
        {task.description && (
          <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-1 md:line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Footer with badges and meta */}
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2" onClick={(e) => e.stopPropagation()}>
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
                  <Badge variant="outline" className={cn("text-[10px] md:text-xs", importanceColor)}>
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
            className="text-[10px] md:text-xs gap-1"
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

          {/* Indicador de tarea recurrente */}
          {task.recurrence && (
            <RecurrenceBadge recurrence={task.recurrence} compact />
          )}

          {/* Fecha límite - en móvil siempre visible (solo icono), en desktop hover si vacío */}
          {!task.completed && onDueDateChange && (
            <div className={cn(
              hasDueDate ? "opacity-100" : "md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            )}>
              <DatePicker
                value={task.dueDate}
                onChange={(date) => onDueDateChange(task.id, date)}
                compact
                showTime
                iconOnly
                externalOpen={datePickerOpen}
                onExternalOpenChange={setDatePickerOpen}
              />
            </div>
          )}

          {/* Asignados - en móvil solo si hay asignados, en desktop hover si vacío */}
          {!task.completed && onAssigneesChange && (
            <div className={cn(
              hasAssignees ? "opacity-100" : "hidden md:block md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            )}>
              <TaskAssignees
                taskId={task.id}
                workspaceId={workspaceId}
                assignees={task.assignees || []}
                onAssigneesChange={(assignees) => onAssigneesChange(task.id, assignees)}
                compact
                externalOpen={assigneesOpen}
                onExternalOpenChange={setAssigneesOpen}
              />
            </div>
          )}
        </div>

        {/* Subtareas */}
        {!task.completed && onSubtasksChange && (
          <div onClick={(e) => e.stopPropagation()}>
            <SubtaskList
              taskId={task.id}
              subtasks={task.subtasks || []}
              onSubtasksChange={(subtasks) => onSubtasksChange(task.id, subtasks)}
            />
          </div>
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
      <div className="flex flex-col items-end justify-between self-stretch" onClick={(e) => e.stopPropagation()}>
        {/* Action buttons */}
        <div className="flex items-start gap-1">
        {/* Botón restaurar si está completada - solo desktop */}
        {task.completed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(task);
                  }}
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

        {/* Botón generar subtareas con IA - solo desktop */}
        {!task.completed && onSubtasksChange && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:text-ta-light hover:bg-ta/10"
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

        {/* Botón eliminar directo para vista de completadas - solo desktop */}
        {onQuickDelete && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
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

        {/* Dropdown menu - en móvil siempre visible, en desktop solo en hover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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
                  Generar prompt IDE
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={handleNavigateToTask}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver detalles
            </DropdownMenuItem>
            {/* Asignar - visible solo en móvil */}
            {!task.completed && onAssigneesChange && (
              <DropdownMenuItem
                onClick={() => setTimeout(() => setAssigneesOpen(true), 100)}
                className="md:hidden"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Asignar
              </DropdownMenuItem>
            )}
            {/* Fecha - visible solo en móvil */}
            {!task.completed && onDueDateChange && (
              <DropdownMenuItem
                onClick={() => setTimeout(() => setDatePickerOpen(true), 100)}
                className="md:hidden"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Fecha límite
              </DropdownMenuItem>
            )}
            {/* Generar subtareas - visible en dropdown en móvil */}
            {!task.completed && onSubtasksChange && (
              <DropdownMenuItem
                onClick={handleGenerateSubtasks}
                disabled={isGeneratingSubtasks}
                className="md:hidden"
              >
                {isGeneratingSubtasks ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ListChecks className="mr-2 h-4 w-4" />
                )}
                Generar subtareas
              </DropdownMenuItem>
            )}
            {/* Completar/Restaurar - visible en dropdown en móvil */}
            <DropdownMenuItem
              onClick={() => onToggleComplete(task)}
              className="md:hidden"
            >
              {task.completed ? (
                <RotateCcw className="mr-2 h-4 w-4" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {task.completed ? "Restaurar" : "Completar"}
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
              onClick={() => (onQuickDelete ? onQuickDelete(task) : onDelete(task))}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>

        {/* TimeAgo - bottom right */}
        <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}
