"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspacesOverview, useInvalidators, queryKeys } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderPlus, AlertTriangle, Circle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { arrayMove } from "@dnd-kit/sortable";
import { format, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  WorkspaceCard,
  WorkspaceDialog,
  WorkspaceGridSkeleton,
  OnboardingCarousel,
} from "@/components/workspace";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { cn } from "@/lib/utils";
import type { Workspace, Task } from "@/lib/types";
import { useTranslations, useLocale } from "next-intl";

interface OverdueTask extends Task {
  workspaceName: string;
  workspaceId: string;
}

export default function AppHomePage() {
  const t = useTranslations('app');
  const tWorkspace = useTranslations('app.workspace');
  const tTask = useTranslations('app.task');
  const tOverdue = useTranslations('app.overdueTasks');
  const tNoWorkspaces = useTranslations('app.noWorkspaces');
  const tDeleteDialog = useTranslations('app.deleteDialog');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const dateLocale = locale === 'en' ? enUS : es;
  
  const router = useRouter();
  const qc = useQueryClient();
  const { invalidateWorkspacesOverview } = useInvalidators();
  const { data, isLoading } = useWorkspacesOverview();
  const workspaces = data?.workspaces ?? [];
  const overdueTasks = data?.overdueTasks ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const reorderWorkspaces = useCallback((newOrder: typeof workspaces) => {
    const current = qc.getQueryData<typeof data>(queryKeys.workspacesOverview);
    if (!current) return;
    qc.setQueryData(queryKeys.workspacesOverview, { ...current, workspaces: newOrder });
    const workspaceIds = newOrder.map((w) => w.id);
    fetch("/api/workspaces/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceIds }),
    }).catch(() => {
      toast.error(tErrors('reorderError'));
      void invalidateWorkspacesOverview();
    });
  }, [qc, data, invalidateWorkspacesOverview, tErrors]);

  const handleMoveWorkspace = useCallback((workspace: Workspace, direction: "left" | "right") => {
    const current = qc.getQueryData<typeof data>(queryKeys.workspacesOverview);
    if (!current) return;
    const idx = current.workspaces.findIndex((w) => w.id === workspace.id);
    if (idx === -1) return;
    const newIndex = direction === "left" ? idx - 1 : idx + 1;
    if (newIndex < 0 || newIndex >= current.workspaces.length) return;
    reorderWorkspaces(arrayMove(current.workspaces, idx, newIndex));
  }, [qc, data, reorderWorkspaces]);

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

  const handleToggleComplete = async (task: OverdueTask) => {
    try {
      let completedSectionId = null;

      const sectionsRes = await fetch(`/api/sections?workspaceId=${task.workspaceId}`);
      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        const sections = (Array.isArray(sectionsData)
          ? sectionsData
          : sectionsData.sections || []) as Array<{ id?: string; name?: string }>;
        const completedSection = sections.find((section) => section.name === "Completadas");
        completedSectionId = completedSection?.id;
      }
      
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
      
      qc.setQueryData(queryKeys.workspacesOverview, (prev: typeof data) => {
        if (!prev) return prev;
        return {
          workspaces: prev.workspaces.map((w) => {
            if (w.id !== task.workspaceId) return w;
            const current = w.pendingTasksCount ?? 0;
            return { ...w, pendingTasksCount: Math.max(0, current - 1) };
          }),
          overdueTasks: prev.overdueTasks.filter((t) => t.id !== task.id),
        };
      });
      
      toast.success(tTask('completed'));
    } catch {
      toast.error(tTask('completeError'));
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
        toast.success(tWorkspace('created'));
      } else if (editingWorkspace) {
        const res = await fetch(`/api/workspaces/${editingWorkspace.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Error al actualizar workspace");
        toast.success(tWorkspace('updated'));
      }
      setDialogOpen(false);
      await invalidateWorkspacesOverview();
    } catch {
      toast.error(
        dialogMode === "create"
          ? tWorkspace('createError')
          : tWorkspace('updateError')
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
      toast.success(tWorkspace('deleted'));
      setDeleteDialogOpen(false);
      void invalidateWorkspacesOverview();
    } catch {
      toast.error(tWorkspace('deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {showOnboarding && <OnboardingCarousel onComplete={handleOnboardingComplete} />}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <Button onClick={handleCreate} size="lg" className="gap-2 btn-accent-gradient text-white">
          <Plus className="h-5 w-5" />
          {t('newWorkspace')}
        </Button>
      </div>

      {isLoading ? (
        <WorkspaceGridSkeleton />
      ) : workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <FolderPlus className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{tNoWorkspaces('title')}</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {tNoWorkspaces('description')}
          </p>
          <Button onClick={handleCreate} size="lg" className="gap-2 btn-accent-gradient text-white">
            <Plus className="h-5 w-5" />
            {t('createFirst')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace, index) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMoveLeft={(w) => handleMoveWorkspace(w, "left")}
              onMoveRight={(w) => handleMoveWorkspace(w, "right")}
              isFirst={index === 0}
              isLast={index === workspaces.length - 1}
            />
          ))}
        </div>
      )}

      {!isLoading && workspaces.length > 0 && overdueTasks.length > 0 && (
        <div className="py-2" />
      )}

      {!isLoading && overdueTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{tOverdue('title')}</h2>
              <p className="text-sm text-muted-foreground">
                {tOverdue(overdueTasks.length === 1 ? 'count_one' : 'count_other', { count: overdueTasks.length })}
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
                          {tOverdue('expired', { 
                            date: format(parseISO(task.dueDate), locale === 'en' ? "MMMM d" : "d 'de' MMMM", { locale: dateLocale })
                          })}
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
                {tOverdue('viewAll', { count: overdueTasks.length })}
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
        title={tDeleteDialog('title')}
        description={tDeleteDialog('description', { name: deletingWorkspace?.name || '' })}
      />
    </div>
  );
}
