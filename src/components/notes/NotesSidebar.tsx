"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ChevronRight,
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
  Home,
  Layout,
  Plus,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
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
}

function getIcon(iconName: string, className?: string) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const Icon = icons[iconName] || LucideIcons.Folder;
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
  depth,
  isOpen,
  onToggle,
  selectedFolderId,
  selectedNoteId,
  notes,
  onSelectFolder,
  onSelectNote,
  onCreateFolder,
  onCreateNote,
  onRenameFolder,
  onDeleteFolder,
  openFolders,
  onToggleFolder,
}: {
  folder: NoteFolder & { children: NoteFolder[] };
  depth: number;
  isOpen: boolean;
  onToggle: () => void;
  selectedFolderId: string | null;
  selectedNoteId: string | null;
  notes: Note[];
  onSelectFolder: (id: string | null) => void;
  onSelectNote: (id: string) => void;
  onCreateFolder: (parentId?: string | null) => void;
  onCreateNote: (folderId?: string | null) => void;
  onRenameFolder: (folder: NoteFolder) => void;
  onDeleteFolder: (folder: NoteFolder) => void;
  openFolders: Set<string>;
  onToggleFolder: (id: string) => void;
}) {
  const isSelected = selectedFolderId === folder.id;
  const folderNotes = notes.filter((n) => n.folderId === folder.id);

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors",
          isSelected
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelectFolder(folder.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="shrink-0 p-0.5 hover:bg-accent/50 rounded transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
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
            <button className="shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-accent/50 rounded-md transition-opacity">
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
      {isOpen && (
        <div>
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child as NoteFolder & { children: NoteFolder[] }}
              depth={depth + 1}
              isOpen={openFolders.has(child.id)}
              onToggle={() => onToggleFolder(child.id)}
              selectedFolderId={selectedFolderId}
              selectedNoteId={selectedNoteId}
              notes={notes}
              onSelectFolder={onSelectFolder}
              onSelectNote={onSelectNote}
              onCreateFolder={onCreateFolder}
              onCreateNote={onCreateNote}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              openFolders={openFolders}
              onToggleFolder={onToggleFolder}
            />
          ))}
          {folderNotes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors",
                selectedNoteId === note.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              )}
              style={{ paddingLeft: `${28 + (depth + 1) * 16}px` }}
              onClick={() => onSelectNote(note.id)}
            >
              <span className="shrink-0 text-base leading-none">{note.icon}</span>
              <span className="truncate flex-1">{note.title || "Sin título"}</span>
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
}: NotesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  // Folder open/close state managed at sidebar level for persistence
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => {
    return new Set(folders.map((f) => f.id)); // all open by default
  });

  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);
  const rootNotes = useMemo(() => notes.filter((n) => !n.folderId), [notes]);
  const selectedWorkspace = useMemo(
    () => workspaces.find((w) => w.id === selectedWorkspaceId),
    [workspaces, selectedWorkspaceId]
  );

  // Sync: when folders change, add new ones to openFolders
  useEffect(() => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      folders.forEach((f) => {
        if (!next.has(f.id)) next.add(f.id);
      });
      return next;
    });
  }, [folders]);

  const toggleFolder = useCallback((folderId: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      onSearch(value);
    },
    [onSearch]
  );

  return (
    <div className="flex flex-col h-full border-r border-border/30 bg-background/95">
      {/* Workspace selector */}
      <div className="p-4 pb-3 border-b border-border/30">
        <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] mb-2 px-0.5">
          Workspace
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-2.5 h-10 px-3 font-semibold text-sm border-border/50 bg-muted/30 hover:bg-accent/50"
            >
              {selectedWorkspace && (
                <span
                  className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md"
                  style={{ backgroundColor: `${selectedWorkspace.color}20`, color: selectedWorkspace.color }}
                >
                  {getIcon(selectedWorkspace.icon, "h-3.5 w-3.5")}
                </span>
              )}
              <span className="truncate flex-1 text-left">
                {selectedWorkspace?.name || "Seleccionar workspace"}
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

      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input
            placeholder="Buscar notas..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-8 pl-8 text-sm bg-muted/30 border-border/40 focus:border-border/60"
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 pb-2 flex gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex-1 text-xs gap-1.5 border border-border/30 hover:border-border/50 bg-muted/20"
              onClick={() => onCreateNote(selectedFolderId)}
            >
              <FilePlus className="h-3.5 w-3.5" />
              Nota
            </Button>
          </TooltipTrigger>
          <TooltipContent>Nueva nota</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex-1 text-xs gap-1.5 border border-border/30 hover:border-border/50 bg-muted/20"
              onClick={() => onCreateFolder(selectedFolderId)}
            >
              <FolderPlus className="h-3.5 w-3.5" />
              Carpeta
            </Button>
          </TooltipTrigger>
          <TooltipContent>Nueva carpeta</TooltipContent>
        </Tooltip>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-3 pb-2">
          {/* All notes */}
          <div
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors mb-1",
              selectedFolderId === null && !selectedNoteId
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            )}
            onClick={() => onSelectFolder(null)}
          >
            <Home className="h-4 w-4 shrink-0" />
            <span className="font-medium flex-1">Todas las notas</span>
            <span className="text-[11px] text-muted-foreground/50 tabular-nums bg-muted/40 px-1.5 py-0.5 rounded-md">
              {notes.length}
            </span>
          </div>

          {/* Favorites */}
          {notes.some((n) => n.isFavorite) && (
            <div className="mt-3 mb-1">
              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">
                Favoritas
              </div>
              {notes
                .filter((n) => n.isFavorite)
                .map((note) => (
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
              isOpen={openFolders.has(folder.id)}
              onToggle={() => toggleFolder(folder.id)}
              selectedFolderId={selectedFolderId}
              selectedNoteId={selectedNoteId}
              notes={notes}
              onSelectFolder={onSelectFolder}
              onSelectNote={onSelectNote}
              onCreateFolder={onCreateFolder}
              onCreateNote={onCreateNote}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              openFolders={openFolders}
              onToggleFolder={toggleFolder}
            />
          ))}
          {folderTree.length === 0 && (
            <div className="px-3 py-3 text-xs text-muted-foreground/40 text-center">
              Sin carpetas todavía
            </div>
          )}

          {/* Root notes */}
          {rootNotes.length > 0 && (
            <div className="mt-3 mb-1">
              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">
                Sin carpeta
              </div>
              {rootNotes.map((note) => (
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
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{note.title || "Sin título"}</span>
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
                  onClick={onOpenTemplates}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Gestionar plantillas</TooltipContent>
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
