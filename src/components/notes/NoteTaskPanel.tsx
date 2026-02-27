"use client";

import {
  CheckCircle2,
  Trash2,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImportancePicker } from "@/components/ui/importance-picker";
import { cn } from "@/lib/utils";

interface NoteTaskPanelProps {
  taskId: string; // Only rendered when a real task is linked
  completed: boolean;
  taskTitle?: string | null;
  taskDescription?: string | null;
  taskImportance?: number | null;
  taskDueDate?: string | null;
  onDeleteTask: () => void;
  onToggleComplete: () => void;
  onUpdateImportance?: (importance: number) => Promise<void>;
  onDueDateChange?: (dueDate: string | null) => Promise<void>;
  onNavigateToTask?: () => void;
}

function getBarColor(completed: boolean, importance: number): string {
  if (completed) return "bg-green-500";
  if (importance >= 9) return "bg-red-500";
  if (importance >= 7) return "bg-orange-500";
  if (importance >= 5) return "bg-yellow-500";
  if (importance >= 3) return "bg-blue-500";
  return "bg-slate-400";
}

export function NoteTaskPanel({
  completed,
  taskTitle,
  taskDescription,
  taskImportance,
  taskDueDate,
  onDeleteTask,
  onToggleComplete,
  onUpdateImportance,
  onDueDateChange,
  onNavigateToTask,
}: NoteTaskPanelProps) {
  const importance = taskImportance ?? 5;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all duration-300",
        completed
          ? "border-green-500/25 bg-green-500/5"
          : "border-border/60 bg-card"
      )}
    >
      {/* Priority bar on the left — identical to KanbanCard */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
          getBarColor(completed, importance)
        )}
      />

      <div className="flex items-start gap-3 pl-5 pr-3 py-3">
        {/* Completion toggle */}
        <button
          onClick={onToggleComplete}
          className={cn(
            "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
            completed
              ? "border-green-500 bg-green-500 text-white hover:bg-green-600 hover:border-green-600"
              : "border-muted-foreground/30 hover:border-primary/60 hover:bg-primary/8"
          )}
          title={completed ? "Marcar como pendiente" : "Marcar como completada"}
        >
          {completed && <CheckCircle2 className="h-3 w-3" strokeWidth={3} />}
        </button>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <span
            className={cn(
              "text-sm font-semibold leading-tight block",
              completed ? "line-through text-muted-foreground/50" : "text-foreground"
            )}
          >
            {taskTitle || "Tarea vinculada"}
          </span>

          {/* AI description */}
          {taskDescription && (
            <p className="mt-0.5 text-xs text-muted-foreground/70 leading-snug line-clamp-2">
              {taskDescription}
            </p>
          )}

          {/* Meta row: importance + due date */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {onUpdateImportance && (
              <ImportancePicker
                value={importance}
                onChange={onUpdateImportance}
                compact
              />
            )}
            {onDueDateChange && (
              <DatePicker
                value={taskDueDate ?? undefined}
                onChange={onDueDateChange}
                compact
                disabled={completed}
              />
            )}
            {completed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Completada
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent transition-all duration-150 outline-none"
              title="Opciones de tarea"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onToggleComplete} className="cursor-pointer">
              {completed ? (
                <><CheckCircle2 className="mr-2 h-4 w-4 opacity-50" />Marcar como pendiente</>
              ) : (
                <><CheckCircle2 className="mr-2 h-4 w-4" />Marcar como completada</>
              )}
            </DropdownMenuItem>
            {onNavigateToTask && (
              <DropdownMenuItem onClick={onNavigateToTask} className="cursor-pointer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver en workspace
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDeleteTask}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Eliminar tarea
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
