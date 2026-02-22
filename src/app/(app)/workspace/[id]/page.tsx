"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useTransition, lazy, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceOverview, useTasks, queryKeys } from "@/lib/queries";
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
  Mic,
  Square,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  TaskCard,
  TaskListSkeleton,
  TaskFilters,
  type SortField,
  type SortOrder,
  type TagFilterItem,
} from "@/components/tasks";
import { DeleteDialog } from "@/components/ui/delete-dialog";

// Lazy load de componentes pesados que no se usan en el render inicial
const TaskDialog = lazy(() => import("@/components/tasks").then(m => ({ default: m.TaskDialog })));
const PromptDialog = lazy(() => import("@/components/tasks").then(m => ({ default: m.PromptDialog })));
const KanbanBoard = lazy(() => import("@/components/tasks").then(m => ({ default: m.KanbanBoard })));
const InstructionsSheet = lazy(() => import("@/components/workspace").then(m => ({ default: m.InstructionsSheet })));
const ShareDialog = lazy(() => import("@/components/workspace").then(m => ({ default: m.ShareDialog })));
const SectionDialog = lazy(() => import("@/components/workspace").then(m => ({ default: m.SectionDialog })));
const WorkspaceSettingsDialog = lazy(() => import("@/components/workspace").then(m => ({ default: m.WorkspaceSettingsDialog })));
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Workspace, Task, TaskAssignee, WorkspaceSection, Subtask } from "@/lib/types";
import { cn } from "@/lib/utils";
import { calculateNextOccurrence } from "@/lib/recurrence";

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
  const searchParams = useSearchParams();
  const workspaceId = params.id as string;
  const viewModeFromQuery = searchParams.get("view");
  const sectionIdFromQuery = searchParams.get("section");

  // React Query
  const qc = useQueryClient();
  const overviewQuery = useWorkspaceOverview(workspaceId);
  const tasksQuery = useTasks(workspaceId);

  // Derived tasks: prefer full tasks (with assignees/subtasks), fall back to lite
  const tasks: Task[] = tasksQuery.data ?? overviewQuery.data?.tasks ?? [];

  // Local state (workspace + sections seeded from query)
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [sections, setSections] = useState<WorkspaceSection[]>([]);
  const isLoadingWorkspace = overviewQuery.isLoading;
  const isLoadingSections = overviewQuery.isLoading;
  const isLoadingTasks = tasksQuery.isLoading && !overviewQuery.data;

  // Shim: update tasks in query cache (same signature as old setTasks setState)
  const setTasks = useCallback(
    (updater: Task[] | ((prev: Task[]) => Task[])) => {
      qc.setQueryData<Task[]>(queryKeys.tasks(workspaceId), (prev) => {
        const current = prev ?? overviewQuery.data?.tasks ?? [];
        return typeof updater === "function" ? updater(current) : updater;
      });
    },
    [qc, workspaceId, overviewQuery.data]
  );

  // Redirect if workspace not found
  useEffect(() => {
    if (overviewQuery.error) {
      const msg = overviewQuery.error instanceof Error ? overviewQuery.error.message : "";
      if (msg === "404") {
        toast.error("Workspace no encontrado");
        router.push("/app");
      } else {
        toast.error("Error al cargar los datos");
      }
    }
  }, [overviewQuery.error, router]);

  // Seed local workspace + sections from query (and re-sync on background refetch)
  useEffect(() => {
    if (overviewQuery.data) {
      setWorkspace(overviewQuery.data.workspace);
      setSections(overviewQuery.data.sections);
    }
  }, [overviewQuery.data]);

  // hydrate tasks with full detail once they arrive from the tasks query
  const lastHydratedRef = useRef("");
  useEffect(() => {
    if (!tasksQuery.data || lastHydratedRef.current === workspaceId) return;
    lastHydratedRef.current = workspaceId;
    const fullById = new Map(tasksQuery.data.map((t) => [t.id, t]));
    qc.setQueryData<Task[]>(queryKeys.tasks(workspaceId), (prev) =>
      (prev ?? []).map((task) => {
        const full = fullById.get(task.id);
        if (!full) return task;
        return { ...task, assignees: full.assignees, subtasks: full.subtasks, tags: full.tags };
      })
    );
  }, [tasksQuery.data, workspaceId, qc]);

  // AI Generation state
  const [aiText, setAiText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("importance");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "kanban">(
    viewModeFromQuery === "kanban" ? "kanban" : "list"
  );
  const [, startTransition] = useTransition();

  // Fast initial load: one request for critical data + non-blocking hydration
  // (now handled by useWorkspaceOverview + useTasks hooks above)

  useEffect(() => {
    if (sections.length === 0) return;

    if (!activeSectionId) {
      if (sectionIdFromQuery && sections.some((section) => section.id === sectionIdFromQuery)) {
        setActiveSectionId(sectionIdFromQuery);
        return;
      }
      setActiveSectionId(sections[0].id);
      return;
    }

    const activeSectionExists = sections.some((section) => section.id === activeSectionId);
    if (!activeSectionExists) {
      if (sectionIdFromQuery && sections.some((section) => section.id === sectionIdFromQuery)) {
        setActiveSectionId(sectionIdFromQuery);
        return;
      }
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId, sectionIdFromQuery]);

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

    // Hide recurring tasks whose next_due_at is in the future
    const now = new Date();
    result = result.filter((t) => {
      if (t.recurrence && t.nextDueAt) {
        return new Date(t.nextDueAt) <= now;
      }
      return true;
    });

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
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    // Filter by selected tags
    if (selectedTagIds.length > 0) {
      result = result.filter((t) =>
        selectedTagIds.some(tagId => t.tags?.some(tt => tt.tagId === tagId))
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
  }, [tasks, searchQuery, selectedTagIds, sortField, sortOrder, activeSectionId, getTaskSection]);

  // Counts for tabs (using helper that handles legacy flags)
  const sectionCounts = useMemo(() => {
    const now = new Date();
    const visibleTasks = tasks.filter((t) => {
      if (t.recurrence && t.nextDueAt) {
        return new Date(t.nextDueAt) <= now;
      }
      return true;
    });
    const counts: Record<string, number> = {};
    sections.forEach((section) => {
      counts[section.id] = visibleTasks.filter((t) => getTaskSection(t) === section.id).length;
    });
    return counts;
  }, [tasks, sections, getTaskSection]);

  // Derive unique workspace tags from all tasks (for filter UI)
  const availableTags: TagFilterItem[] = useMemo(() => {
    const seen = new Map<string, TagFilterItem>();
    for (const task of tasks) {
      if (task.tags) {
        for (const tag of task.tags) {
          if (!seen.has(tag.tagId)) {
            seen.set(tag.tagId, { id: tag.tagId, name: tag.name, color: tag.color });
          }
        }
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  // Handler for changing task section (drag and drop or menu)
  // Función optimizada para re-fetch de tasks
  const refetchTasks = useCallback(() => {
    void qc.invalidateQueries({ queryKey: queryKeys.tasks(workspaceId) });
  }, [qc, workspaceId]);

  // Función optimizada para re-fetch de sections
  const refetchSections = useCallback(() => {
    void qc.invalidateQueries({ queryKey: queryKeys.workspaceOverview(workspaceId) });
  }, [qc, workspaceId]);

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

  // Move a section left/right in the list view tabs
  const handleMoveSectionInList = useCallback((section: WorkspaceSection, direction: "left" | "right") => {
    const idx = sections.findIndex(s => s.id === section.id);
    if (idx === -1) return;
    const newIndex = direction === "left" ? idx - 1 : idx + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const reordered = [...sections];
    [reordered[idx], reordered[newIndex]] = [reordered[newIndex], reordered[idx]];
    handleSectionsReorder(reordered);
  }, [sections, handleSectionsReorder]);

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
      
      // Add new tasks to cache immediately marked as isNew
      const newTaskIds = new Set<string>(data.tasks.map((t: Task) => t.id as string));
      qc.setQueryData<Task[]>(queryKeys.tasks(workspaceId), (prev) => {
        const merged = [...(prev ?? [])];
        for (const t of data.tasks as Task[]) {
          if (!merged.find((x) => x.id === t.id)) merged.push({ ...t, isNew: true });
        }
        return merged.map((t) => newTaskIds.has(t.id) ? { ...t, isNew: true } : t);
      });

      // After 20s remove the isNew highlight and sync with server
      setTimeout(() => {
        qc.setQueryData<Task[]>(queryKeys.tasks(workspaceId), (prev) =>
          (prev ?? []).map((t) => ({ ...t, isNew: false }))
        );
        void qc.invalidateQueries({ queryKey: queryKeys.tasks(workspaceId) });
      }, 20000);
      
      toast.success(`${data.count} tareas generadas correctamente`);
      setAiText("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al generar tareas";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [aiText, workspaceId, qc]);

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Prefer webm if supported, fallback to default
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all tracks to release the mic
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });

        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const res = await fetch("/api/ai/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Error al transcribir");
          }

          const { text } = await res.json();
          if (text?.trim()) {
            setAiText((prev) => (prev.trim() ? `${prev.trim()} ${text.trim()}` : text.trim()));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Error al transcribir el audio";
          toast.error(message);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("No se pudo acceder al micrófono. Comprueba los permisos.");
    }
  }, [isRecording]);

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
      // Si es una tarea recurrente y se está completando, avanzar next_due_at
      if (task.recurrence && !task.completed) {
        const baseDate = task.nextDueAt || task.dueDate;
        const nextDate = calculateNextOccurrence(baseDate, task.recurrence);
        
        if (nextDate) {
          const res = await fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              nextDueAt: nextDate, 
              completed: false,
            }),
          });

          if (!res.ok) throw new Error("Error al actualizar tarea recurrente");

          toast.success("¡Ocurrencia completada! Desaparecerá hasta la próxima fecha.");
          refetchTasks();
          return;
        } else {
          toast.info("La recurrencia ha terminado.");
        }
      }

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
    recurrence?: import("@/lib/types").RecurrenceRule | null;
  }) => {
    try {
      // Si tiene recurrencia, inicializar nextDueAt a ahora (visible inmediatamente)
      const taskData = {
        ...data,
        ...(data.recurrence ? { nextDueAt: new Date().toISOString() } : {}),
      };

      if (taskDialogMode === "create") {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...taskData,
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
          body: JSON.stringify(taskData),
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
    if (e.key === "Enter" && !e.shiftKey) {
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

  const handleTagsChange = useCallback((taskId: string, tags: import("@/lib/types").TaskTag[]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, tags } : t))
    );
  }, []);

  const handleRemoveRecurrence = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurrence: null, nextDueAt: null }),
      });
      if (!res.ok) throw new Error("Error al quitar recurrencia");
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, recurrence: undefined, nextDueAt: undefined } : t));
      toast.success("Recurrencia eliminada");
    } catch {
      toast.error("Error al quitar la recurrencia");
    }
  }, []);

  const handleUpdateRecurrence = useCallback(async (taskId: string, rule: import("@/lib/types").RecurrenceRule | null) => {
    if (!rule) {
      return handleRemoveRecurrence(taskId);
    }
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurrence: rule }),
      });
      if (!res.ok) throw new Error("Error al actualizar recurrencia");
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, recurrence: rule } : t));
      toast.success("Recurrencia actualizada");
    } catch {
      toast.error("Error al actualizar la recurrencia");
    }
  }, [handleRemoveRecurrence]);

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
    <div className="relative min-h-screen pb-32 md:pb-28">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" asChild>
              <Link href="/app">
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                <span className="sr-only">Volver</span>
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-2xl font-bold tracking-tight truncate">
                {workspace.name}
              </h1>
              {workspace.description && (
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">{workspace.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShareDialogOpen(true)}
                className="h-9 w-9 md:h-10 md:w-auto md:px-4"
              >
                <Share2 className="h-4 w-4 md:h-4.5 md:w-4.5" />
                <span className="hidden md:inline ml-1.5">Compartir</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setInstructionsOpen(true)}
                className="h-9 w-9 md:h-10 md:w-auto md:px-4"
              >
                <FileText className="h-4 w-4 md:h-4.5 md:w-4.5" />
                <span className="hidden md:inline ml-1.5">Instrucciones</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="h-9 w-9 md:h-10 md:w-10"
              >
                <Settings className="h-4 w-4 md:h-4.5 md:w-4.5" />
              </Button>
            </div>
          </div>
        </div>

        <Separator />

      {/* Tasks Section */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 md:h-5 md:w-5" />
            <h2 className="font-semibold text-sm md:text-base">Tareas</h2>
          </div>
          <div className="flex items-center gap-3 md:gap-3.5">
            {/* View mode toggle - animated pill (slightly smaller) */}
            <div className="relative grid grid-cols-2 items-center border rounded-lg p-0.5 md:p-0.5 bg-background/95 backdrop-blur-sm border-border/50">
              {/* Sliding active background: sized to match each button accounting for container padding */}
              <div
                className={cn(
                  "absolute inset-0.5 md:inset-0.5 w-[calc(50%-2px)] md:w-[calc(50%-3px)] rounded-md bg-primary shadow-sm transition-transform duration-200 ease-in-out",
                  viewMode === "kanban" ? "translate-x-full" : "translate-x-0"
                )}
              />
              <button
                onClick={() => startTransition(() => setViewMode("list"))}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-1 h-8 px-2 md:px-2.5 rounded-md text-xs md:text-sm font-medium transition-colors duration-200",
                  viewMode === "list" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => startTransition(() => setViewMode("kanban"))}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-1 h-8 px-2 md:px-2.5 rounded-md text-xs md:text-sm font-medium transition-colors duration-200",
                  viewMode === "kanban" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>
            <Button onClick={handleCreateTask} size="sm" className="gap-1.5 h-9 md:h-10 px-3 md:px-4 text-sm md:text-base btn-accent-gradient text-white font-semibold">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva tarea</span>
              <span className="sm:hidden">Nueva</span>
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
                        ? "border-ta bg-background/95 text-ta shadow-md shadow-ta/20"
                        : "border-border bg-background/95 hover:bg-accent/50 shadow-sm"
                    )}
                  >
                    <button
                      onClick={() => setActiveSectionId(section.id)}
                      className="flex items-center gap-1.5 md:gap-2"
                    >
                      <IconComponent className="h-4 w-4 shrink-0" style={{ color: section.color }} />
                      <span className="text-sm md:text-base">{section.name}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">
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
                        <DropdownMenuItem
                          onClick={() => handleMoveSectionInList(section, "left")}
                          disabled={sections.indexOf(section) === 0}
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Mover a la izquierda
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleMoveSectionInList(section, "right")}
                          disabled={sections.indexOf(section) === sections.length - 1}
                        >
                          <ChevronRight className="h-4 w-4 mr-2" />
                          Mover a la derecha
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
                className="gap-1.5 h-9 px-3 border border-dashed hover:border-ta/50 hover:text-ta-light"
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
          availableTags={availableTags}
          selectedTagIds={selectedTagIds}
          onSelectedTagsChange={setSelectedTagIds}
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
              onTagsChange={handleTagsChange}
              onQuickDelete={handleQuickDelete}
              onAddSection={() => {
                setEditingSection(null);
                setSectionDialogOpen(true);
              }}
              searchQuery={searchQuery}
              selectedTagIds={selectedTagIds}
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
          <div className="space-y-2 md:space-y-3">
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
                onTagsChange={handleTagsChange}
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
                    recurrence: editingTask.recurrence,
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

      {settingsOpen && (
        <Suspense fallback={null}>
          <WorkspaceSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            workspaceId={workspaceId}
            tasks={tasks}
            onRemoveRecurrence={handleRemoveRecurrence}
            onUpdateRecurrence={handleUpdateRecurrence}
          />
        </Suspense>
      )}
      </div>

      {/* Floating AI Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-3 pb-3 md:px-4 md:pb-6">
          <div className="relative">
            {/* Input with button inside - with BLUR SHADOW effect */}
            <div className="relative group z-0">
              {/* Contenedor del Input - Sin bordes, solo fondo translúcido y blur shadow */}
              <div className="relative rounded-2xl bg-background/60 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
                <Textarea
                  placeholder="Crear tareas con IA"
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className="resize-none bg-transparent !border-0 !shadow-none !ring-0 !outline-none focus-visible:!ring-0 focus-visible:!border-0 transition-all w-full min-h-[48px] md:min-h-[52px] text-base md:text-base rounded-2xl pr-[140px] md:pr-[160px] pl-4 py-3 md:py-3.5"
                  disabled={isGenerating}
                  style={{ fontSize: '16px' }}
                />
                
                {/* Mic button */}
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  disabled={isGenerating || isTranscribing}
                  title={isRecording ? "Detener grabación" : "Hablar"}
                  className={`absolute right-[100px] md:right-[122px] top-1/2 -translate-y-1/2 flex items-center justify-center h-[40px] w-[40px] rounded-full transition-all disabled:opacity-40 ${
                    isRecording
                      ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse"
                      : isTranscribing
                      ? "text-muted-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {isTranscribing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isRecording ? (
                    <Square className="h-5 w-5 fill-current" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </button>

                {/* Organizar button positioned inside input */}
                <Button
                  onClick={handleGenerateTasks}
                  disabled={isGenerating || !aiText.trim()}
                  size="sm"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 gap-1.5 md:gap-2 h-[40px] md:h-[44px] px-3 md:px-5 btn-accent-gradient text-white border-0 shadow-md transition-all rounded-[14px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs md:text-sm font-medium">Creando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs md:text-sm font-medium">Organizar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
