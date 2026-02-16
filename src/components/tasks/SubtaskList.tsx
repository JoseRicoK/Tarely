"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  Circle,
  X,
  Pencil,
  Trash2,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Subtask } from "@/lib/types";

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
  compact?: boolean;
  hideHeader?: boolean;
  forceAdding?: boolean;
  onAddingChange?: (isAdding: boolean) => void;
}

export function SubtaskList({
  taskId,
  subtasks,
  onSubtasksChange,
  compact = false,
  hideHeader = false,
  forceAdding = false,
  onAddingChange,
}: SubtaskListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Sincronizar con forceAdding externo
  useEffect(() => {
    if (forceAdding) {
      setIsAdding(true);
    }
  }, [forceAdding]);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when adding
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  // Focus edit input
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const completedCount = subtasks.filter((s) => s.completed).length;
  const hasSubtasks = subtasks.length > 0;

  // Añadir subtarea manual
  const handleAdd = async () => {
    if (!newTitle.trim()) {
      setIsAdding(false);
      onAddingChange?.(false);
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      if (!res.ok) throw new Error("Error al crear subtarea");

      const subtask = await res.json();
      onSubtasksChange([...subtasks, subtask]);
      setNewTitle("");
      setIsAdding(false);
      onAddingChange?.(false);
    } catch {
      toast.error("Error al crear subtarea");
    }
  };

  // Toggle completar subtarea
  const handleToggle = async (subtask: Subtask, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtaskId: subtask.id,
          completed: !subtask.completed,
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar");

      const updated = await res.json();
      onSubtasksChange(
        subtasks.map((s) => (s.id === subtask.id ? updated : s))
      );
    } catch {
      toast.error("Error al actualizar subtarea");
    }
  };

  // Editar subtarea
  const handleEdit = async (subtask: Subtask) => {
    if (!editingTitle.trim() || editingTitle === subtask.title) {
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtaskId: subtask.id,
          title: editingTitle.trim(),
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar");

      const updated = await res.json();
      onSubtasksChange(
        subtasks.map((s) => (s.id === subtask.id ? updated : s))
      );
      setEditingId(null);
    } catch {
      toast.error("Error al actualizar subtarea");
    }
  };

  // Eliminar subtarea
  const handleDelete = async (subtask: Subtask, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const res = await fetch(
        `/api/tasks/${taskId}/subtasks?subtaskId=${subtask.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Error al eliminar");

      onSubtasksChange(subtasks.filter((s) => s.id !== subtask.id));
    } catch {
      toast.error("Error al eliminar subtarea");
    }
  };

  // Vista compacta - solo indicador de subtareas
  if (compact) {
    if (!hasSubtasks) {
      // No mostrar nada si no hay subtareas (el botón de generar está en Actions)
      return null;
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 gap-1 text-xs"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <ListChecks className="h-3 w-3" />
        <span>
          {completedCount}/{subtasks.length}
        </span>
      </Button>
    );
  }

  return (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      {/* Header con toggle y acciones */}
      {!hideHeader && (
        <div className="flex items-center gap-2 mb-1">
          {hasSubtasks && (
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              <ListChecks className="h-3.5 w-3.5" />
              <span>
                Subtareas ({completedCount}/{subtasks.length})
              </span>
            </button>
          )}

          {hasSubtasks && isExpanded && subtasks.length < 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 ml-auto"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Lista de subtareas o input para añadir */}
      {((hideHeader || isExpanded) && (hasSubtasks || isAdding)) && (
        <div className="space-y-1 pl-4 border-l-2 border-muted ml-1">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="group/subtask flex items-center gap-2 py-0.5"
            >
              {/* Check */}
              <button
                className="flex-shrink-0"
                onClick={(e) => handleToggle(subtask, e)}
              >
                {subtask.completed ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>

              {/* Título o input de edición */}
              {editingId === subtask.id ? (
                <div className="flex-1 flex items-center gap-1">
                  <Input
                    ref={editInputRef}
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit(subtask);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => handleEdit(subtask)}
                    className="h-5 text-xs py-0 px-1"
                  />
                </div>
              ) : (
                <span
                  className={cn(
                    "flex-1 text-xs leading-tight",
                    subtask.completed && "line-through text-muted-foreground"
                  )}
                  onDoubleClick={() => {
                    setEditingId(subtask.id);
                    setEditingTitle(subtask.title);
                  }}
                >
                  {subtask.title}
                </span>
              )}

              {/* Acciones */}
              {editingId !== subtask.id && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover/subtask:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => {
                      setEditingId(subtask.id);
                      setEditingTitle(subtask.title);
                    }}
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => handleDelete(subtask, e)}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Input para añadir nueva */}
          {isAdding && (
            <div className="flex items-center gap-2 py-0.5">
              <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <Input
                ref={inputRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nueva subtarea..."
                className="h-5 text-xs py-0 px-1 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") {
                    setIsAdding(false);
                    setNewTitle("");
                    onAddingChange?.(false);
                  }
                }}
                onBlur={() => {
                  if (!newTitle.trim()) {
                    setIsAdding(false);
                    setNewTitle("");
                    onAddingChange?.(false);
                  }
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle("");
                  onAddingChange?.(false);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Versión inline compacta para KanbanCard (solo indicador visual)
export function SubtaskIndicator({
  subtasks,
}: {
  subtasks: Subtask[];
}) {
  if (!subtasks || subtasks.length === 0) {
    return null;
  }
  
  const completedCount = subtasks.filter((s) => s.completed).length;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <ListChecks className="h-3 w-3" />
      <span>
        {completedCount}/{subtasks.length}
      </span>
    </div>
  );
}
