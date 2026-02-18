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

export function NotesPageClient() {
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

  // Refs para valores estables
  const editorRef = useRef<NoteEditorHandle>(null);
  const selectedWorkspaceIdRef = useRef<string | null>(null);
  const selectedFolderIdRef = useRef<string | null>(null);
  const selectedNoteIdRef = useRef<string | null>(null);
  const selectedNoteRef = useRef<Note | null>(null);

  useEffect(() => {
    selectedWorkspaceIdRef.current = selectedWorkspaceId;
    selectedFolderIdRef.current = selectedFolderId;
    selectedNoteIdRef.current = selectedNote?.id || null;
    selectedNoteRef.current = selectedNote;
  }, [selectedWorkspaceId, selectedFolderId, selectedNote]);

  // ============== DATA FETCHING ==============

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWorkspaces(data);
      return data;
    } catch {
      toast.error("Error al cargar workspaces");
      return [];
    }
  }, []);

  const fetchFolders = useCallback(async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/notes/folders?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFolders(data);
      return data;
    } catch {
      toast.error("Error al cargar carpetas");
      return [];
    }
  }, []);

  const fetchNotes = useCallback(async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/notes?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotes(data);
      return data;
    } catch {
      toast.error("Error al cargar notas");
      return [];
    }
  }, []);

  const fetchTemplates = useCallback(async (workspaceId?: string) => {
    const wsId = workspaceId || selectedWorkspaceIdRef.current;
    if (!wsId) return;
    try {
      const res = await fetch(`/api/notes/templates?workspaceId=${wsId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTemplates(data);
    } catch {
      toast.error("Error al cargar plantillas");
    }
  }, []);

  const fetchNote = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`);
      if (!res.ok) throw new Error();
      const note = await res.json();
      setSelectedNote(note);
      return note;
    } catch {
      toast.error("Error al cargar la nota");
      return null;
    }
  }, []);

  // ============== INITIALIZATION ==============

  useEffect(() => {
    const init = async () => {
      const ws = await fetchWorkspaces();
      if (!ws || ws.length === 0) {
        setIsLoading(false);
        return;
      }

      const noteId = searchParams?.get("note");
      const wsIdParam = searchParams?.get("workspace");

      if (noteId) {
        const note = await fetchNote(noteId);
        if (note && note.workspaceId) {
          setSelectedWorkspaceId(note.workspaceId);
          await Promise.all([
            fetchFolders(note.workspaceId),
            fetchNotes(note.workspaceId),
            fetchTemplates(note.workspaceId),
          ]);
          if (note.folderId) {
            setSelectedFolderId(note.folderId);
          }
        }
      } else {
        const targetWs = wsIdParam
          ? ws.find((w: Workspace) => w.id === wsIdParam)
          : ws[0];
        if (targetWs) {
          setSelectedWorkspaceId(targetWs.id);
          const [, allNotes] = await Promise.all([
            fetchFolders(targetWs.id),
            fetchNotes(targetWs.id),
            fetchTemplates(targetWs.id),
          ]);
          if (allNotes && allNotes.length > 0) {
            setSelectedNote(allNotes[0]);
            if (allNotes[0].folderId) {
              setSelectedFolderId(allNotes[0].folderId);
            }
          }
        }
      }
      setIsLoading(false);
    };
    init();
  }, [fetchWorkspaces, fetchFolders, fetchNotes, fetchNote, fetchTemplates, searchParams]);

  // ============== NOTE HANDLERS ==============

  const handleCreateNote = useCallback(async (folderId?: string | null) => {
    const wsId = selectedWorkspaceIdRef.current;
    if (!wsId) return;
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
    const targetFolder = selectedFolderIdRef.current ?? selectedNoteRef.current?.folderId ?? null;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          folderId: targetFolder,
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

      const updatePayload = {
        contentJson: json,
        contentText: text,
      };

      fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      })
        .then((res) => {
          if (!res.ok) throw new Error();
          setSelectedNote((prev) => (prev ? { ...prev, contentJson: json, contentText: text } : null));
        })
        .catch(() => {
          toast.error("Error al guardar");
        })
        .finally(() => {
          setSaving(false);
        });
    },
    []
  );

  const handleUpdateTitle = async (title: string) => {
    if (!selectedNote) return;
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      setSelectedNote((prev) => (prev ? { ...prev, title } : null));
      if (selectedWorkspaceId) fetchNotes(selectedWorkspaceId);
    } catch {
      toast.error("Error al actualizar título");
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote || !selectedWorkspaceId) return;
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      const allNotes = await fetchNotes(selectedWorkspaceId);
      setSelectedNote(allNotes && allNotes.length > 0 ? allNotes[0] : null);
      setDeleteNoteOpen(false);
      toast.success("Nota eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleSelectNote = useCallback((id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      setSelectedNote(note);
      router.push(`/notes?note=${id}`);
    }
  }, [notes, router]);

  const handleTogglePin = async () => {
    if (!selectedNote || !selectedWorkspaceId) return;
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !selectedNote.isPinned }),
      });
      if (!res.ok) throw new Error();
      setSelectedNote((prev) => (prev ? { ...prev, isPinned: !prev.isPinned } : null));
      fetchNotes(selectedWorkspaceId);
      toast.success(selectedNote.isPinned ? "Desfijada" : "Fijada");
    } catch {
      toast.error("Error al fijar");
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedNote || !selectedWorkspaceId) return;
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !selectedNote.isFavorite }),
      });
      if (!res.ok) throw new Error();
      setSelectedNote((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
      fetchNotes(selectedWorkspaceId);
      toast.success(selectedNote.isFavorite ? "Quitada de favoritas" : "Añadida a favoritas");
    } catch {
      toast.error("Error");
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
      setSelectedNote((prev) => (prev ? { ...prev, folderId } : null));
      setSelectedFolderId(folderId);
      fetchNotes(selectedWorkspaceId);
      toast.success("Nota movida");
    } catch {
      toast.error("Error al mover");
    }
  };

  const handleAIInsertText = (text: string) => {
    if (editorRef.current?.editor) {
      editorRef.current.editor.commands.insertContent(text);
      toast.success("Texto insertado");
    }
  };

  const handleAICreateTasks = async (tasks: Array<{ title: string; description?: string; importance: number }>) => {
    if (!selectedWorkspaceId) return;
    try {
      const promises = tasks.map((task) =>
        fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: selectedWorkspaceId,
            title: task.title,
            description: task.description || "",
            status: "todo",
            importance: task.importance,
          }),
        })
      );
      await Promise.all(promises);
      toast.success(`${tasks.length} tarea(s) creada(s)`);
    } catch {
      toast.error("Error al crear tareas");
    }
  };

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
          icon: selectedNote.icon,
          contentJson: selectedNote.contentJson,
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
    const targetParent = parentId ?? selectedFolderIdRef.current ?? selectedNoteRef.current?.folderId ?? null;
    setFolderDialogParent(targetParent);
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
            parentId: folderDialogParent,
            ...data,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success("Carpeta creada");
      }
      fetchFolders(selectedWorkspaceId);
      setFolderDialogOpen(false);
    } catch {
      toast.error("Error");
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget || !selectedWorkspaceId) return;
    try {
      const res = await fetch(`/api/notes/folders/${deleteFolderTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchFolders(selectedWorkspaceId);
      setDeleteFolderTarget(null);
      toast.success("Carpeta eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  // Task handlers
  const handleLinkTask = async () => {
    if (!selectedNote || !selectedWorkspaceId) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          title: selectedNote.title || "Nueva tarea",
          description: selectedNote.contentText || "",
          importance: 5,
          source: "manual",
          noteId: selectedNote.id,
        }),
      });
      if (!res.ok) throw new Error();
      const task = await res.json();
      const patchRes = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });
      if (!patchRes.ok) throw new Error();
      setSelectedNote((prev) => (prev ? { ...prev, taskId: task.id } : null));
      fetchNotes(selectedWorkspaceId);
      toast.success("Tarea vinculada");
    } catch {
      toast.error("Error al vincular");
    }
  };

  const handleUnlinkTask = async () => {
    if (!selectedNote || !selectedWorkspaceId) return;
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: null }),
      });
      if (!res.ok) throw new Error();
      setSelectedNote((prev) => (prev ? { ...prev, taskId: null, completed: false } : null));
      fetchNotes(selectedWorkspaceId);
      toast.success("Tarea desvinculada");
    } catch {
      toast.error("Error");
    }
  };

  const handleToggleComplete = async () => {
    if (!selectedNote || !selectedWorkspaceId) return;
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !selectedNote.completed }),
      });
      if (!res.ok) throw new Error();
      setSelectedNote((prev) => (prev ? { ...prev, completed: !prev.completed } : null));
      fetchNotes(selectedWorkspaceId);
      toast.success(selectedNote.completed ? "Marcada como pendiente" : "Completada");
    } catch {
      toast.error("Error");
    }
  };

  // Template handlers
  const handleSaveAsTemplate = async () => {
    if (!selectedNote || !selectedWorkspaceId) return;
    setTemplateDialogMode("save");
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async (data: { name: string; description?: string; category?: string }) => {
    if (!selectedNote || !selectedWorkspaceId) return;
    try {
      const res = await fetch("/api/notes/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          name: data.name,
          description: data.description || "",
          category: data.category || "general",
          icon: selectedNote.icon,
          contentJson: selectedNote.contentJson,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Plantilla guardada");
      fetchTemplates();
      setTemplateDialogOpen(false);
    } catch {
      toast.error("Error al guardar plantilla");
    }
  };

  const handleDeleteTemplate = async (template: NoteTemplate) => {
    try {
      const res = await fetch(`/api/notes/templates/${template.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Plantilla eliminada");
      fetchTemplates();
    } catch {
      toast.error("Error al eliminar plantilla");
    }
  };

  // Workspace/Folder selection
  const handleSelectWorkspace = useCallback(
    async (id: string) => {
      setSelectedWorkspaceId(id);
      setSelectedFolderId(null);
      await Promise.all([fetchFolders(id), fetchNotes(id), fetchTemplates(id)]);
      const allNotes = notes.filter((n) => n.workspaceId === id);
      setSelectedNote(allNotes.length > 0 ? allNotes[0] : null);
      router.push(`/notes?workspace=${id}`);
    },
    [router, fetchFolders, fetchNotes, fetchTemplates, notes]
  );

  const handleSelectFolder = useCallback((id: string | null) => {
    setSelectedFolderId(id);
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      try {
      } catch {
      }
    },
    []
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

  // Drag and drop
  const handleDragMoveNote = async (noteId: string, folderId: string | null) => {
    if (!selectedWorkspaceId) return;
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      if (!res.ok) throw new Error();
      fetchNotes(selectedWorkspaceId);
      toast.success("Nota movida");
    } catch {
      toast.error("Error al mover nota");
    }
  };

  // ============== RENDER ==============

  return (
    <div className="fixed inset-x-0 top-[3.5rem] bottom-0 z-10 flex overflow-hidden bg-background">
      {/* Click-away overlay for mobile sidebar */}
      {!sidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 z-10 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={() => setSidebarCollapsed(true)}
          onTouchStart={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar toggle (mobile/tablet) - Touch optimized */}
      <div className="lg:hidden fixed top-[4rem] left-3 z-30">
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 md:h-10 md:w-10 rounded-xl bg-background/95 backdrop-blur-md shadow-lg border-border/50 hover:bg-background active:scale-95 transition-all"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar - Mobile optimized */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out flex-shrink-0 h-full",
          sidebarCollapsed
            ? "w-0 overflow-hidden"
            : "w-[85vw] sm:w-80 md:w-72 lg:w-72",
          !sidebarCollapsed && "max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-20 max-lg:shadow-2xl max-lg:border-r max-lg:border-border/30 max-lg:bg-background"
        )}
        onTouchStart={(e) => {
          if (!sidebarCollapsed && window.innerWidth < 1024) {
            const touch = e.touches[0];
            const sidebar = e.currentTarget;
            const startX = touch.clientX;
            
            const handleTouchMove = (e: TouchEvent) => {
              const currentX = e.touches[0].clientX;
              const diff = currentX - startX;
              if (diff < -50) setSidebarCollapsed(true);
            };
            
            sidebar.addEventListener('touchmove', handleTouchMove, { once: true });
          }
        }}
      >
        <NotesSidebar
          workspaces={workspaces}
          folders={folders}
          notes={notes}
          templates={templates}
          selectedWorkspaceId={selectedWorkspaceId}
          selectedFolderId={selectedFolderId}
          selectedNoteId={selectedNote?.id || null}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background/40">
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

            {/* Title area - Mobile responsive */}
            <div className="bg-background/80 backdrop-blur-sm px-4 sm:px-6 md:px-8 pt-4 sm:pt-5 md:pt-6 pb-2 md:pb-3 border-b border-border/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl cursor-pointer hover:scale-110 active:scale-95 transition-transform select-none shrink-0">
                  {selectedNote.icon}
                </span>
                <input
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-transparent border-none outline-none flex-1 placeholder:text-muted-foreground/30 min-w-0"
                  value={selectedNote.title}
                  onChange={(e) =>
                    setSelectedNote((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                  onBlur={(e) => handleUpdateTitle(e.target.value)}
                  placeholder="Sin título"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Editor - Touch optimized */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto bg-background/60 backdrop-blur-sm overscroll-contain">
                <NoteEditor ref={editorRef} key={selectedNote.id} content={selectedNote.contentJson} onUpdate={handleUpdateNote} noteId={selectedNote.id} />
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

      {/* Chat Panel */}
      {selectedNote && (
        <NoteChatPanel
          noteId={selectedNote.id}
          noteContent={selectedNote.contentText || ""}
          workspaceColor={selectedWorkspace?.color}
        />
      )}

      {/* Dialogs */}
      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        folder={editingFolder}
        onSave={handleSaveFolder}
      />

      <DeleteDialog
        open={!!deleteFolderTarget}
        onOpenChange={(open) => !open && setDeleteFolderTarget(null)}
        title="Eliminar carpeta"
        description="¿Estás seguro de que quieres eliminar esta carpeta? Las notas dentro se moverán a 'Sin carpeta'."
        onConfirm={handleDeleteFolder}
      />

      <DeleteDialog
        open={deleteNoteOpen}
        onOpenChange={setDeleteNoteOpen}
        title="Eliminar nota"
        description="¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer."
        onConfirm={handleDeleteNote}
      />

      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        templates={templates}
        onSelectTemplate={handleCreateNoteFromTemplate}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        mode={templateDialogMode}
      />
    </div>
  );
}
