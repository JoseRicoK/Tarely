"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/types";
import { Pin, Star, FileText, LinkIcon } from "lucide-react";

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
}

export function NoteCard({ note, isSelected, onClick }: NoteCardProps) {
  const preview = note.contentText?.slice(0, 120) || "";
  const hasTask = !!note.taskId;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-1.5 p-4 rounded-xl border cursor-pointer transition-all duration-200",
        isSelected
          ? "border-[var(--color-ta)]/50 bg-[var(--color-ta)]/5 shadow-sm"
          : "border-border/50 bg-card/50 hover:bg-card/80 hover:border-border hover:shadow-sm"
      )}
      onClick={onClick}
    >
      {/* Top row: icon + title */}
      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-none mt-0.5 shrink-0">{note.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold text-sm leading-tight truncate",
            !note.title && "text-muted-foreground italic"
          )}>
            {note.title || "Sin título"}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {note.isPinned && (
            <Pin className="h-3.5 w-3.5 text-muted-foreground/70" />
          )}
          {note.isFavorite && (
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          )}
          {hasTask && (
            <LinkIcon className="h-3.5 w-3.5 text-[var(--color-ta)]" />
          )}
        </div>
      </div>

      {/* Preview text */}
      {preview && (
        <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed pl-[30px]">
          {preview}
        </p>
      )}

      {/* Bottom: meta */}
      <div className="flex items-center gap-2 pl-[30px] mt-0.5">
        <span className="text-[11px] text-muted-foreground/60">
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true, locale: es })}
        </span>
        {note.wordCount > 0 && (
          <span className="text-[11px] text-muted-foreground/50">
            {note.wordCount} palabras
          </span>
        )}
      </div>
    </div>
  );
}
