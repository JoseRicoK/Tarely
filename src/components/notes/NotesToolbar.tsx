"use client";

import {
  Star,
  Pin,
  Trash2,
  MoreHorizontal,
  LinkIcon,
  Unlink,
  Sparkles,
  Copy,
  Download,
  FolderInput,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note, NoteFolder, Workspace } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NotesToolbarProps {
  note: Note;
  folders: NoteFolder[];
  workspace: Workspace | undefined;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onLinkTask: () => void;
  onUnlinkTask: () => void;
  onMoveToFolder: (folderId: string | null) => void;
  onOpenAI: () => void;
  onSaveAsTemplate: () => void;
  onDuplicate: () => void;
  saving?: boolean;
}

export function NotesToolbar({
  note,
  folders,
  workspace,
  onTogglePin,
  onToggleFavorite,
  onDelete,
  onLinkTask,
  onUnlinkTask,
  onMoveToFolder,
  onOpenAI,
  onSaveAsTemplate,
  onDuplicate,
  saving,
}: NotesToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border/30 bg-background/60 backdrop-blur-sm">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        {workspace && (
          <span className="truncate font-medium text-muted-foreground" style={{ color: workspace.color }}>
            {workspace.name}
          </span>
        )}
        {note.folderId && (
          <>
            <span className="text-muted-foreground/30 select-none">/</span>
            <span className="truncate text-muted-foreground">
              {folders.find((f) => f.id === note.folderId)?.name || ""}
            </span>
          </>
        )}
        <span className="text-muted-foreground/30 select-none">/</span>
        <span className="truncate font-medium text-foreground/90">
          {note.title || "Sin título"}
        </span>
        {saving && (
          <span className="text-xs text-muted-foreground/50 animate-pulse ml-2 shrink-0">
            Guardando...
          </span>
        )}
      </div>

      {/* Action buttons — prominent */}
      <div className="flex items-center gap-1 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 p-0 rounded-lg",
                note.isPinned && "text-[var(--color-ta)] bg-[var(--color-ta)]/10"
              )}
              onClick={onTogglePin}
            >
              <Pin className={cn("h-[18px] w-[18px]", note.isPinned && "fill-current")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{note.isPinned ? "Desfijar" : "Fijar nota"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 p-0 rounded-lg",
                note.isFavorite && "text-yellow-500 bg-yellow-500/10"
              )}
              onClick={onToggleFavorite}
            >
              <Star className={cn("h-[18px] w-[18px]", note.isFavorite && "fill-current")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{note.isFavorite ? "Quitar de favoritas" : "Favorita"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 px-3 rounded-lg text-sm font-medium"
              onClick={onOpenAI}
            >
              <Sparkles className="h-[18px] w-[18px]" />
              <span className="hidden lg:inline">IA</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Asistente IA</TooltipContent>
        </Tooltip>

        {note.taskId ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-lg text-[var(--color-ta)]"
                onClick={onUnlinkTask}
              >
                <Unlink className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Desvincular tarea</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-lg"
                onClick={onLinkTask}
              >
                <LinkIcon className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Crear tarea vinculada</TooltipContent>
          </Tooltip>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
              <MoreHorizontal className="h-[18px] w-[18px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <FolderInput className="h-4 w-4" />
                Mover a carpeta
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52">
                <DropdownMenuItem onClick={() => onMoveToFolder(null)} className="gap-2">
                  Sin carpeta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {folders.map((f) => (
                  <DropdownMenuItem key={f.id} onClick={() => onMoveToFolder(f.id)} className="gap-2">
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={onDuplicate} className="gap-2">
              <Copy className="h-4 w-4" />
              Duplicar nota
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSaveAsTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Guardar como plantilla
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar nota
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
