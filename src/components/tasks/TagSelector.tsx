"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTags, queryKeys } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Tag, Plus, X, Check, ArrowLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskTag, WorkspaceTag } from "@/lib/types";

// Colores predefinidos para las etiquetas
// Cada color define: bg tenue + texto saturado (más elegante que fondo sólido + blanco)
const TAG_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // slate
];

/** Genera estilos inline para tags: fondo sutil + texto coloreado */
function getTagStyle(color: string): React.CSSProperties {
  return {
    backgroundColor: `${color}18`,
    color: color,
    borderColor: `${color}30`,
  };
}

interface TagSelectorProps {
  taskId: string;
  workspaceId: string;
  tags: TaskTag[];
  onTagsChange: (tags: TaskTag[]) => void;
  compact?: boolean;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function TagSelector({
  taskId,
  workspaceId,
  tags,
  onTagsChange,
  compact = false,
  externalOpen,
  onExternalOpenChange,
}: TagSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const openGuardRef = useRef(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const rawSetIsOpen = onExternalOpenChange || setInternalOpen;

  // Guard for external open (same pattern as TaskAssignees)
  useEffect(() => {
    if (externalOpen) {
      openGuardRef.current = true;
      const timer = setTimeout(() => { openGuardRef.current = false; }, 300);
      return () => clearTimeout(timer);
    }
  }, [externalOpen]);

  const setIsOpen = (val: boolean) => {
    if (!val && openGuardRef.current) return;
    rawSetIsOpen(val);
  };

  const [assigningTagId, setAssigningTagId] = useState<string | null>(null);
  const [removingTagId, setRemovingTagId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const qc = useQueryClient();
  const { data: workspaceTags = [], isPending: isLoading } = useTags(workspaceId);

  useEffect(() => {
    if (isOpen) setShowCreateForm(false);
  }, [isOpen]);

  const handleAssignTag = async (tagId: string) => {
    // Check if already assigned
    if (tags.some(t => t.tagId === tagId)) return;

    setAssigningTagId(tagId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) return; // Already assigned
        throw new Error(data.error);
      }

      const newTag = await res.json();
      onTagsChange([...tags, newTag]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al asignar etiqueta");
    } finally {
      setAssigningTagId(null);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    setRemovingTagId(tagId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/tags?tagId=${tagId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al quitar etiqueta");

      onTagsChange(tags.filter(t => t.tagId !== tagId));
    } catch {
      toast.error("Error al quitar etiqueta");
    } finally {
      setRemovingTagId(null);
    }
  };

  const handleTagCreated = (newTag: WorkspaceTag) => {
    void qc.invalidateQueries({ queryKey: queryKeys.tags(workspaceId) });
    setShowCreateForm(false);
    // Auto-assign the new tag
    handleAssignTag(newTag.id);
  };

  const handleDeleteWorkspaceTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/tags/${tagId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar etiqueta");

      void qc.invalidateQueries({ queryKey: queryKeys.tags(workspaceId) });
      // Also remove from task if assigned
      if (tags.some(t => t.tagId === tagId)) {
        onTagsChange(tags.filter(t => t.tagId !== tagId));
      }
      toast.success("Etiqueta eliminada");
    } catch {
      toast.error("Error al eliminar etiqueta");
    }
  };

  // Tags not yet assigned to the task
  const availableTags = workspaceTags.filter(
    wt => !tags.some(t => t.tagId === wt.id)
  );

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 gap-1 text-xs",
              tags.length > 0 && "text-foreground"
            )}
          >
            {tags.length > 0 ? (
              <div className="flex items-center gap-1 max-w-[120px] overflow-hidden">
                {tags.slice(0, 2).map(tag => (
                  <span
                    key={tag.tagId}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border shrink-0"
                    style={getTagStyle(tag.color)}
                  >
                    {tag.name}
                  </span>
                ))}
                {tags.length > 2 && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    +{tags.length - 2}
                  </span>
                )}
              </div>
            ) : (
              <>
                <Tag className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-0 bg-background/95 backdrop-blur-xl border-border"
          align="start"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <TagPopoverContent
            tags={tags}
            availableTags={availableTags}
            isLoading={isLoading}
            assigningTagId={assigningTagId}
            removingTagId={removingTagId}
            showCreateForm={showCreateForm}
            workspaceId={workspaceId}
            onAssign={handleAssignTag}
            onRemove={handleRemoveTag}
            onShowCreate={() => setShowCreateForm(true)}
            onHideCreate={() => setShowCreateForm(false)}
            onTagCreated={handleTagCreated}
            onDeleteTag={handleDeleteWorkspaceTag}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Full (non-compact) mode - for task detail page
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer group/tags">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <Badge
                  key={tag.tagId}
                  className="text-xs border hover:opacity-80 transition-opacity"
                  style={getTagStyle(tag.color)}
                >
                  {tag.name}
                </Badge>
              ))}
              <Badge
                variant="outline"
                className="text-xs gap-1 border-dashed cursor-pointer hover:bg-muted"
              >
                <Plus className="h-3 w-3" />
              </Badge>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="text-xs gap-1 border-dashed cursor-pointer hover:bg-muted"
            >
              <Tag className="h-3 w-3" />
              Añadir etiqueta
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 bg-background/95 backdrop-blur-xl border-border"
        align="end"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <TagPopoverContent
          tags={tags}
          availableTags={availableTags}
          isLoading={isLoading}
          assigningTagId={assigningTagId}
          removingTagId={removingTagId}
          showCreateForm={showCreateForm}
          workspaceId={workspaceId}
          onAssign={handleAssignTag}
          onRemove={handleRemoveTag}
          onShowCreate={() => setShowCreateForm(true)}
          onHideCreate={() => setShowCreateForm(false)}
          onTagCreated={handleTagCreated}
          onDeleteTag={handleDeleteWorkspaceTag}
        />
      </PopoverContent>
    </Popover>
  );
}

// ============== Popover Content ==============

interface TagPopoverContentProps {
  tags: TaskTag[];
  availableTags: WorkspaceTag[];
  isLoading: boolean;
  assigningTagId: string | null;
  removingTagId: string | null;
  showCreateForm: boolean;
  workspaceId: string;
  onAssign: (tagId: string) => void;
  onRemove: (tagId: string) => void;
  onShowCreate: () => void;
  onHideCreate: () => void;
  onTagCreated: (tag: WorkspaceTag) => void;
  onDeleteTag: (tagId: string) => void;
}

function TagPopoverContent({
  tags,
  availableTags,
  isLoading,
  assigningTagId,
  removingTagId,
  showCreateForm,
  workspaceId,
  onAssign,
  onRemove,
  onShowCreate,
  onHideCreate,
  onTagCreated,
  onDeleteTag,
}: TagPopoverContentProps) {
  if (showCreateForm) {
    return (
      <CreateTagForm
        workspaceId={workspaceId}
        onCreated={onTagCreated}
        onCancel={onHideCreate}
      />
    );
  }

  return (
    <div className="py-2">
      {/* Tags asignados */}
      {tags.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Etiquetas asignadas
          </div>
          <ScrollArea className="max-h-32">
            {tags.map(tag => (
              <div
                key={tag.tagId}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-foreground/5"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm">{tag.name}</span>
                </div>
                <button
                  onClick={() => onRemove(tag.tagId)}
                  disabled={removingTagId === tag.tagId}
                  className="text-muted-foreground hover:text-red-400 transition-colors"
                >
                  {removingTagId === tag.tagId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </ScrollArea>
          <div className="border-t border-foreground/10 my-1" />
        </>
      )}

      {/* Tags disponibles */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : availableTags.length > 0 ? (
        <>
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {tags.length > 0 ? "Añadir" : "Etiquetas"}
          </div>
          <ScrollArea className="max-h-40">
            {availableTags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center gap-2 group/tag-item"
              >
                <button
                  onClick={() => onAssign(tag.id)}
                  disabled={assigningTagId === tag.id}
                  className="flex-1 flex items-center gap-2 px-3 py-1.5 hover:bg-foreground/5 transition-colors text-left"
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm flex-1">{tag.name}</span>
                  {assigningTagId === tag.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/tag-item:opacity-100 transition-opacity" />
                  )}
                </button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onDeleteTag(tag.id)}
                        title="Eliminar etiqueta del workspace"
                        className="pr-3 text-muted-foreground/50 hover:text-red-400 transition-colors opacity-0 group-hover/tag-item:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Eliminar etiqueta del workspace</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </ScrollArea>
        </>
      ) : tags.length === 0 ? (
        <div className="px-3 py-3 text-center">
          <p className="text-xs text-muted-foreground mb-2">No hay etiquetas</p>
        </div>
      ) : null}

      {/* Botón crear nueva etiqueta */}
      <div className="border-t border-foreground/10 mt-1 pt-1">
        <button
          onClick={onShowCreate}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-foreground/5 transition-colors text-left text-sm text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Crear nueva etiqueta
        </button>
      </div>
    </div>
  );
}

// ============== Create Tag Form ==============

interface CreateTagFormProps {
  workspaceId: string;
  onCreated: (tag: WorkspaceTag) => void;
  onCancel: () => void;
}

function CreateTagForm({ workspaceId, onCreated, onCancel }: CreateTagFormProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[9]); // default indigo
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when form shows
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name: name.trim(), color }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const newTag = await res.json();
      onCreated(newTag);
      toast.success("Etiqueta creada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear etiqueta");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          title="Volver"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">Nueva etiqueta</span>
      </div>

      {/* Name input */}
      <Input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la etiqueta"
        className="h-8 text-sm"
        maxLength={50}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
          if (e.key === "Escape") onCancel();
        }}
      />

      {/* Preview */}
      {name.trim() && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Vista previa:</span>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border"
            style={getTagStyle(color)}
          >
            {name.trim()}
          </span>
        </div>
      )}

      {/* Color picker grid */}
      <div>
        <span className="text-xs text-muted-foreground mb-1.5 block">Color</span>
        <div className="grid grid-cols-6 gap-1.5">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "h-6 w-6 rounded-full transition-all hover:scale-110",
                color === c && "ring-2 ring-offset-2 ring-offset-background ring-foreground/50"
              )}
              style={{ backgroundColor: c }}
            >
              {color === c && (
                <Check className="h-3 w-3 text-white mx-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!name.trim() || isCreating}
          className="h-7 text-xs"
        >
          {isCreating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <Plus className="h-3.5 w-3.5 mr-1" />
          )}
          Crear
        </Button>
      </div>
    </div>
  );
}
