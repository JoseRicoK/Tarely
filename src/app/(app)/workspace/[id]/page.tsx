"use client";

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  FileText,
  Loader2,
  ListTodo,
  Share2,
  LayoutGrid,
  List,
  Eye,
  CheckCircle2,
  Folder,
  Star,
  Heart,
  Flag,
  Bookmark,
  Tag,
  Calendar,
  Clock,
  AlertCircle,
  Zap,
  Target,
  Trophy,
  Rocket,
  Code,
  Bug,
  Wrench,
  Settings,
  Users,
  MessageCircle,
  Mail,
  Phone,
  Home,
  Briefcase,
  ShoppingCart,
  CreditCard,
  DollarSign,
  PieChart,
  BarChart,
  Activity,
  Layers,
  Archive,
  MoreHorizontal,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  TaskCard,
  TaskListSkeleton,
  TaskFilters,
  type SortField,
  type SortOrder,
} from "@/components/tasks";
import { DeleteDialog } from "@/components/ui/delete-dialog";

// Lazy load de componentes pesados que no se usan en el render inicial
const TaskDialog = lazy(() => import("@/components/tasks").then(m => ({ default: m.TaskDialog })));
const PromptDialog = lazy(() => import("@/components/tasks").then(m => ({ default: m.PromptDialog })));
const KanbanBoard = lazy(() => import("@/components/tasks").then(m => ({ default: m.KanbanBoard })));
const InstructionsSheet = lazy(() => import("@/components/workspace").then(m => ({ default: m.InstructionsSheet })));
const ShareDialog = lazy(() => import("@/components/workspace").then(m => ({ default: m.ShareDialog })));
const SectionDialog = lazy(() => import("@/components/workspace").then(m => ({ default: m.SectionDialog })));
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Workspace, Task, TaskAssignee, WorkspaceSection, Subtask } from "@/lib/types";
import { cn } from "@/lib/utils";

// Map of icon names to components
const iconMap: Record<string, LucideIcon> = {
  "list-todo": ListTodo,
  "eye": Eye,
  "check-circle-2": CheckCircle2,
  "folder": Folder,
  "star": Star,
  "heart": Heart,
  "flag": Flag,
  "bookmark": Bookmark,
  "tag": Tag,
  "calendar": Calendar,
  "clock": Clock,
  "alert-circle": AlertCircle,
  "zap": Zap,
  "target": Target,
  "trophy": Trophy,
  "rocket": Rocket,
  "code": Code,
  "file-text": FileText,
  "bug": Bug,
  "wrench": Wrench,
  "settings": Settings,
  "users": Users,
  "message-circle": MessageCircle,
  "mail": Mail,
  "phone": Phone,
  "home": Home,
  "briefcase": Briefcase,
  "shopping-cart": ShoppingCart,
  "credit-card": CreditCard,
  "dollar-sign": DollarSign,
  "pie-chart": PieChart,
  "bar-chart": BarChart,
  "activity": Activity,
  "layers": Layers,
  "archive": Archive,
};

function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || Folder;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  // State
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sections, setSections] = useState<WorkspaceSection[]>([]);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingSections, setIsLoadingSections] = useState(true);

  // AI Generation state
  const [aiText, setAiText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Dialogs state
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogMode, setTaskDialogMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [promptTaskTitle, setPromptTaskTitle] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<WorkspaceSection | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("importance");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  // Fetch all data in parallel - Mucho más rápido
  const fetchAllData = useCallback(async () => {
    try {
      // Ejecutar las 3 llamadas en paralelo en lugar de secuencialmente
      const [workspaceRes, tasksRes, sectionsRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}`),
        fetch(`/api/tasks?workspaceId=${workspaceId}`),
        fetch(`/api/sections?workspaceId=${workspaceId}`),
      ]);

      // Workspace
      if (!workspaceRes.ok) {
        if (workspaceRes.status === 404) {
          toast.error("Workspace no encontrado");
          router.push("/app");
          return;
        }
        throw new Error("Error al cargar workspace");
      }
      const workspaceData = await workspaceRes.json();
      setWorkspace(workspaceData);
      setIsLoadingWorkspace(false);

      // Tasks
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        
        // Verificar si las tareas "nuevas" aún son válidas
        const storedData = sessionStorage.getItem('newTasksData');
        let newTaskIds: string[] = [];
        
        if (storedData) {
          const { tasks, timestamp } = JSON.parse(storedData);
          const elapsed = Date.now() - timestamp;
          
          if (elapsed > 20000) {
            sessionStorage.removeItem('newTasksData');
          } else {
            newTaskIds = tasks;
          }
        }
        
        const tasksWithNewFlag = tasksData.map((task: Task) => ({
          ...task,
          isNew: newTaskIds.includes(task.id)
        }));
        
        setTasks(tasksWithNewFlag);
      }
      setIsLoadingTasks(false);

      // Sections
      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        setSections(sectionsData);
        // Set first section as active if none selected
        if (sectionsData.length > 0 && !activeSectionId) {
          setActiveSectionId(sectionsData[0].id);
        }
      }
      setIsLoadingSections(false);
    } catch (error) {
      toast.error("Error al cargar los datos");
      setIsLoadingWorkspace(false);
      setIsLoadingTasks(false);
      setIsLoadingSections(false);
    }
  }, [workspaceId, router, activeSectionId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by section (using helper that handles legacy flags)
    if (activeSectionId) {
      result = result.filter((t) => getTaskSection(t) === activeSectionId);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
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
  }, [tasks, searchQuery, sortField, sortOrder, activeSectionId, getTaskSection]);

  // Counts for tabs (using helper that handles legacy flags)
  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sections.forEach((section) => {
      counts[section.id] = tasks.filter((t) => getTaskSection(t) === section.id).length;
    });
    return counts;
  }, [tasks, sections, getTaskSection]);

  // Handler for changing task section (drag and drop or menu)
  // Función optimizada para re-fetch de tasks
  const refetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?workspaceId=${workspaceId}`);
      if (!res.ok) return;
      const data = await res.json();
      setTasks(data);
    } catch {
      // Silently fail on refetch
    }
  }, [workspaceId]);

  // Función optimizada para re-fetch de sections
  const refetchSections = useCallback(async () => {
    try {
      const res = await fetch(`/api/sections?workspaceId=${workspaceId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSections(data);
    } catch {
      // Silently fail on refetch
    }
  }, [workspaceId]);

  const handleTaskSectionChange = useCallback(async (taskId: string, sectionId: string) => {
    try {
      // Encontrar la sección de destino para determinar flag de completed
      const targetSection = sections.find(s => s.id === sectionId);
      const sectionName = targetSection?.name || "";
      
      // Determinar el flag según la sección del sistema
      const completed = sectionName === "Completadas";

      // Optimistically update UI
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, sectionId, completed } : t))
      );

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, completed }),
      });

      if (!res.ok) throw new Error("Error al mover tarea");
    } catch {
      // Revert on error
      refetchTasks();
      toast.error("Error al mover la tarea");
    }
  }, [sections, refetchTasks]);

  // Handler for moving task to section (from menu)
  const handleMoveToSection = useCallback(async (task: Task, sectionId: string) => {
    await handleTaskSectionChange(task.id, sectionId);
  }, [handleTaskSectionChange]);

  // Create section handler
  const handleCreateSection = useCallback(async (data: { name: string; icon: string; color: string }) => {
    try {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          ...data,
        }),
      });

      if (!res.ok) throw new Error("Error al crear sección");
      
      const newSection = await res.json();
      setSections((prev) => [...prev, newSection]);
      toast.success("Sección creada");
    } catch {
      toast.error("Error al crear la sección");
    }
  }, [workspaceId]);

  // Edit section handler
  const handleEditSection = useCallback((section: WorkspaceSection) => {
    setEditingSection(section);
    setSectionDialogOpen(true);
  }, []);

  // Update section handler
  const handleUpdateSection = useCallback(async (data: { name: string; icon: string; color: string }) => {
    if (!editingSection) return;
    
    try {
      const res = await fetch(`/api/sections/${editingSection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Error al actualizar sección");
      
      const updatedSection = await res.json();
      setSections((prev) =>
        prev.map((s) => (s.id === updatedSection.id ? updatedSection : s))
      );
      setEditingSection(null);
      toast.success("Sección actualizada");
    } catch {
      toast.error("Error al actualizar la sección");
    }
  }, [editingSection]);

  // Delete section handler
  const handleDeleteSection = useCallback(async (sectionId: string) => {
    try {
      const res = await fetch(`/api/sections/${sectionId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar sección");
      
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      // Si la sección activa era la eliminada, seleccionar la primera
      if (activeSectionId === sectionId) {
        const remaining = sections.filter((s) => s.id !== sectionId);
        setActiveSectionId(remaining[0]?.id || null);
      }
      setEditingSection(null);
      toast.success("Sección eliminada");
    } catch {
      toast.error("Error al eliminar la sección");
    }
  }, [sections, activeSectionId]);

  // Reorder sections handler (for Kanban drag & drop)
  const handleSectionsReorder = useCallback(async (reorderedSections: WorkspaceSection[]) => {
    // Optimistically update UI
    setSections(reorderedSections);

    // Persist the new order to the backend
    try {
      const updates = reorderedSections.map((section, index) => ({
        id: section.id,
        order: index,
      }));

      await fetch("/api/sections/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: updates }),
      });
    } catch {
      // Revert on error
      refetchSections();
      toast.error("Error al reordenar secciones");
    }
  }, [refetchSections]);

  // Handlers
  const handleSaveInstructions = useCallback(async (instructions: string) => {
    if (!workspace) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions }),
      });
      if (!res.ok) throw new Error("Error al guardar instrucciones");
      const updated = await res.json();
      setWorkspace(updated);
      toast.success("Instrucciones guardadas");
    } catch {
      toast.error("Error al guardar las instrucciones");
    }
  }, [workspace, workspaceId]);

  const handleGenerateTasks = useCallback(async () => {
    if (!aiText.trim()) {
      toast.error("Escribe algo para generar tareas");
      return;
    }
    if (aiText.trim().length < 10) {
      toast.error("El texto debe tener al menos 10 caracteres");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          text: aiText,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al generar tareas");
      }

      const data = await res.json();
      
      // Marcar las tareas nuevas en sessionStorage con timestamp
      const newTaskIds = data.tasks.map((t: Task) => t.id);
      const existingData = JSON.parse(sessionStorage.getItem('newTasksData') || '{"tasks": [], "timestamp": 0}');
      const newData = {
        tasks: [...existingData.tasks, ...newTaskIds],
        timestamp: Date.now()
      };
      sessionStorage.setItem('newTasksData', JSON.stringify(newData));
      
      // Auto-limpiar después de 20 segundos
      setTimeout(() => {
        sessionStorage.removeItem('newTasksData');
        refetchTasks(); // Refrescar para quitar el indicador visual
      }, 20000);
      
      toast.success(`${data.count} tareas generadas correctamente`);
      setAiText("");
      refetchTasks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al generar tareas";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [aiText, workspaceId, refetchTasks]);

  const handleCreateTask = useCallback(() => {
    setTaskDialogMode("create");
    setEditingTask(null);
    setTaskDialogOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setTaskDialogMode("edit");
    setEditingTask(task);
    setTaskDialogOpen(true);
  }, []);

  const handleDeleteTask = useCallback((task: Task) => {
    setDeletingTask(task);
    setDeleteDialogOpen(true);
  }, []);

  const handleToggleComplete = useCallback(async (task: Task) => {
    try {
      // Encontrar las secciones de Completadas y Pendientes
      const completedSection = sections.find(s => s.name === "Completadas");
      const pendingSection = sections.find(s => s.name === "Pendientes");
      
      const newCompleted = !task.completed;
      const targetSectionId = newCompleted 
        ? completedSection?.id 
        : pendingSection?.id;

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          completed: newCompleted,
          ...(targetSectionId && { sectionId: targetSectionId })
        }),
      });

      if (!res.ok) {
        throw new Error("Error al actualizar la tarea");
      }

      toast.success(task.completed ? "Tarea restaurada" : "Tarea completada");
      refetchTasks();
    } catch {
      toast.error("Error al actualizar la tarea");
    }
  }, [sections, refetchTasks]);

  const handleQuickDelete = useCallback(async (task: Task) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Error al eliminar la tarea");
      }

      toast.success("Tarea eliminada");
      refetchTasks();
    } catch {
      toast.error("Error al eliminar la tarea");
    }
  }, [refetchTasks]);

  const handleGeneratePrompt = useCallback(async (task: Task) => {
    if (!workspace) return;
    setPromptTaskTitle(task.title);
    setGeneratedPrompt("");
    setIsGeneratingPrompt(true);
    setPromptDialogOpen(true);

    try {
      const res = await fetch("/api/ai/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al generar prompt");
      }

      const data = await res.json();
      setGeneratedPrompt(data.prompt);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al generar prompt";
      toast.error(message);
      setPromptDialogOpen(false);
    } finally {
      setIsGeneratingPrompt(false);
    }
  }, [workspace]);

  const handleTaskSubmit = useCallback(async (data: {
    title: string;
    description?: string;
    importance: number;
    dueDate?: string | null;
  }) => {
    try {
      if (taskDialogMode === "create") {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            workspaceId,
            source: "manual",
          }),
        });
        if (!res.ok) throw new Error("Error al crear tarea");
        toast.success("Tarea creada correctamente");
      } else if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Error al actualizar tarea");
        toast.success("Tarea actualizada correctamente");
      }
      setTaskDialogOpen(false);
      refetchTasks();
    } catch {
      toast.error(
        taskDialogMode === "create"
          ? "Error al crear la tarea"
          : "Error al actualizar la tarea"
      );
    }
  }, [taskDialogMode, editingTask, workspaceId, refetchTasks]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${deletingTask.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar tarea");
      toast.success("Tarea eliminada correctamente");
      setDeleteDialogOpen(false);
      refetchTasks();
    } catch {
      toast.error("Error al eliminar la tarea");
    } finally {
      setIsDeleting(false);
    }
  }, [deletingTask, refetchTasks]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerateTasks();
    }
  }, [handleGenerateTasks]);

  const handleAssigneesChange = useCallback((taskId: string, assignees: TaskAssignee[]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignees } : t))
    );
  }, []);

  const handleDueDateChange = useCallback(async (taskId: string, dueDate: string | null) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, dueDate: dueDate || undefined } : t))
    );

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar la fecha");
      }
    } catch (error) {
      console.error("Error updating due date:", error);
      toast.error("Error al actualizar la fecha");
      // Revert on error
      refetchTasks();
    }
  }, [refetchTasks]);

  const handleImportanceChange = useCallback(async (taskId: string, importance: number) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, importance } : t))
    );

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importance }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar la importancia");
      }
      toast.success("Importancia actualizada");
    } catch (error) {
      console.error("Error updating importance:", error);
      toast.error("Error al actualizar la importancia");
      // Revert on error
      refetchTasks();
    }
  }, [refetchTasks]);

  const handleSubtasksChange = useCallback((taskId: string, subtasks: Subtask[]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, subtasks } : t))
    );
  }, []);

  if (isLoadingWorkspace) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {workspace.name}
            </h1>
            {workspace.description && (
              <p className="text-muted-foreground">{workspace.description}</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShareDialogOpen(true)}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Compartir</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setInstructionsOpen(true)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Instrucciones</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* AI Generation Area */}
      <div className="relative overflow-hidden rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-4 shadow-sm hover:shadow-md transition-shadow">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -z-10" />
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold">Convierte el caos en tareas ordenadas</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Describe lo que necesitas hacer y déjanos organizar todo por ti
              </p>
            </div>
            <Button
              onClick={handleGenerateTasks}
              disabled={isGenerating || !aiText.trim()}
              className="gap-2 shadow-sm shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Organizando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Organizar</span>
                </>
              )}
            </Button>
          </div>
          
          <Textarea
            placeholder="Escribe o pega lo que tienes en mente... Por ejemplo: Tengo varios correos pendientes, un bug urgente y no sé por dónde empezar…"
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={5}
            className="resize-y bg-background/50 border-primary/20 focus:border-primary/40 transition-colors min-h-[120px]"
            disabled={isGenerating}
          />
          
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="hidden sm:inline">💡 Presiona</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Ctrl+Enter</kbd>
            <span>para organizar rápido</span>
          </p>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            <h2 className="font-semibold">Tareas</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="gap-1.5 h-8"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className="gap-1.5 h-8"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
              </Button>
            </div>
            <Button onClick={handleCreateTask} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva tarea
            </Button>
          </div>
        </div>

        {/* Section tabs - Only show in list view */}
        {viewMode === "list" && (
          <ScrollArea className="w-full">
            <div className="flex items-center gap-2 pb-2">
              {sections.map((section) => {
                const IconComponent = getIconComponent(section.icon);
                return (
                  <div
                    key={section.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors whitespace-nowrap group",
                      activeSectionId === section.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <button
                      onClick={() => setActiveSectionId(section.id)}
                      className="flex items-center gap-2"
                    >
                      <IconComponent className="h-4 w-4" style={{ color: section.color }} />
                      <span>{section.name}</span>
                      <Badge variant="secondary" className="ml-1">
                        {sectionCounts[section.id] || 0}
                      </Badge>
                    </button>
                    {/* Section menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                          <span className="sr-only">Opciones de sección</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditSection(section)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar sección
                        </DropdownMenuItem>
                        {!section.isSystem && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteSection(section.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar sección
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
              {/* Add section button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingSection(null);
                  setSectionDialogOpen(true);
                }}
                className="gap-1.5 h-9 px-3 border border-dashed"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Añadir</span>
              </Button>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        <TaskFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={(field, order) => {
            setSortField(field);
            setSortOrder(order);
          }}
        />

        {isLoadingTasks || isLoadingSections ? (
          <TaskListSkeleton />
        ) : viewMode === "kanban" ? (
          /* Kanban View */
          <Suspense fallback={<TaskListSkeleton />}>
            <KanbanBoard
              tasks={tasks}
              sections={sections}
              workspaceId={workspaceId}
              onTaskSectionChange={handleTaskSectionChange}
              onMoveToSection={handleMoveToSection}
              onSectionsReorder={handleSectionsReorder}
              onEditSection={handleEditSection}
              onDeleteSection={(section) => handleDeleteSection(section.id)}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onGeneratePrompt={handleGeneratePrompt}
              onToggleComplete={handleToggleComplete}
              onAssigneesChange={handleAssigneesChange}
              onDueDateChange={handleDueDateChange}
              onImportanceChange={handleImportanceChange}
              onQuickDelete={handleQuickDelete}
              onAddSection={() => {
                setEditingSection(null);
                setSectionDialogOpen(true);
              }}
              searchQuery={searchQuery}
              sortField={sortField}
              sortOrder={sortOrder}
            />
          </Suspense>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
            {!searchQuery && activeSectionId ? (
              <>
                <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No hay tareas en esta sección</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Genera tareas con IA o crea una manualmente para empezar.
                </p>
                <Button onClick={handleCreateTask} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Crear tarea manual
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  No se encontraron tareas que coincidan con &quot;{searchQuery}&quot;
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                workspaceId={workspaceId}
                sections={sections}
                currentSectionId={activeSectionId}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onGeneratePrompt={handleGeneratePrompt}
                onToggleComplete={handleToggleComplete}
                onMoveToSection={handleMoveToSection}
                onAssigneesChange={handleAssigneesChange}
                onDueDateChange={handleDueDateChange}
                onImportanceChange={handleImportanceChange}
                onSubtasksChange={handleSubtasksChange}
                onQuickDelete={handleQuickDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs - Lazy loaded */}
      {instructionsOpen && (
        <Suspense fallback={null}>
          <InstructionsSheet
            open={instructionsOpen}
            onOpenChange={setInstructionsOpen}
            workspace={workspace}
            onSave={handleSaveInstructions}
          />
        </Suspense>
      )}

      {taskDialogOpen && (
        <Suspense fallback={null}>
          <TaskDialog
            open={taskDialogOpen}
            onOpenChange={setTaskDialogOpen}
            onSubmit={handleTaskSubmit}
            mode={taskDialogMode}
            initialData={
              editingTask
                ? {
                    title: editingTask.title,
                    description: editingTask.description,
                    importance: editingTask.importance,
                    dueDate: editingTask.dueDate,
                  }
                : undefined
            }
          />
        </Suspense>
      )}

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar tarea?"
        description={`Esta acción eliminará la tarea "${deletingTask?.title?.substring(0, 50)}${(deletingTask?.title?.length || 0) > 50 ? '...' : ''}". Esta acción no se puede deshacer.`}
      />

      {promptDialogOpen && (
        <Suspense fallback={null}>
          <PromptDialog
            open={promptDialogOpen}
            onOpenChange={setPromptDialogOpen}
            prompt={generatedPrompt}
            taskTitle={promptTaskTitle}
            isLoading={isGeneratingPrompt}
          />
        </Suspense>
      )}

      {shareDialogOpen && (
        <Suspense fallback={null}>
          <ShareDialog
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            workspaceId={workspaceId}
            workspaceName={workspace.name}
          />
        </Suspense>
      )}

      {sectionDialogOpen && (
        <Suspense fallback={null}>
          <SectionDialog
            open={sectionDialogOpen}
            onOpenChange={(open) => {
              setSectionDialogOpen(open);
              if (!open) setEditingSection(null);
            }}
            onSubmit={editingSection ? handleUpdateSection : handleCreateSection}
            section={editingSection ?? undefined}
            onDelete={handleDeleteSection}
          />
        </Suspense>
      )}
    </div>
  );
}
