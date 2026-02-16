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
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note, NoteFolder, Workspace } from "@/lib/types";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { AIAgentPanel } from "./AIAgentPanel";
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
  editor: Editor | null;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onLinkTask: () => void;
  onUnlinkTask: () => void;
  onToggleComplete: () => void;
  onMoveToFolder: (folderId: string | null) => void;
  onSaveAsTemplate: () => void;
  onDuplicate: () => void;
  saving?: boolean;
}

export function NotesToolbar({
  note,
  folders,
  workspace,
  editor,
  onTogglePin,
  onToggleFavorite,
  onDelete,
  onLinkTask,
  onUnlinkTask,
  onToggleComplete,
  onMoveToFolder,
  onSaveAsTemplate,
  onDuplicate,
  saving,
}: NotesToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 md:px-5 py-3 md:py-2.5 border-b border-border/30 bg-background/60 backdrop-blur-sm">
      {/* Breadcrumb - Hidden on mobile, visible on tablet+ */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm flex-1 min-w-0">
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

      {/* Mobile: Just saving indicator */}
      <div className="sm:hidden flex-1 min-w-0">
        {saving && (
          <span className="text-xs text-muted-foreground/50 animate-pulse">
            Guardando...
          </span>
        )}
      </div>

      {/* Action buttons - Touch optimized */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Pin - Hidden on small mobile */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "hidden xs:flex h-9 w-9 md:h-8 md:w-8 p-0 hover:bg-accent/50 active:scale-95 transition-transform",
                note.isPinned && "text-[var(--color-ta)]"
              )}
              style={
                note.isPinned && workspace
                  ? ({ "--color-ta": workspace.color } as React.CSSProperties)
                  : undefined
              }
              onClick={onTogglePin}
            >
              <Pin className={cn("h-4 w-4 md:h-3.5 md:w-3.5", note.isPinned && "fill-current")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{note.isPinned ? "Desanclar" : "Anclar"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Favorite - Hidden on small mobile */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "hidden xs:flex h-9 w-9 md:h-8 md:w-8 p-0 hover:bg-accent/50 active:scale-95 transition-transform",
                note.isFavorite && "text-yellow-500"
              )}
              onClick={onToggleFavorite}
            >
              <Star className={cn("h-4 w-4 md:h-3.5 md:w-3.5", note.isFavorite && "fill-current")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{note.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}</p>
          </TooltipContent>
        </Tooltip>

        <AIAgentPanel
          noteId={note.id}
          editor={editor}
          noteContent={note.contentText || ""}
        />

        {note.taskId ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 w-9 p-0 rounded-lg",
                    note.completed ? "text-green-500 bg-green-500/10" : "text-muted-foreground"
                  )}
                  onClick={onToggleComplete}
                >
                  {note.completed ? (
                    <CheckCircle2 className="h-[18px] w-[18px]" />
                  ) : (
                    <Circle className="h-[18px] w-[18px]" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{note.completed ? "Marcar como pendiente" : "Completar tarea"}</TooltipContent>
            </Tooltip>
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
          </>
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

        {/* More actions - Touch optimized */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 md:h-8 md:w-8 p-0 hover:bg-accent/50 active:scale-95 transition-transform">
                  <MoreHorizontal className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Más opciones</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56">
            {/* Mobile-only: Pin & Favorite */}
            <div className="xs:hidden">
              <DropdownMenuItem onClick={onTogglePin} className="cursor-pointer min-h-[44px]">
                <Pin className={cn("mr-2 h-4 w-4", note.isPinned && "fill-current")} />
                {note.isPinned ? "Desanclar" : "Anclar"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleFavorite} className="cursor-pointer min-h-[44px]">
                <Star className={cn("mr-2 h-4 w-4", note.isFavorite && "fill-current")} />
                {note.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>

            {/* Move to folder */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer min-h-[44px] md:min-h-[36px]">
                <FolderInput className="mr-2 h-4 w-4" />
                Mover a carpeta
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                <DropdownMenuItem onClick={() => onMoveToFolder(null)} className="cursor-pointer min-h-[44px] md:min-h-[36px]">
                  Sin carpeta
                </DropdownMenuItem>
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => onMoveToFolder(folder.id)}
                    className="cursor-pointer min-h-[44px] md:min-h-[36px]"
                  >
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer min-h-[44px] md:min-h-[36px]">
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onSaveAsTemplate} className="cursor-pointer min-h-[44px] md:min-h-[36px]">
              <Download className="mr-2 h-4 w-4" />
              Guardar como plantilla
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={onDelete}
              className="cursor-pointer text-destructive focus:text-destructive min-h-[44px] md:min-h-[36px]"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
