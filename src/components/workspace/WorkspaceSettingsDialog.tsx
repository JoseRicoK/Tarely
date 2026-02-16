"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Repeat,
  Calendar,
  Clock,
  Loader2,
  Trash2,
  Pencil,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, RecurrenceRule } from "@/lib/types";
import { getRecurrenceLabel } from "@/lib/recurrence";
import { RecurrenceSelector } from "@/components/tasks/RecurrenceSelector";

type SettingsSection = "recurrence";

const SETTINGS_SECTIONS: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: "recurrence", label: "Tareas recurrentes", icon: <Repeat className="h-4 w-4" /> },
];

interface WorkspaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  tasks: Task[];
  onRemoveRecurrence: (taskId: string) => Promise<void> | void;
  onUpdateRecurrence: (taskId: string, rule: RecurrenceRule | null) => Promise<void> | void;
}

export function WorkspaceSettingsDialog({
  open,
  onOpenChange,
  tasks,
  onRemoveRecurrence,
  onUpdateRecurrence,
}: WorkspaceSettingsDialogProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("recurrence");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-5xl w-[95vw] h-[88vh] max-h-[880px] !p-0 !gap-0 overflow-hidden grid-rows-[auto_1fr]"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b self-start h-auto min-h-0">
          <div>
            <DialogHeader className="gap-0 text-left pl-0 md:pl-6">
              <DialogTitle className="flex items-center gap-2 text-base md:text-lg pl-0 md:pl-2">
                <Settings className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                Ajustes del workspace
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Configura las opciones de tu workspace
              </DialogDescription>
            </DialogHeader>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:h-8 md:w-8 shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content: sidebar + main */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <nav className="w-52 border-r bg-muted/30 p-3 hidden sm:block">
            <ul className="space-y-1">
              {SETTINGS_SECTIONS.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left",
                      activeSection === section.id
                        ? "bg-background shadow-sm font-medium text-foreground"
                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile section switcher */}
          <div className="sm:hidden border-b px-4 py-2 flex gap-2 overflow-x-auto shrink-0 w-full absolute top-[85px] bg-background z-10">
            {SETTINGS_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors",
                  activeSection === section.id
                    ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 pt-0">
            {activeSection === "recurrence" && (
              <RecurrenceSettingsSection
                tasks={tasks}
                onRemoveRecurrence={onRemoveRecurrence}
                onUpdateRecurrence={onUpdateRecurrence}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============= Sección de Tareas Recurrentes =============

function RecurrenceSettingsSection({
  tasks,
  onRemoveRecurrence,
  onUpdateRecurrence,
}: {
  tasks: Task[];
  onRemoveRecurrence: (taskId: string) => Promise<void> | void;
  onUpdateRecurrence: (taskId: string, rule: RecurrenceRule | null) => Promise<void> | void;
}) {
  const recurringTasks = tasks.filter((t) => !!t.recurrence);

  const now = new Date();
  const activeTasks = recurringTasks.filter((t) => {
    if (!t.nextDueAt) return true;
    return new Date(t.nextDueAt) <= now;
  });
  const scheduledTasks = recurringTasks.filter((t) => {
    if (!t.nextDueAt) return false;
    return new Date(t.nextDueAt) > now;
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-6">
        {/* Header de la sección */}
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Repeat className="h-4 w-4 text-violet-500" />
            Tareas recurrentes
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las tareas que se repiten automáticamente. Las tareas programadas
            aparecerán cuando llegue su fecha.
          </p>
        </div>

        <Separator />

        {recurringTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-violet-500/10 p-4 mb-4">
              <Repeat className="h-8 w-8 text-violet-500/40" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              No hay tareas recurrentes
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1 max-w-xs">
              Puedes añadir recurrencia a cualquier tarea desde su panel de edición o al crearla
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Activas */}
            {activeTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <h4 className="text-sm font-medium">
                    Activas ahora
                  </h4>
                  <span className="text-xs text-muted-foreground">({activeTasks.length})</span>
                </div>
                <div className="space-y-2">
                  {activeTasks.map((task) => (
                    <RecurringTaskSettingsItem
                      key={task.id}
                      task={task}
                      status="active"
                      onRemoveRecurrence={onRemoveRecurrence}
                      onUpdateRecurrence={onUpdateRecurrence}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTasks.length > 0 && scheduledTasks.length > 0 && (
              <Separator />
            )}

            {/* Programadas */}
            {scheduledTasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-violet-500" />
                  <h4 className="text-sm font-medium">
                    Programadas
                  </h4>
                  <span className="text-xs text-muted-foreground">({scheduledTasks.length})</span>
                </div>
                <div className="space-y-2">
                  {scheduledTasks
                    .sort((a, b) => {
                      const dateA = a.nextDueAt ? new Date(a.nextDueAt).getTime() : 0;
                      const dateB = b.nextDueAt ? new Date(b.nextDueAt).getTime() : 0;
                      return dateA - dateB;
                    })
                    .map((task) => (
                      <RecurringTaskSettingsItem
                        key={task.id}
                        task={task}
                        status="scheduled"
                        onRemoveRecurrence={onRemoveRecurrence}
                        onUpdateRecurrence={onUpdateRecurrence}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ============= Item de tarea recurrente con edición =============

function RecurringTaskSettingsItem({
  task,
  status,
  onRemoveRecurrence,
  onUpdateRecurrence,
}: {
  task: Task;
  status: "active" | "scheduled";
  onRemoveRecurrence: (taskId: string) => Promise<void> | void;
  onUpdateRecurrence: (taskId: string, rule: RecurrenceRule | null) => Promise<void> | void;
}) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleRemove = useCallback(async () => {
    setIsRemoving(true);
    try {
      await onRemoveRecurrence(task.id);
    } finally {
      setIsRemoving(false);
    }
  }, [onRemoveRecurrence, task.id]);

  const handleRecurrenceChange = useCallback(
    async (rule: RecurrenceRule | null) => {
      await onUpdateRecurrence(task.id, rule);
      setIsEditing(false);
    },
    [onUpdateRecurrence, task.id]
  );

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        status === "active"
          ? "bg-card hover:bg-muted/30"
          : "bg-muted/20 hover:bg-muted/40 opacity-90"
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <Repeat
          className={cn(
            "h-4 w-4 mt-0.5 shrink-0",
            status === "active" ? "text-violet-500" : "text-muted-foreground"
          )}
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-medium truncate">{task.title}</p>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Regla de recurrencia */}
            <Badge
              variant="outline"
              className="text-[10px] md:text-xs gap-1 border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400"
            >
              <Repeat className="h-3 w-3" />
              {task.recurrence && getRecurrenceLabel(task.recurrence)}
            </Badge>

            {/* Fecha límite */}
            {task.dueDate && (
              <Badge variant="outline" className="text-[10px] md:text-xs gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), "d MMM", { locale: es })}
              </Badge>
            )}

            {/* Próxima aparición */}
            {task.nextDueAt && status === "scheduled" && (
              <Badge
                variant="outline"
                className="text-[10px] md:text-xs gap-1 border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
              >
                <Clock className="h-3 w-3" />
                {format(new Date(task.nextDueAt), "d MMM yyyy", { locale: es })}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-violet-600"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar recurrencia</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={handleRemove}
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Quitar recurrencia</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Inline editor */}
      {isEditing && (
        <div className="px-3 pb-3 pt-0">
          <Separator className="mb-3" />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Modificar recurrencia:</p>
            <RecurrenceSelector
              value={task.recurrence || null}
              onChange={handleRecurrenceChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
