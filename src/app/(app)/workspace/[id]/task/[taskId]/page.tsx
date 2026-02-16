"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  Flag,
  History,
  Loader2,
  ListChecks,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Plus,
  Repeat,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { ImportancePicker } from "@/components/ui/importance-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  CommentSection,
  AttachmentSection,
  ActivitySection,
  SubtaskList,
  TaskAssignees,
  RecurrenceSelector,
  RecurrenceBadge,
} from "@/components/tasks";
import { useUser } from "@/components/auth/UserContext";
import type { Task, Workspace, WorkspaceSection, Subtask, TaskAssignee, RecurrenceRule } from "@/lib/types";
import { cn, getAvatarUrl } from "@/lib/utils";
import { getRecurrenceLabel, calculateNextOccurrence } from "@/lib/recurrence";

// Colores de importancia
const importanceConfig: Record<number, { bg: string; text: string; border: string; label: string }> = {
  1: { bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-600 dark:text-slate-400", border: "border-slate-300 dark:border-slate-700", label: "Mínima" },
  2: { bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-600 dark:text-slate-400", border: "border-slate-300 dark:border-slate-700", label: "Muy baja" },
  3: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-300 dark:border-blue-800", label: "Baja" },
  4: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-300 dark:border-blue-800", label: "Normal-baja" },
  5: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", border: "border-green-300 dark:border-green-800", label: "Normal" },
  6: { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-300 dark:border-yellow-800", label: "Normal-alta" },
  7: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400", border: "border-orange-300 dark:border-orange-800", label: "Alta" },
  8: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400", border: "border-orange-300 dark:border-orange-800", label: "Muy alta" },
  9: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", border: "border-red-300 dark:border-red-800", label: "Crítica" },
  10: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", border: "border-red-300 dark:border-red-800", label: "Urgente" },
};

function getImportanceBarColor(importance: number): string {
  if (importance >= 9) return "bg-red-500";
  if (importance >= 7) return "bg-orange-500";
  if (importance >= 5) return "bg-yellow-500";
  if (importance >= 3) return "bg-blue-500";
  return "bg-slate-400";
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useUser();
  
  const workspaceId = params.id as string;
  const taskId = params.taskId as string;

  const [task, setTask] = useState<Task | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [sections, setSections] = useState<WorkspaceSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados de edición inline
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(true);

  // Cargar datos
  const loadData = useCallback(async () => {
    try {
      const [wsRes, taskRes, sectionsRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}`),
        fetch(`/api/tasks/${taskId}`),
        fetch(`/api/sections?workspaceId=${workspaceId}`),
      ]);

      if (!wsRes.ok) throw new Error("Error cargando workspace");
      if (!taskRes.ok) throw new Error("Error cargando tarea");

      const wsData = await wsRes.json();
      const taskData = await taskRes.json();
      const sectionsData = sectionsRes.ok ? await sectionsRes.json() : [];

      setWorkspace(wsData);
      setTask(taskData);
      setSections(sectionsData);
      setEditTitle(taskData.title);
      setEditDescription(taskData.description || "");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error cargando datos");
      router.push(`/workspace/${workspaceId}`);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, taskId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Guardar título
  const saveTitle = async () => {
    if (!task || !editTitle.trim()) return;
    if (editTitle.trim() === task.title) {
      setIsEditingTitle(false);
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      if (!res.ok) throw new Error("Error guardando título");

      setTask((prev) => prev ? { ...prev, title: editTitle.trim(), updatedAt: new Date().toISOString() } : null);
      setIsEditingTitle(false);
      toast.success("Título actualizado");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error guardando título");
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar descripción
  const saveDescription = async () => {
    if (!task) return;
    if (editDescription === (task.description || "")) {
      setIsEditingDescription(false);
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDescription }),
      });

      if (!res.ok) throw new Error("Error guardando descripción");

      setTask((prev) => prev ? { ...prev, description: editDescription, updatedAt: new Date().toISOString() } : null);
      setIsEditingDescription(false);
      toast.success("Descripción actualizada");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error guardando descripción");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle completado
  const toggleComplete = async () => {
    if (!task) return;

    // Si es una tarea recurrente y se está completando, avanzar next_due_at
    if (task.recurrence && !task.completed) {
      try {
        const baseDate = task.nextDueAt || task.dueDate;
        const nextDate = calculateNextOccurrence(baseDate, task.recurrence);
        
        if (nextDate) {
          // Avanzar next_due_at al futuro, la tarea se ocultará automáticamente
          const res = await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nextDueAt: nextDate, completed: false }),
          });

          if (!res.ok) throw new Error("Error actualizando tarea recurrente");

          setTask((prev) => prev ? {
            ...prev,
            nextDueAt: nextDate,
            completed: false,
            completedAt: undefined,
            updatedAt: new Date().toISOString(),
          } : null);
          toast.success("¡Ocurrencia completada! Desaparecerá hasta la próxima fecha.");
          return;
        } else {
          // La recurrencia ha terminado, completar normalmente
          toast.info("La recurrencia ha terminado.");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error actualizando tarea recurrente");
        return;
      }
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (!res.ok) throw new Error("Error actualizando tarea");

      const now = new Date().toISOString();
      setTask((prev) => prev ? {
        ...prev,
        completed: !prev.completed,
        completedAt: !prev.completed ? now : undefined,
        updatedAt: now,
      } : null);
      toast.success(task.completed ? "Tarea restaurada" : "¡Tarea completada!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error actualizando tarea");
    }
  };

  // Actualizar importancia
  const updateImportance = async (importance: number) => {
    if (!task) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importance }),
      });

      if (!res.ok) throw new Error("Error actualizando importancia");

      setTask((prev) => prev ? { ...prev, importance, updatedAt: new Date().toISOString() } : null);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error actualizando importancia");
    }
  };

  // Actualizar fecha límite
  const updateDueDate = async (dueDate: string | null) => {
    if (!task) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate }),
      });

      if (!res.ok) throw new Error("Error actualizando fecha");

      setTask((prev) => prev ? { ...prev, dueDate: dueDate || undefined, updatedAt: new Date().toISOString() } : null);
      toast.success(dueDate ? "Fecha actualizada" : "Fecha eliminada");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error actualizando fecha");
    }
  };

  // Actualizar recurrencia
  const updateRecurrence = async (recurrence: RecurrenceRule | null) => {
    if (!task) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurrence }),
      });

      if (!res.ok) throw new Error("Error actualizando recurrencia");

      setTask((prev) => prev ? { ...prev, recurrence: recurrence || undefined, updatedAt: new Date().toISOString() } : null);
      toast.success(recurrence ? "Recurrencia configurada" : "Recurrencia eliminada");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error actualizando recurrencia");
    }
  };

  // Eliminar tarea
  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando tarea");

      toast.success("Tarea eliminada");
      router.push(`/workspace/${workspaceId}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error eliminando tarea");
    }
  };

  // Actualizar subtasks
  const handleSubtasksChange = (subtasks: Subtask[]) => {
    setTask((prev) => prev ? { ...prev, subtasks, updatedAt: new Date().toISOString() } : null);
  };

  // Actualizar asignados
  const handleAssigneesChange = (assignees: TaskAssignee[]) => {
    setTask((prev) => prev ? { ...prev, assignees } : null);
  };

  // Copiar título al portapapeles
  const copyTitle = () => {
    if (task) {
      navigator.clipboard.writeText(task.title);
      toast.success("Título copiado");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando tarea...</p>
        </div>
      </div>
    );
  }

  if (!task || !workspace) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Tarea no encontrada</h1>
          <p className="text-muted-foreground mb-6">
            La tarea que buscas no existe o no tienes acceso
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const importance = importanceConfig[task.importance] || importanceConfig[5];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Barra de navegación contextual */}
      <div className="flex items-center justify-between mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: workspace.color }}
            />
            <Link
              href={`/workspace/${workspaceId}`}
              className="hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-[200px]"
            >
              {workspace.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-[300px] text-foreground font-medium">
              {task.title}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={task.completed ? "outline" : "default"}
                  size="sm"
                  onClick={toggleComplete}
                  className={cn(
                    "gap-2",
                    task.completed && "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  )}
                >
                  {task.completed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Completada</span>
                    </>
                  ) : (
                    <>
                      <Circle className="h-4 w-4" />
                      <span className="hidden sm:inline">Completar</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                    {task.completed ? "Restaurar tarea" : "Marcar como completada"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={copyTitle}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar título
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(window.location.href, "_blank")}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir en nueva pestaña
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar tarea
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6 rounded-xl bg-card/50 dark:bg-card/30 backdrop-blur-sm border border-border/50 p-6">
            {/* Indicador de importancia */}
            <div
              className={cn(
                "h-1.5 rounded-full w-full transition-all",
                task.completed ? "bg-green-500" : getImportanceBarColor(task.importance)
              )}
            />

            {/* Título editable */}
            <div className="group">
              {isEditingTitle ? (
                <div className="space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-2xl font-bold h-auto py-2 border-primary"
                    placeholder="Título de la tarea"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle();
                      if (e.key === "Escape") {
                        setEditTitle(task.title);
                        setIsEditingTitle(false);
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveTitle} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span className="ml-1">Guardar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditTitle(task.title);
                        setIsEditingTitle(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-1">Cancelar</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-start gap-3 cursor-pointer rounded-lg p-2 -m-2 hover:bg-muted/50 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleComplete();
                    }}
                    className={cn(
                      "mt-1 shrink-0 transition-all",
                      task.completed
                        ? "text-green-500 hover:text-green-600"
                        : "text-muted-foreground hover:text-green-500"
                    )}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-7 w-7" />
                    ) : (
                      <Circle className="h-7 w-7" />
                    )}
                  </button>
                  <h1
                    className={cn(
                      "text-2xl font-bold flex-1",
                      task.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </h1>
                  <Edit3 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
                </div>
              )}
            </div>

            {/* Descripción editable */}
            <div className="group pl-10">
              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="min-h-[120px] resize-none"
                    placeholder="Añade una descripción..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveDescription} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span className="ml-1">Guardar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditDescription(task.description || "");
                        setIsEditingDescription(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-1">Cancelar</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="cursor-pointer rounded-lg p-3 -m-3 hover:bg-muted/50 transition-colors min-h-[60px]"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {task.description ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {task.description}
                    </p>
                  ) : (
                    <p className="text-muted-foreground/60 italic">
                      Haz clic para añadir una descripción...
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Subtareas */}
            <div className="pl-10">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 -ml-2 hover:bg-muted"
                  onClick={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
                >
                  {isSubtasksExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
                <ListChecks className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Subtareas</h3>
                {totalSubtasks > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {completedSubtasks}/{totalSubtasks}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 ml-auto hover:bg-muted"
                  onClick={() => setIsAddingSubtask(true)}
                  title="Añadir subtarea"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {isSubtasksExpanded && (
                <SubtaskList
                  taskId={task.id}
                  subtasks={task.subtasks || []}
                  onSubtasksChange={handleSubtasksChange}
                  hideHeader
                  forceAdding={isAddingSubtask}
                  onAddingChange={setIsAddingSubtask}
                />
              )}
            </div>

            <Separator />

            {/* Tabs: Comentarios, Archivos, Actividad */}
            <div className="pl-10">
              <Tabs defaultValue="comments">
                <TabsList className="w-full justify-start bg-muted/50 border border-border/50 p-1">
                  <TabsTrigger value="comments" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <MessageCircle className="h-4 w-4" />
                    Comentarios
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Paperclip className="h-4 w-4" />
                    Archivos
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <History className="h-4 w-4" />
                    Actividad
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="comments" className="mt-6">
                  {profile && (
                    <CommentSection taskId={task.id} currentUserId={profile.id} />
                  )}
                </TabsContent>
                <TabsContent value="attachments" className="mt-6">
                  {profile && (
                    <AttachmentSection taskId={task.id} currentUserId={profile.id} />
                  )}
                </TabsContent>
                <TabsContent value="activity" className="mt-6">
                  <ActivitySection taskId={task.id} />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar derecha */}
          <div className="space-y-4 lg:mt-0">
            {/* Panel de propiedades */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="p-4 bg-muted/30 border-b">
                <h3 className="font-semibold text-sm">Propiedades</h3>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <Badge
                    variant={task.completed ? "default" : "secondary"}
                    className={cn(
                      "cursor-pointer transition-colors",
                      task.completed
                        ? "bg-green-500 hover:bg-green-600"
                        : "hover:bg-primary/20"
                    )}
                    onClick={toggleComplete}
                  >
                    {task.completed ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Completada</>
                    ) : (
                      <><Circle className="h-3 w-3 mr-1" /> Pendiente</>
                    )}
                  </Badge>
                </div>

                {/* Importancia */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Importancia</span>
                  <ImportancePicker
                    value={task.importance}
                    onChange={updateImportance}
                    compact
                  />
                </div>

                {/* Fecha límite */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fecha límite</span>
                  <DatePicker
                    value={task.dueDate}
                    onChange={updateDueDate}
                    compact
                    showTime
                  />
                </div>

                {/* Origen */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Origen</span>
                  <Badge variant="outline" className="gap-1">
                    {task.source === "ai" ? (
                      <><Sparkles className="h-3 w-3" /> IA</>
                    ) : (
                      <><User className="h-3 w-3" /> Manual</>
                    )}
                  </Badge>
                </div>

                {/* Recurrencia */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recurrencia</span>
                  <RecurrenceSelector
                    value={task.recurrence || null}
                    onChange={updateRecurrence}
                    compact
                  />
                </div>
              </div>
            </div>

            {/* Panel de asignados */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Asignados</h3>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="p-4">
                <TaskAssignees
                  taskId={task.id}
                  workspaceId={workspaceId}
                  assignees={task.assignees || []}
                  onAssigneesChange={handleAssigneesChange}
                />

                {task.assignees && task.assignees.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {task.assignees.map((assignee: TaskAssignee) => {
                      const avatarUrl = getAvatarUrl(assignee.avatar, assignee.userId);

                      return (
                        <div key={assignee.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={avatarUrl} alt={assignee.name} />
                            <AvatarFallback className="text-xs">
                              {assignee.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {assignee.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Asignado {formatDistanceToNow(new Date(assignee.assignedAt), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Panel de fechas */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Fechas</h3>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Creada</span>
                  <span>{format(new Date(task.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Actualizada</span>
                  <span>{formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true, locale: es })}</span>
                </div>

                {task.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fecha límite</span>
                    <span className={cn(isOverdue && "text-destructive font-medium")}>
                      {format(new Date(task.dueDate), "d MMM yyyy", { locale: es })}
                      {isOverdue && " (Vencida)"}
                    </span>
                  </div>
                )}

                {task.completedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Completada</span>
                    <span className="text-green-600">
                      {format(new Date(task.completedAt), "d MMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
