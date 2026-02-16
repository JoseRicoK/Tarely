"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note, NoteFolder, NoteTemplate, Workspace } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { NoteEditor } from "@/components/notes/NoteEditor";
import type { NoteEditorHandle } from "@/components/notes/NoteEditor";
import { NotesToolbar } from "@/components/notes/NotesToolbar";
import { NoteChatPanel } from "@/components/notes/NoteChatPanel";
import { FolderDialog } from "@/components/notes/FolderDialog";
import { TemplateDialog } from "@/components/notes/TemplateDialog";
import { EmptyNotes } from "@/components/notes/EmptyNotes";

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Core state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogParent, setFolderDialogParent] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<NoteFolder | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<NoteFolder | null>(null);
  const [deleteNoteOpen, setDeleteNoteOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDialogMode, setTemplateDialogMode] = useState<"select" | "save">("select");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedNoteIdRef = useRef<string | null>(null);
  selectedNoteIdRef.current = selectedNote?.id ?? null;
  const selectedNoteRef = useRef<Note | null>(null);
  selectedNoteRef.current = selectedNote;
  const latestNoteRequestRef = useRef<string | null>(null);
  const editorRef = useRef<NoteEditorHandle>(null);
  const selectedFolderIdRef = useRef<string | null>(null);
  selectedFolderIdRef.current = selectedFolderId;
  const selectedWorkspaceIdRef = useRef<string | null>(null);
  selectedWorkspaceIdRef.current = selectedWorkspaceId;

  // ============== DATA FETCHING ==============

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWorkspaces(data);
      const wsParam = searchParams.get("workspace");
      if (wsParam && data.some((w: Workspace) => w.id === wsParam)) {
        setSelectedWorkspaceId(wsParam);
      } else if (!selectedWorkspaceId && data.length > 0) {
        setSelectedWorkspaceId(data[0].id);
      }
    } catch {
      toast.error("Error al cargar los workspaces");
    }
  }, [searchParams, selectedWorkspaceId]);

  const fetchFolders = useCallback(async (wsId: string) => {
    try {
      const res = await fetch(`/api/notes/folders?workspaceId=${wsId}`);
      if (!res.ok) throw new Error();
      setFolders(await res.json());
    } catch {
      // silent — sidebar shows empty
    }
  }, []);

  const fetchNotes = useCallback(async (wsId: string) => {
    try {
      const params = new URLSearchParams({ workspaceId: wsId, folderId: 'all' });
      const res = await fetch(`/api/notes?${params}`);
      if (!res.ok) throw new Error();
      setNotes(await res.json());
    } catch {
      toast.error("Error al cargar las notas");
    }
  }, []);

  const fetchNote = useCallback(async (id: string) => {
    latestNoteRequestRef.current = id;
    try {
      const res = await fetch(`/api/notes/${id}`);
      if (!res.ok) throw new Error();
      const note = await res.json();
      // Only set if this is still the latest request (prevents race conditions)
      if (latestNoteRequestRef.current === id) {
        setSelectedNote(note);
      }
    } catch {
      toast.error("Error al cargar la nota");
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/notes/templates");
      if (!res.ok) return;
      setTemplates(await res.json());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchWorkspaces();
      await fetchTemplates();
      setIsLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchFolders(selectedWorkspaceId);
      fetchNotes(selectedWorkspaceId);
      setSelectedNote(null);
      setSelectedFolderId(null);
    }
  }, [selectedWorkspaceId, fetchFolders, fetchNotes]);

  // ============== HANDLERS ==============

  const handleSelectWorkspace = useCallback((id: string) => {
    setSelectedWorkspaceId(id);
    router.replace(`/notes?workspace=${id}`, { scroll: false });
  }, [router]);

  const handleSelectFolder = useCallback((id: string | null) => {
    setSelectedFolderId(id);
    setSelectedNote(null);
  }, []);

  const handleSelectNote = useCallback(async (id: string) => {
    if (id === selectedNoteIdRef.current) return;
    await fetchNote(id);
  }, [fetchNote]);

  const handleCreateNote = useCallback(async (folderId?: string | null) => {
    const wsId = selectedWorkspaceIdRef.current;
    if (!wsId) return;
    // If no explicit folder, use selected folder, or current note's folder
    const targetFolder = folderId ?? selectedFolderIdRef.current ?? selectedNoteRef.current?.folderId ?? null;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: wsId,
          folderId: targetFolder,
          title: "",
        }),
      });
      if (!res.ok) throw new Error();
      const note = await res.json();
      setSelectedNote(note);
      fetchNotes(wsId);
      toast.success("Nota creada");
    } catch {
      toast.error("Error al crear la nota");
    }
  }, [fetchNotes]);

  const handleCreateNoteFromTemplate = async (template: NoteTemplate) => {
    if (!selectedWorkspaceId) return;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          folderId: selectedFolderId,
          title: template.name,
          icon: template.icon,
          contentJson: template.contentJson,
        }),
      });
      if (!res.ok) throw new Error();
      const note = await res.json();
      setSelectedNote(note);
      fetchNotes(selectedWorkspaceId);
      setTemplateDialogOpen(false);
      toast.success("Nota creada desde plantilla");
    } catch {
      toast.error("Error al crear desde plantilla");
    }
  };

  const handleUpdateNote = useCallback(
    (json: Record<string, unknown>, text: string) => {
      const noteId = selectedNoteIdRef.current;
      if (!noteId) return;
      setSaving(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const wordCount = text.split(/\s+/).filter(Boolean).length;
          const res = await fetch(`/api/notes/${noteId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentJson: json, contentText: text, wordCount }),
          });
          if (!res.ok) throw new Error();
          const updated = await res.json();
          // Only update if still the same note
          setSelectedNote((prev) =>
            prev?.id === noteId
              ? { ...prev, updatedAt: updated.updatedAt, wordCount: updated.wordCount, contentText: updated.contentText }
              : prev
          );
          setNotes((prev) =>
            prev.map((n) =>
              n.id === noteId
                ? { ...n, updatedAt: updated.updatedAt, wordCount: updated.wordCount, contentText: updated.contentText }
                : n
            )
          );
        } catch {
          toast.error("Error al guardar");
        } finally {
          setSaving(false);
        }
      }, 300);
    },
    [] 
  );

  const handleUpdateTitle = useCallback(
    async (title: string) => {
      const noteId = selectedNoteIdRef.current;
      if (!noteId) return;
      try {
        const res = await fetch(`/api/notes/${noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setSelectedNote((prev) => (prev ? { ...prev, title: updated.title } : null));
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? { ...n, title: updated.title } : n)));
      } catch {
        toast.error("Error al actualizar título");
      }
    },
    []
  );

  const handleDeleteNote = async () => {
    if (!selectedNote || !selectedWorkspaceId) return;
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSelectedNote(null);
      setDeleteNoteOpen(false);
      fetchNotes(selectedWorkspaceId);
      toast.success("Nota eliminada");
    } catch {
      toast.error("Error al eliminar la nota");
    }
  };

  const handleTogglePin = async () => {
    if (!selectedNote) return;
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !selectedNote.isPinned }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSelectedNote((prev) => (prev ? { ...prev, isPinned: updated.isPinned } : null));
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? { ...n, isPinned: updated.isPinned } : n)));
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedNote) return;
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !selectedNote.isFavorite }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSelectedNote((prev) => (prev ? { ...prev, isFavorite: updated.isFavorite } : null));
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? { ...n, isFavorite: updated.isFavorite } : n)));
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    if (!selectedNote || !selectedWorkspaceId) return;
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSelectedNote((prev) => (prev ? { ...prev, folderId: updated.folderId } : null));
      fetchNotes(selectedWorkspaceId);
      toast.success("Nota movida");
    } catch {
      toast.error("Error al mover la nota");
    }
  };

  const handleDragMoveNote = useCallback(async (noteId: string, targetFolderId: string | null) => {
    const wsId = selectedWorkspaceIdRef.current;
    if (!wsId) return;
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: targetFolderId }),
      });
      if (!res.ok) throw new Error();
      if (selectedNoteIdRef.current === noteId) {
        const updated = await res.json();
        setSelectedNote((prev) => (prev ? { ...prev, folderId: updated.folderId } : null));
      }
      fetchNotes(wsId);
      toast.success("Nota movida");
    } catch {
      toast.error("Error al mover la nota");
    }
  }, [fetchNotes]);

  const handleDuplicateNote = async () => {
    if (!selectedNote || !selectedWorkspaceId) return;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          folderId: selectedNote.folderId,
          title: `${selectedNote.title} (copia)`,
          contentJson: selectedNote.contentJson,
          contentText: selectedNote.contentText,
          icon: selectedNote.icon,
        }),
      });
      if (!res.ok) throw new Error();
      const note = await res.json();
      setSelectedNote(note);
      fetchNotes(selectedWorkspaceId);
      toast.success("Nota duplicada");
    } catch {
      toast.error("Error al duplicar");
    }
  };

  // Folder handlers
  const handleCreateFolder = useCallback((parentId?: string | null) => {
    setFolderDialogParent(parentId ?? null);
    setEditingFolder(null);
    setFolderDialogOpen(true);
  }, []);

  const handleSaveFolder = async (data: { name: string; icon: string; color: string }) => {
    if (!selectedWorkspaceId) return;
    try {
      if (editingFolder) {
        const res = await fetch(`/api/notes/folders/${editingFolder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        toast.success("Carpeta actualizada");
      } else {
        const res = await fetch("/api/notes/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: selectedWorkspaceId,
            parentFolderId: folderDialogParent,
            ...data,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success("Carpeta creada");
      }
      setFolderDialogOpen(false);
      fetchFolders(selectedWorkspaceId);
    } catch {
      toast.error("Error al guardar carpeta");
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget || !selectedWorkspaceId) return;
    try {
      const res = await fetch(`/api/notes/folders/${deleteFolderTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDeleteFolderTarget(null);
      if (selectedFolderId === deleteFolderTarget.id) setSelectedFolderId(null);
      fetchFolders(selectedWorkspaceId);
      fetchNotes(selectedWorkspaceId);
      toast.success("Carpeta eliminada");
    } catch {
      toast.error("Error al eliminar carpeta");
    }
  };

  // Task linking
  const handleLinkTask = async () => {
    if (!selectedNote || !selectedWorkspaceId) return;
    try {
      // 1. Crear tarea con noteId para vinculación bidireccional
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          noteId: selectedNote.id,
          title: selectedNote.title || "Nota sin título",
          description: selectedNote.contentText?.slice(0, 500) || "",
          importance: 5,
          source: "manual",
        }),
      });
      if (!res.ok) throw new Error();
      const task = await res.json();
      
      // 2. Actualizar nota con taskId
      const linkRes = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });
      if (!linkRes.ok) throw new Error();
      const updated = await linkRes.json();
      
      // 3. Actualizar UI
      setSelectedNote((prev) => (prev ? { ...prev, taskId: updated.taskId, completed: false, completedAt: null } : null));
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? { ...n, taskId: updated.taskId, completed: false, completedAt: null } : n)));
      toast.success("Tarea creada y vinculada");
    } catch {
      toast.error("Error al crear tarea");
    }
  };

  const handleUnlinkTask = async () => {
    if (!selectedNote) return;
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: null }),
      });
      if (!res.ok) throw new Error();
      setSelectedNote((prev) => (prev ? { ...prev, taskId: null, completed: false, completedAt: null } : null));
      setNotes((prev) => prev.map((n) => (n.id === selectedNote.id ? { ...n, taskId: null, completed: false, completedAt: null } : n)));
      toast.success("Tarea desvinculada");
    } catch {
      toast.error("Error al desvincular");
    }
  };

  const handleToggleComplete = async () => {
    if (!selectedNote || !selectedNote.taskId) return;
    try {
      const newCompleted = !selectedNote.completed;
      const completedAt = newCompleted ? new Date().toISOString() : null;
      
      // Actualizar la tarea vinculada
      const taskRes = await fetch(`/api/tasks/${selectedNote.taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          completed: newCompleted,
        }),
      });
      if (!taskRes.ok) throw new Error();
      
      // La sincronización se hará automáticamente via triggers de BD,
      // pero actualizamos la UI optimísticamente
      setSelectedNote((prev) => (prev ? { ...prev, completed: newCompleted, completedAt } : null));
      setNotes((prev) => prev.map((n) => (n.id === selectedNote.id ? { ...n, completed: newCompleted, completedAt } : n)));
      
      toast.success(newCompleted ? "Tarea completada" : "Tarea marcada como pendiente");
    } catch {
      toast.error("Error al actualizar tarea");
    }
  };

  // AI handlers
  const handleAIInsertText = (text: string) => {
    if (!selectedNote) return;
    // Insert via the editor ref for proper TipTap integration
    if (editorRef.current) {
      editorRef.current.insertContent(text);
    }
    toast.success("Texto insertado");
  };

  const handleAICreateTasks = async (tasks: Array<{ title: string; description?: string; importance: number }>) => {
    if (!selectedWorkspaceId) return;
    try {
      for (const task of tasks) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: selectedWorkspaceId,
            title: task.title,
            description: task.description || "",
            importance: task.importance,
            source: "ai",
          }),
        });
      }
      toast.success(`${tasks.length} tarea${tasks.length > 1 ? "s" : ""} creada${tasks.length > 1 ? "s" : ""}`);
    } catch {
      toast.error("Error al crear tareas");
    }
  };

  // Template handlers
  const handleSaveAsTemplate = async (data: { name: string; description: string; category?: string }) => {
    try {
      const res = await fetch("/api/notes/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          category: data.category || "general",
          contentJson: selectedNote?.contentJson || { type: "doc", content: [{ type: "paragraph" }] },
          icon: selectedNote?.icon || "📝",
        }),
      });
      if (!res.ok) throw new Error();
      setTemplateDialogOpen(false);
      fetchTemplates();
      toast.success(selectedNote ? "Plantilla guardada" : "Plantilla creada");
    } catch {
      toast.error("Error al guardar plantilla");
    }
  };

  const handleDeleteTemplate = async (template: NoteTemplate) => {
    try {
      const res = await fetch(`/api/notes/templates?id=${template.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchTemplates();
      toast.success("Plantilla eliminada");
    } catch {
      toast.error("Error al eliminar plantilla");
    }
  };

  // Search
  const handleSearch = useCallback(
    async (query: string) => {
      if (!selectedWorkspaceId) return;
      if (!query.trim()) {
        // Restore all notes when clearing search
        fetchNotes(selectedWorkspaceId);
        return;
      }
      try {
        const res = await fetch(
          `/api/notes?workspaceId=${selectedWorkspaceId}&search=${encodeURIComponent(query)}`
        );
        if (!res.ok) throw new Error();
        setNotes(await res.json());
      } catch {
        // silent
      }
    },
    [selectedWorkspaceId, fetchNotes]
  );

  const handleRenameFolder = useCallback((f: NoteFolder) => {
    setEditingFolder(f);
    setFolderDialogOpen(true);
  }, []);

  const handleDeleteFolderTarget = useCallback((f: NoteFolder) => setDeleteFolderTarget(f), []);

  const handleOpenTemplates = useCallback(() => {
    setTemplateDialogMode("select");
    setTemplateDialogOpen(true);
  }, []);

  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);

  // ============== RENDER ==============

  return (
    <div className="fixed inset-x-0 top-[3.5rem] bottom-0 z-10 flex overflow-hidden bg-background">
      {/* Sidebar toggle (mobile/tablet) */}
      <div className="lg:hidden fixed top-[4rem] left-2 z-30">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-lg bg-background/90 backdrop-blur-sm shadow-lg border-border/50"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out flex-shrink-0 h-full",
          sidebarCollapsed
            ? "w-0 overflow-hidden"
            : "w-64 lg:w-72",
          // On mobile, overlay
          !sidebarCollapsed && "max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-20 max-lg:shadow-2xl"
        )}
      >
        <NotesSidebar
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          folders={folders}
          notes={notes}
          templates={templates}
          selectedFolderId={selectedFolderId}
          selectedNoteId={selectedNote?.id ?? null}
          onSelectWorkspace={handleSelectWorkspace}
          onSelectFolder={handleSelectFolder}
          onSelectNote={handleSelectNote}
          onCreateFolder={handleCreateFolder}
          onCreateNote={handleCreateNote}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolderTarget}
          onSearch={handleSearch}
          onOpenTemplates={handleOpenTemplates}
          onCreateNoteFromTemplate={handleCreateNoteFromTemplate}
          onMoveNote={handleDragMoveNote}
        />
      </div>

      {/* Click-away for mobile sidebar */}
      {!sidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 z-10 bg-black/20"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {selectedNote ? (
          <>
            {/* Toolbar */}
            <NotesToolbar
              note={selectedNote}
              folders={folders}
              workspace={selectedWorkspace}
              editor={editorRef.current?.editor ?? null}
              onTogglePin={handleTogglePin}
              onToggleFavorite={handleToggleFavorite}
              onDelete={() => setDeleteNoteOpen(true)}
              onLinkTask={handleLinkTask}
              onUnlinkTask={handleUnlinkTask}
              onToggleComplete={handleToggleComplete}
              onMoveToFolder={handleMoveToFolder}
              onSaveAsTemplate={() => {
                setTemplateDialogMode("save");
                setTemplateDialogOpen(true);
              }}
              onDuplicate={handleDuplicateNote}
              saving={saving}
            />

            {/* Title area with background */}
            <div className="bg-background/80 backdrop-blur-sm px-8 pt-6 pb-2 border-b border-border/10">
              <div className="flex items-center gap-3">
                <span className="text-3xl cursor-pointer hover:scale-110 transition-transform select-none">
                  {selectedNote.icon}
                </span>
                <input
                  className="text-4xl font-extrabold bg-transparent border-none outline-none flex-1 placeholder:text-muted-foreground/30"
                  value={selectedNote.title}
                  onChange={(e) =>
                    setSelectedNote((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                  onBlur={(e) => handleUpdateTitle(e.target.value)}
                  placeholder="Sin título"
                />
              </div>
            </div>

            {/* Editor + AI panel */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto bg-background/60 backdrop-blur-sm">
                <NoteEditor ref={editorRef} key={selectedNote.id} content={selectedNote.contentJson} onUpdate={handleUpdateNote} />
              </div>
            </div>
          </>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-muted-foreground text-sm">Cargando notas...</div>
          </div>
        ) : (
          <EmptyNotes
            hasWorkspace={!!selectedWorkspaceId}
            onCreateNote={() => handleCreateNote()}
            onCreateFolder={() => handleCreateFolder()}
            onOpenTemplates={() => {
              setTemplateDialogMode("select");
              setTemplateDialogOpen(true);
            }}
          />
        )}
      </div>

      {/* Dialogs */}
      <FolderDialog
        key={editingFolder?.id ?? "new-folder"}
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onSave={handleSaveFolder}
        folder={editingFolder}
      />

      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        templates={templates}
        onSelectTemplate={handleCreateNoteFromTemplate}
        onSaveTemplate={handleSaveAsTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        mode={templateDialogMode}
        hasSelectedNote={!!selectedNote}
      />

      <DeleteDialog
        open={!!deleteFolderTarget}
        onOpenChange={(open) => !open && setDeleteFolderTarget(null)}
        onConfirm={handleDeleteFolder}
        title="Eliminar carpeta"
        description={`¿Estás seguro de eliminar la carpeta "${deleteFolderTarget?.name}"? Las notas dentro se moverán a "Sin carpeta".`}
      />

      <DeleteDialog
        open={deleteNoteOpen}
        onOpenChange={setDeleteNoteOpen}
        onConfirm={handleDeleteNote}
        title="Eliminar nota"
        description={`¿Estás seguro de eliminar "${selectedNote?.title || "Sin título"}"? Esta acción no se puede deshacer.`}
      />

      {/* Chat flotante con IA */}
      {selectedNote && (
        <NoteChatPanel
          noteId={selectedNote.id}
          noteContent={selectedNote.contentText || ""}
          workspaceColor={selectedWorkspace?.color}
        />
      )}
    </div>
  );
}
