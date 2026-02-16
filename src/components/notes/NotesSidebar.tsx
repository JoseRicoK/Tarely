"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ChevronDown,
  FolderPlus,
  FilePlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  Star,
  Pin,
  FileText,
  Layout,
  Plus,
  Folder,
  Briefcase,
  Code,
  Palette,
  BookOpen,
  Rocket,
  Target,
  Heart,
  Zap,
  Coffee,
  Music,
  Camera,
  Film,
  Gamepad2,
  ShoppingCart,
  Home,
  Car,
  Plane,
  Globe,
  Building2,
  GraduationCap,
  Dumbbell,
  Utensils,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NoteFolder, Note, NoteTemplate, Workspace } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Static icon map — avoids importing the entire lucide-react library (~1000+ icons)
const ICON_MAP: Record<string, LucideIcon> = {
  Folder, Briefcase, Code, Palette, BookOpen, Rocket, Target, Heart,
  Star, Zap, Coffee, Music, Camera, Film, Gamepad2, ShoppingCart,
  Home, Car, Plane, Globe, Building2, GraduationCap, Dumbbell, Utensils,
};

interface NotesSidebarProps {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  folders: NoteFolder[];
  notes: Note[];
  templates: NoteTemplate[];
  selectedFolderId: string | null;
  selectedNoteId: string | null;
  onSelectWorkspace: (id: string) => void;
  onSelectFolder: (id: string | null) => void;
  onSelectNote: (id: string) => void;
  onCreateFolder: (parentId?: string | null) => void;
  onCreateNote: (folderId?: string | null) => void;
  onRenameFolder: (folder: NoteFolder) => void;
  onDeleteFolder: (folder: NoteFolder) => void;
  onSearch: (query: string) => void;
  onOpenTemplates: () => void;
  onCreateNoteFromTemplate: (template: NoteTemplate) => void;
  onMoveNote?: (noteId: string, targetFolderId: string | null) => void;
}

function getIcon(iconName: string, className?: string) {
  const Icon = ICON_MAP[iconName] || Folder;
  return <Icon className={className} />;
}

function buildFolderTree(folders: NoteFolder[]): (NoteFolder & { children: NoteFolder[] })[] {
  const map = new Map<string, NoteFolder & { children: NoteFolder[] }>();
  const roots: (NoteFolder & { children: NoteFolder[] })[] = [];

  folders.forEach((f) => map.set(f.id, { ...f, children: [] }));
  folders.forEach((f) => {
    const node = map.get(f.id)!;
    if (f.parentFolderId && map.has(f.parentFolderId)) {
      map.get(f.parentFolderId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// ============== FOLDER ITEM ==============

function FolderItem({
  folder,
  depth = 0,
  selectedFolderId,
  selectedNoteId,
  notes,
  hideCompleted,
  onSelectFolder,
  onSelectNote,
  onCreateFolder,
  onCreateNote,
  onRenameFolder,
  onDeleteFolder,
  openFolders,
  onToggleFolder,
  onMoveNote,
  dragOverFolderId,
  onDragOverFolder,
}: {
  folder: NoteFolder & { children: NoteFolder[] };
  depth?: number;
  selectedFolderId: string | null;
  selectedNoteId: string | null;
  notes: Note[];
  hideCompleted: boolean;
  onSelectFolder: (id: string | null) => void;
  onSelectNote: (id: string) => void;
  onCreateFolder: (parentId?: string | null) => void;
  onCreateNote: (folderId?: string | null) => void;
  onRenameFolder: (folder: NoteFolder) => void;
  onDeleteFolder: (folder: NoteFolder) => void;
  openFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  onMoveNote?: (noteId: string, targetFolderId: string | null) => void;
  dragOverFolderId: string | null;
  onDragOverFolder: (folderId: string | null) => void;
}) {
  const isSelected = selectedFolderId === folder.id;
  const allFolderNotes = notes.filter((n) => n.folderId === folder.id);
  const folderNotes = hideCompleted ? allFolderNotes.filter(n => !n.completed) : allFolderNotes;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors",
          isSelected
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
          dragOverFolderId === folder.id && "ring-2 ring-primary/50 bg-primary/10"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelectFolder(folder.id)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          onDragOverFolder(folder.id);
        }}
        onDragLeave={() => onDragOverFolder(null)}
        onDrop={(e) => {
          e.preventDefault();
          onDragOverFolder(null);
          const noteId = e.dataTransfer.getData('text/noteId');
          if (noteId && onMoveNote) onMoveNote(noteId, folder.id);
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFolder(folder.id);
          }}
          className="p-0 hover:bg-accent/50 rounded transition-colors"
        >
          <ChevronDown className={cn(
            "h-3.5 w-3.5 transition-transform",
            !openFolders.has(folder.id) && "-rotate-90"
          )} />
        </button>
        <span className="shrink-0" style={{ color: folder.color }}>
          {getIcon(folder.icon, "h-4 w-4")}
        </span>
        <span className="truncate flex-1 font-medium">{folder.name}</span>
        {folderNotes.length > 0 && (
          <span className="text-[11px] text-muted-foreground/50 tabular-nums bg-muted/40 px-1.5 py-0.5 rounded-md">
            {folderNotes.length}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-accent/50 rounded-md transition-opacity" title="Opciones de carpeta">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => onCreateNote(folder.id)} className="gap-2">
              <FilePlus className="h-4 w-4" />
              Nueva nota aquí
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateFolder(folder.id)} className="gap-2">
              <FolderPlus className="h-4 w-4" />
              Nueva subcarpeta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRenameFolder(folder)} className="gap-2">
              <Pencil className="h-4 w-4" />
              Renombrar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteFolder(folder)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {openFolders.has(folder.id) && (
        <div>
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child as NoteFolder & { children: NoteFolder[] }}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              selectedNoteId={selectedNoteId}
              notes={notes}
              hideCompleted={hideCompleted}
              onSelectFolder={onSelectFolder}
              onSelectNote={onSelectNote}
              onCreateFolder={onCreateFolder}
              onCreateNote={onCreateNote}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              openFolders={openFolders}
              onToggleFolder={onToggleFolder}
              onMoveNote={onMoveNote}
              dragOverFolderId={dragOverFolderId}
              onDragOverFolder={onDragOverFolder}
            />
          ))}
          {folderNotes.map((note) => (
            <div
              key={note.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/noteId', note.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors",
                selectedNoteId === note.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              )}
              style={{ paddingLeft: `${28 + (depth + 1) * 16}px` }}
              onClick={() => onSelectNote(note.id)}
            >
              {note.completed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : (
                <span className="shrink-0 text-base leading-none">{note.icon}</span>
              )}
              <span className={cn(
                "truncate flex-1",
                note.completed && "line-through opacity-70"
              )}>{note.title || "Sin título"}</span>
              {note.isPinned && <Pin className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
              {note.isFavorite && <Star className="h-3 w-3 shrink-0 text-yellow-500 fill-yellow-500" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== MAIN SIDEBAR ==============

export function NotesSidebar({
  workspaces,
  selectedWorkspaceId,
  folders,
  notes,
  templates,
  selectedFolderId,
  selectedNoteId,
  onSelectWorkspace,
  onSelectFolder,
  onSelectNote,
  onCreateFolder,
  onCreateNote,
  onRenameFolder,
  onDeleteFolder,
  onSearch,
  onOpenTemplates,
  onCreateNoteFromTemplate,
  onMoveNote,
}: NotesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  // Folder open/close state managed at sidebar level for persistence
  const [closedFolders, setClosedFolders] = useState<Set<string>>(new Set());
  // Toggle para mostrar/ocultar notas completadas
  const [hideCompleted, setHideCompleted] = useState(true); // Siempre true inicialmente para evitar mismatch de hidratación
  const [isClient, setIsClient] = useState(false); // Flag para saber si estamos en el cliente
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar desde localStorage solo en el cliente
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('notes-hide-completed');
    if (saved !== null) {
      setHideCompleted(JSON.parse(saved));
    }
  }, []);

  // Memoizar workspace
  const workspace = useMemo(
    () => workspaces.find((w) => w.id === selectedWorkspaceId),
    [workspaces, selectedWorkspaceId]
  );

  // Memoizar árbol de carpetas
  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);

  // Memoizar filtrado de notas por búsqueda
  const searchedNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.contentText.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  // Memoizar notas favoritas
  const favoriteNotes = useMemo(() => {
    return hideCompleted 
      ? searchedNotes.filter((n) => n.isFavorite && !n.completed)
      : searchedNotes.filter((n) => n.isFavorite);
  }, [searchedNotes, hideCompleted]);

  // Memoizar notas sin carpeta
  const rootNotes = useMemo(() => {
    return hideCompleted
      ? searchedNotes.filter((n) => !n.folderId && !n.isFavorite && !n.completed)
      : searchedNotes.filter((n) => !n.folderId && !n.isFavorite);
  }, [searchedNotes, hideCompleted]);

  // Persistir estado del toggle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notes-hide-completed', JSON.stringify(hideCompleted));
    }
  }, [hideCompleted]);

  // Filtrar notas de una carpeta según el toggle
  const getFilteredFolderNotes = useCallback((folderId: string) => {
    const folderNotes = notes.filter((n) => n.folderId === folderId);
    return hideCompleted ? folderNotes.filter(n => !n.completed) : folderNotes;
  }, [notes, hideCompleted]);

  // A folder is "open" if it's NOT in closedFolders (all open by default)
  const openFolders = useMemo(() => {
    const open = new Set<string>();
    folders.forEach((f) => {
      if (!closedFolders.has(f.id)) open.add(f.id);
    });
    return open;
  }, [folders, closedFolders]);

  const toggleFolder = useCallback((folderId: string) => {
    setClosedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => onSearch(value), 300);
    },
    [onSearch]
  );

  // Cleanup search debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full border-r border-border/40 bg-muted/25">
      {/* Workspace selector - Fijo arriba */}
      <div className="shrink-0 p-4 pb-3 border-b border-border/30">
        <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] mb-2 px-0.5">
          Workspace
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-2.5 h-10 px-3 font-semibold text-sm border-border/50 bg-muted/30 hover:bg-accent/50"
            >
              {workspace && (
                <span
                  className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md"
                  style={{ backgroundColor: `${workspace.color}20`, color: workspace.color }}
                >
                  {getIcon(workspace.icon, "h-3.5 w-3.5")}
                </span>
              )}
              <span className="truncate flex-1 text-left">
                {workspace?.name || "Seleccionar workspace"}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Tus workspaces
            </div>
            {workspaces.map((w) => (
              <DropdownMenuItem
                key={w.id}
                onClick={() => onSelectWorkspace(w.id)}
                className={cn("gap-2.5 py-2", w.id === selectedWorkspaceId && "bg-accent")}
              >
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-md shrink-0"
                  style={{ backgroundColor: `${w.color}20`, color: w.color }}
                >
                  {getIcon(w.icon, "h-3.5 w-3.5")}
                </span>
                <span className="truncate font-medium">{w.name}</span>
                {w.id === selectedWorkspaceId && (
                  <span className="ml-auto text-[var(--color-ta)] text-xs">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search + Toggle - Fijos */}
      <div className="shrink-0 px-4 pt-3 pb-2 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input
            placeholder="Buscar notas..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-8 pl-8 text-sm bg-background/95 backdrop-blur-sm border-border/50 focus:border-border/60"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHideCompleted(!hideCompleted)}
          className="h-7 w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {hideCompleted ? (
            <><EyeOff className="h-3.5 w-3.5" /> Mostrar completadas</>
          ) : (
            <><Eye className="h-3.5 w-3.5" /> Ocultar completadas</>
          )}
        </Button>
      </div>

      {/* Quick actions - Fijos */}
      <div className="shrink-0 px-4 pb-3 border-b border-border/30">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateNote()}
            className="flex-1 h-10 sm:h-9 gap-2 active:scale-95 transition-transform"
          >
            <FilePlus className="h-4 w-4" />
            <span className="text-sm">Nueva nota</span>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateFolder()}
                className="h-10 w-10 sm:h-9 sm:w-9 p-0 active:scale-95 transition-transform"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Nueva carpeta</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenTemplates}
                className="h-10 w-10 sm:h-9 sm:w-9 p-0 active:scale-95 transition-transform"
              >
                <Layout className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Plantillas</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="px-3 pb-2">
          {/* Favorites */}
          {favoriteNotes.length > 0 && (
            <div className="mb-1">
              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">
                Favoritas
              </div>
              {favoriteNotes.map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-colors",
                      selectedNoteId === note.id
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                    )}
                    onClick={() => onSelectNote(note.id)}
                  >
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                    <span className="truncate">{note.title || "Sin título"}</span>
                  </div>
                ))}
            </div>
          )}

          {/* Folders */}
          <div className="mt-3 mb-1">
            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">
              Carpetas
            </div>
          </div>
          {folderTree.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              depth={0}
              selectedFolderId={selectedFolderId}
              selectedNoteId={selectedNoteId}
              notes={notes}
              hideCompleted={hideCompleted}
              onSelectFolder={onSelectFolder}
              onSelectNote={onSelectNote}
              onCreateFolder={onCreateFolder}
              onCreateNote={onCreateNote}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              openFolders={openFolders}
              onToggleFolder={toggleFolder}
              onMoveNote={onMoveNote}
              dragOverFolderId={dragOverFolderId}
              onDragOverFolder={setDragOverFolderId}
            />
          ))}
          {folderTree.length === 0 && (
            <div className="px-3 py-3 text-xs text-muted-foreground/40 text-center">
              Sin carpetas todavía
            </div>
          )}

          {/* Root notes */}
          {rootNotes.length > 0 && (
            <div
              className={cn(
                "mt-3 mb-1 rounded-lg transition-colors",
                dragOverFolderId === '__root__' && "ring-2 ring-primary/50 bg-primary/10"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverFolderId('__root__');
              }}
              onDragLeave={() => setDragOverFolderId(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverFolderId(null);
                const noteId = e.dataTransfer.getData('text/noteId');
                if (noteId && onMoveNote) onMoveNote(noteId, null);
              }}
            >
              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">
                Sin carpeta
              </div>
              {rootNotes.map((note) => (
                <div
                  key={note.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/noteId', note.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-colors",
                    selectedNoteId === note.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  )}
                  onClick={() => onSelectNote(note.id)}
                >
                  {note.completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className={cn(
                    "truncate flex-1",
                    note.completed && "line-through opacity-70"
                  )}>{note.title || "Sin título"}</span>
                  {note.isPinned && <Pin className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="mx-4 my-2 border-t border-border/20" />

        {/* Templates section — always visible, visual only */}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-2 px-2 py-1 mb-1">
            <Layout className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] flex-1">
              Plantillas
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/40 transition-colors"
                  onClick={() => {
                    if (templates.length > 0) {
                      onCreateNoteFromTemplate(templates[0]);
                    } else {
                      onOpenTemplates();
                    }
                  }}
                  title={templates.length > 0 ? "Crear nota desde primera plantilla" : "Crear plantilla"}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{templates.length > 0 ? "Nota rápida desde plantilla" : "Crear plantilla"}</TooltipContent>
            </Tooltip>
          </div>

          {templates.length > 0 ? (
            templates.slice(0, 8).map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                onClick={() => onCreateNoteFromTemplate(template)}
              >
                <span className="text-base shrink-0">{template.icon}</span>
                <span className="truncate">{template.name}</span>
              </div>
            ))
          ) : (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/40 transition-colors border border-dashed border-border/30"
              onClick={onOpenTemplates}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>Crear plantilla</span>
            </div>
          )}

          {templates.length > 8 && (
            <button
              className="w-full px-3 py-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground text-center rounded-lg hover:bg-accent/40 transition-colors mt-1"
              onClick={onOpenTemplates}
            >
              Ver todas ({templates.length})
            </button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
