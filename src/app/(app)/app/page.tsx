"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderPlus, AlertTriangle, Circle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, isValid, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";
import {
  WorkspaceCard,
  WorkspaceDialog,
  WorkspaceGridSkeleton,
  OnboardingCarousel,
} from "@/components/workspace";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { cn } from "@/lib/utils";
import type { Workspace, Task } from "@/lib/types";

interface OverdueTask extends Task {
  workspaceName: string;
  workspaceId: string;
}

interface WorkspaceData {
  workspace: Workspace;
  sections: any[];
  tasks: Task[];
}

export default function AppHomePage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Cachear secciones para evitar múltiples llamadas
  const [sectionsCache, setSectionsCache] = useState<Map<string, any[]>>(new Map());

  // Verificar si es primera vez (desde Supabase)
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const res = await fetch('/api/users?profile=me');
        if (res.ok) {
          const profile = await res.json();
          if (!profile.has_seen_onboarding) {
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    checkOnboarding();
  }, []);

  const handleOnboardingComplete = useCallback(async () => {
    try {
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ has_seen_onboarding: true }),
      });
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error updating onboarding status:', error);
      setShowOnboarding(false);
    }
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces");
      if (!res.ok) {
        if (res.status !== 404) {
          throw new Error("Error al cargar workspaces");
        }
        setWorkspaces([]);
        return { workspaces: [], allTasks: [] };
      }
      const data = await res.json();
      const workspaceList = data || [];
      
      // Cargar TODAS las secciones y tareas en paralelo para TODOS los workspaces
      const workspaceDataPromises = workspaceList.map(async (ws: Workspace) => {
        const [sectionsRes, tasksRes] = await Promise.all([
          fetch(`/api/sections?workspaceId=${ws.id}`),
          fetch(`/api/tasks?workspaceId=${ws.id}`)
        ]);
        
        let sections: any[] = [];
        let tasks: Task[] = [];
        
        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json();
          sections = Array.isArray(sectionsData) ? sectionsData : (sectionsData.sections || []);
        }
        
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          tasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || []);
        }
        
        return { workspace: ws, sections, tasks };
      });
      
      const allWorkspaceData: WorkspaceData[] = await Promise.all(workspaceDataPromises);
      
      // Actualizar cache de secciones
      const newSectionsCache = new Map<string, any[]>();
      allWorkspaceData.forEach(({ workspace, sections }) => {
        newSectionsCache.set(workspace.id, sections);
      });
      setSectionsCache(newSectionsCache);
      
      // Procesar workspaces con contadores
      const workspacesWithCounts = allWorkspaceData.map(({ workspace, sections, tasks }) => {
        const pendingSection = sections.find((s: any) => s.name === 'Pendientes');
        const pendingSectionId = pendingSection?.id;
        
        const pendingCount = tasks.filter((task: Task) => {
          if (task.sectionId) {
            return task.sectionId === pendingSectionId;
          }
          return !task.completed;
        }).length;
        
        return { ...workspace, pendingTasksCount: pendingCount };
      });
      
      // Recopilar todas las tareas para procesarlas de una vez
      const allTasks = allWorkspaceData.flatMap(({ workspace, tasks }) => 
        tasks.map(task => ({ ...task, workspaceName: workspace.name, workspaceId: workspace.id }))
      );
      
      setWorkspaces(workspacesWithCounts);
      return { workspaces: workspacesWithCounts, allTasks };
    } catch {
      setWorkspaces([]);
      return { workspaces: [], allTasks: [] };
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const { allTasks } = await fetchWorkspaces();
      
      // Filtrar tareas vencidas de todas las tareas ya cargadas
      const overdue = allTasks
        .filter((task: any) => {
          if (!task.dueDate || task.completed) return false;
          try {
            const date = parseISO(task.dueDate);
            return isValid(date) && isPast(date) && !isToday(date);
          } catch {
            return false;
          }
        })
        .sort((a: any, b: any) => {
          const dateA = a.dueDate ? parseISO(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? parseISO(b.dueDate).getTime() : 0;
          return dateA - dateB;
        });
      
      setOverdueTasks(overdue);
      setIsLoading(false);
    }
    loadData();
  }, [fetchWorkspaces]);

  const handleToggleComplete = async (task: OverdueTask) => {
    try {
      // Usar cache de secciones si está disponible
      let completedSectionId = null;
      const cachedSections = sectionsCache.get(task.workspaceId);
      
      if (cachedSections) {
        const completedSection = cachedSections.find((s: any) => s.name === 'Completadas');
        completedSectionId = completedSection?.id;
      } else {
        // Si no está en cache, hacer la llamada
        const sectionsRes = await fetch(`/api/sections?workspaceId=${task.workspaceId}`);
        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json();
          const sections = Array.isArray(sectionsData) ? sectionsData : (sectionsData.sections || []);
          const completedSection = sections.find((s: any) => s.name === 'Completadas');
          completedSectionId = completedSection?.id;
          
          // Actualizar cache
          setSectionsCache(prev => new Map(prev).set(task.workspaceId, sections));
        }
      }
      
      // Actualizar tarea como completada y moverla a la sección correspondiente
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: true,
          workspaceId: task.workspaceId,
          ...(completedSectionId && { sectionId: completedSectionId }),
        }),
      });
      
      if (!res.ok) throw new Error("Error al actualizar tarea");
      
      // Remover de la lista local
      setOverdueTasks(prev => prev.filter(t => t.id !== task.id));
      
      // Actualizar contador de tareas pendientes del workspace
      await fetchWorkspaces();
      
      toast.success("Tarea completada");
    } catch {
      toast.error("Error al completar la tarea");
    }
  };

  const handleCreate = () => {
    setDialogMode("create");
    setEditingWorkspace(null);
    setDialogOpen(true);
  };

  const handleEdit = (workspace: Workspace) => {
    setDialogMode("edit");
    setEditingWorkspace(workspace);
    setDialogOpen(true);
  };

  const handleDelete = (workspace: Workspace) => {
    setDeletingWorkspace(workspace);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (data: {
    name: string;
    description: string;
    instructions: string;
    icon?: string;
    color?: string;
  }) => {
    try {
      if (dialogMode === "create") {
        const res = await fetch("/api/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Error al crear workspace");
        toast.success("Workspace creado correctamente");
      } else if (editingWorkspace) {
        const res = await fetch(`/api/workspaces/${editingWorkspace.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Error al actualizar workspace");
        toast.success("Workspace actualizado correctamente");
      }
      setDialogOpen(false);
      // Recargar datos
      await fetchWorkspaces();
    } catch {
      toast.error(
        dialogMode === "create"
          ? "Error al crear el workspace"
          : "Error al actualizar el workspace"
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingWorkspace) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${deletingWorkspace.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar workspace");
      toast.success("Workspace eliminado correctamente");
      setDeleteDialogOpen(false);
      fetchWorkspaces();
    } catch {
      toast.error("Error al eliminar el workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Onboarding carousel */}
      {showOnboarding && <OnboardingCarousel onComplete={handleOnboardingComplete} />}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground mt-1">
            Organiza tus proyectos y genera tareas con IA
          </p>
        </div>
        <Button onClick={handleCreate} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nuevo Workspace
        </Button>
      </div>

      {isLoading ? (
        <WorkspaceGridSkeleton />
      ) : workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <FolderPlus className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No hay workspaces</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Crea tu primer workspace para empezar a organizar tus tareas y
            generar nuevas ideas con ayuda de la IA.
          </p>
          <Button onClick={handleCreate} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Crear mi primer workspace
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Separador visual */}
      {!isLoading && workspaces.length > 0 && overdueTasks.length > 0 && (
        <div className="py-2" />
      )}

      {/* Sección de tareas vencidas */}
      {!isLoading && overdueTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Tareas vencidas</h2>
              <p className="text-sm text-muted-foreground">
                {overdueTasks.length} {overdueTasks.length === 1 ? "tarea pendiente" : "tareas pendientes"} con fecha límite pasada
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overdueTasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="group p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/workspace/${task.workspaceId}`)}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleComplete(task);
                    }}
                    className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
                  >
                    <Circle className="h-5 w-5 text-red-500 hover:text-green-500 transition-colors" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{task.title}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {task.workspaceName}
                      </Badge>
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
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Venció {format(parseISO(task.dueDate), "d 'de' MMMM", { locale: es })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {overdueTasks.length > 6 && (
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => router.push('/calendario')}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Ver todas las tareas ({overdueTasks.length})
              </Button>
            </div>
          )}
        </div>
      )}

      <WorkspaceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        mode={dialogMode}
        initialData={
          editingWorkspace
            ? {
                name: editingWorkspace.name,
                description: editingWorkspace.description,
                instructions: editingWorkspace.instructions,
                icon: editingWorkspace.icon || "Folder",
                color: editingWorkspace.color || "#6366f1",
              }
            : undefined
        }
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="⚠️ ¿Eliminar workspace permanentemente?"
        description={`Estás a punto de eliminar el workspace "${deletingWorkspace?.name}".

Se eliminarán permanentemente:
• Todas las tareas del workspace
• Todas las secciones personalizadas
• Todos los comentarios y subtareas
• Todas las configuraciones e instrucciones

⚠️ Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
