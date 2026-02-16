"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isValid,
} from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Task, Workspace } from "@/lib/types";

interface CalendarTask extends Task {
  workspaceName: string;
  workspaceId: string;
}

function getImportanceColor(importance: number): string {
  if (importance >= 9) return "bg-red-500";
  if (importance >= 7) return "bg-orange-500";
  if (importance >= 5) return "bg-yellow-500";
  if (importance >= 3) return "bg-blue-500";
  return "bg-slate-400";
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Fetch all workspaces and their tasks
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch workspaces
        const wsRes = await fetch("/api/workspaces");
        if (!wsRes.ok) throw new Error("Error loading workspaces");
        const wsData = await wsRes.json();
        // El API devuelve el array directamente, no { workspaces: [...] }
        const workspacesList = Array.isArray(wsData) ? wsData : (wsData.workspaces || []);
        setWorkspaces(workspacesList);

        // Fetch tasks for all workspaces
        const allTasks: CalendarTask[] = [];
        for (const ws of workspacesList) {
          const tasksRes = await fetch(`/api/tasks?workspaceId=${ws.id}`);
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            // El API devuelve el array directamente, no { tasks: [...] }
            const tasksList = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || []);
            const tasksWithWorkspace = tasksList.map((t: Task) => ({
              ...t,
              workspaceName: ws.name,
              workspaceId: ws.id,
            }));
            allTasks.push(...tasksWithWorkspace);
          }
        }
        setTasks(allTasks);
      } catch (error) {
        console.error("Error fetching calendar data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter tasks by workspace
  const filteredTasks = useMemo(() => {
    if (selectedWorkspace === "all") return tasks;
    return tasks.filter((t) => t.workspaceId === selectedWorkspace);
  }, [tasks, selectedWorkspace]);

  // Get tasks with due dates
  const tasksWithDueDate = useMemo(() => {
    return filteredTasks.filter((t) => {
      if (!t.dueDate) return false;
      try {
        const date = parseISO(t.dueDate);
        return isValid(date);
      } catch {
        return false;
      }
    });
  }, [filteredTasks]);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: es });
    const calendarEnd = endOfWeek(monthEnd, { locale: es });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    tasksWithDueDate.forEach((task) => {
      if (!task.dueDate) return;
      const dateKey = format(parseISO(task.dueDate), "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    });
    // Sort tasks by importance
    map.forEach((tasks) => {
      tasks.sort((a, b) => b.importance - a.importance);
    });
    return map;
  }, [tasksWithDueDate]);

  // Get tasks for selected day
  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const dateKey = format(selectedDay, "yyyy-MM-dd");
    return tasksByDate.get(dateKey) || [];
  }, [selectedDay, tasksByDate]);

  // Navigation
  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
  };

  // Toggle task completion
  const handleToggleComplete = useCallback(async (task: CalendarTask, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir navegación al workspace
    
    try {
      // Primero obtenemos las secciones del workspace para saber a cuál mover
      const sectionsRes = await fetch(`/api/sections?workspaceId=${task.workspaceId}`);
      let targetSectionId: string | undefined;
      
      if (sectionsRes.ok) {
        const sections = await sectionsRes.json();
        if (Array.isArray(sections) && sections.length > 0) {
          const newCompleted = !task.completed;
          // Si se va a completar, mover a sección "Completadas"
          // Si se va a descompletar, mover a sección "Pendientes" o la primera
          if (newCompleted) {
            const completedSection = sections.find((s: { name: string; id: string }) => s.name === "Completadas");
            targetSectionId = completedSection?.id;
          } else {
            const pendingSection = sections.find((s: { name: string; id: string }) => s.name === "Pendientes");
            targetSectionId = pendingSection?.id || sections[0]?.id;
          }
        }
      }

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: !task.completed,
          workspaceId: task.workspaceId,
          ...(targetSectionId && { sectionId: targetSectionId }),
        }),
      });
      
      if (!res.ok) throw new Error("Error al actualizar tarea");
      
      // Actualizar estado local
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, completed: !t.completed, sectionId: targetSectionId } : t
      ));
      
      toast.success(task.completed ? "Tarea marcada como pendiente" : "Tarea completada");
    } catch {
      toast.error("Error al actualizar la tarea");
    }
  }, []);

  // Stats
  const stats = useMemo(() => {
    const pending = tasksWithDueDate.filter((t) => !t.completed).length;
    const completed = tasksWithDueDate.filter((t) => t.completed).length;
    const overdue = tasksWithDueDate.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      const date = parseISO(t.dueDate);
      return date < new Date() && !isToday(date);
    }).length;
    return { pending, completed, overdue, total: tasksWithDueDate.length };
  }, [tasksWithDueDate]);

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              Calendario
            </h1>
            <p className="text-sm text-muted-foreground">
              Visualiza tus tareas con fecha límite
            </p>
          </div>
        </div>

        {/* Workspace filter */}
        <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
          <SelectTrigger className="w-[200px] bg-background/60 backdrop-blur-md border border-border/50">
            <SelectValue placeholder="Todos los workspaces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los workspaces</SelectItem>
            {workspaces.map((ws) => (
              <SelectItem key={ws.id} value={ws.id}>
                {ws.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Con fecha</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-500">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">Pendientes</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          <div className="text-sm text-muted-foreground">Completadas</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
          <div className="text-sm text-muted-foreground">Vencidas</div>
        </div>
      </div>

      {/* Calendar and details */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-xl p-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold capitalize">
                {format(currentDate, "MMMM yyyy", { locale: es })}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Hoy
                </Button>
                <Button variant="outline" size="icon" onClick={goToPrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayTasks = tasksByDate.get(dateKey) || [];
                const hasOverdue = dayTasks.some(
                  (t) => !t.completed && day < new Date() && !isToday(day)
                );
                const hasPending = dayTasks.some((t) => !t.completed);
                const allCompleted = dayTasks.length > 0 && dayTasks.every((t) => t.completed);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isCurrentMonth = isSameMonth(day, currentDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "relative aspect-square p-1 rounded-lg text-sm transition-all",
                      "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
                      !isCurrentMonth && "text-muted-foreground/50",
                      isToday(day) && "bg-primary/10 font-bold",
                      isSelected && "ring-2 ring-primary bg-accent",
                      hasOverdue && "bg-red-500/10",
                      allCompleted && "bg-green-500/10"
                    )}
                  >
                    <span className={cn(
                      "absolute top-1 left-1 w-6 h-6 flex items-center justify-center rounded-full",
                      isToday(day) && "bg-primary text-primary-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                    
                    {/* Task indicators - líneas con título */}
                    {dayTasks.length > 0 && (
                      <div className="absolute bottom-0.5 left-0.5 right-0.5 flex flex-col gap-px overflow-hidden">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={cn(
                              "h-[16px] px-1 rounded-sm text-[10px] leading-[16px] font-medium truncate text-white",
                              task.completed
                                ? "bg-green-500/80"
                                : task.importance >= 9 ? "bg-red-500/80"
                                : task.importance >= 7 ? "bg-orange-500/80"
                                : task.importance >= 5 ? "bg-yellow-500/80 text-yellow-950"
                                : task.importance >= 3 ? "bg-blue-500/80"
                                : "bg-slate-400/80"
                            )}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-[8px] text-muted-foreground text-center">
                            +{dayTasks.length - 3} más
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" /> Crítica
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" /> Alta
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" /> Media
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Baja
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" /> Completada
              </div>
            </div>
          </div>
        </div>

        {/* Day details */}
        <div>
          <div className="bg-card border rounded-xl p-6 sticky top-20">
            <h3 className="font-semibold mb-4">
              {selectedDay
                ? format(selectedDay, "EEEE, d MMMM", { locale: es })
                : "Selecciona un día"}
            </h3>

            {selectedDay ? (
              selectedDayTasks.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {selectedDayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "p-3 rounded-lg border bg-background/50 cursor-pointer hover:bg-accent/50 transition-colors",
                          task.completed && "opacity-60"
                        )}
                        onClick={() => router.push(`/workspace/${task.workspaceId}`)}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={(e) => handleToggleComplete(task, e)}
                            className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-medium text-sm line-clamp-2",
                              task.completed && "line-through"
                            )}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {task.workspaceName}
                              </Badge>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge
                                      variant="secondary"
                                      className={cn(
                                        "text-xs",
                                        task.importance >= 9 && "bg-red-500/20 text-red-500",
                                        task.importance >= 7 && task.importance < 9 && "bg-orange-500/20 text-orange-500",
                                        task.importance >= 5 && task.importance < 7 && "bg-yellow-500/20 text-yellow-600",
                                        task.importance >= 3 && task.importance < 5 && "bg-blue-500/20 text-blue-500",
                                        task.importance < 3 && "bg-slate-400/20 text-slate-500"
                                      )}
                                    >
                                      {task.importance}/10
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Importancia: {task.importance}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            {task.dueDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(parseISO(task.dueDate), "HH:mm")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay tareas para este día</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Haz clic en un día para ver sus tareas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
