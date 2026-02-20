"use client";

import {
  CheckCircle2,
  Circle,
  ListTodo,
  Unlink,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NoteTaskPanelProps {
  taskId: string | null;
  completed: boolean;
  onLinkTask: () => void;
  onUnlinkTask: () => void;
  onToggleComplete: () => void;
}

export function NoteTaskPanel({
  taskId,
  completed,
  onLinkTask,
  onUnlinkTask,
  onToggleComplete,
}: NoteTaskPanelProps) {
  // ─── No task linked ──────────────────────────────────────────────────────────
  if (!taskId || taskId === "pending") {
    const isPending = taskId === "pending";
    return (
      <button
        onClick={!isPending ? onLinkTask : undefined}
        disabled={isPending}
        className="group flex items-center gap-2 h-8 px-3.5 rounded-lg border border-border bg-background hover:bg-accent shadow-sm transition-all duration-200 shrink-0 text-foreground/70 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        title="Crear tarea vinculada"
      >
        <ListTodo className="h-4 w-4 shrink-0" />
        <span className="text-xs font-semibold whitespace-nowrap">
          {isPending ? "Creando..." : "Crear tarea"}
        </span>
      </button>
    );
  }

  // ─── Task linked ─────────────────────────────────────────────────────────────
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "group flex items-center gap-2 h-8 px-3.5 rounded-lg border transition-all duration-200 shrink-0 outline-none shadow-sm",
            completed
              ? "border-green-500/40 bg-green-500/12 text-green-600 dark:text-green-400 hover:bg-green-500/20"
              : "border-border bg-background text-foreground/70 hover:bg-accent hover:text-foreground"
          )}
          title={completed ? "Tarea completada" : "Tarea vinculada"}
        >
          {completed ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <Circle className="h-4 w-4 shrink-0" />
          )}
          <span className="text-xs font-semibold whitespace-nowrap">
            {completed ? "Completada" : "Tarea vinculada"}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onToggleComplete} className="cursor-pointer">
          {completed ? (
            <><Circle className="mr-2 h-4 w-4" />Marcar pendiente</>
          ) : (
            <><CheckCircle2 className="mr-2 h-4 w-4" />Completar tarea</>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onUnlinkTask} className="cursor-pointer text-muted-foreground text-xs">
          <Unlink className="mr-2 h-3.5 w-3.5" />
          Desvincular
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
