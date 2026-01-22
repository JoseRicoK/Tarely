"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { Loader2, Trash2 } from "lucide-react";
import type { WorkspaceSection } from "@/lib/types";

interface SectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; icon: string; color: string }) => Promise<void>;
  section?: WorkspaceSection; // Para modo edición
  onDelete?: (sectionId: string) => Promise<void>; // Para eliminar sección
}

// Available icons for sections
const availableIcons = [
  "folder", "list-todo", "check-circle-2", "eye", "star", "flag", "bookmark",
  "tag", "zap", "rocket", "target", "trophy", "heart", "clock", "calendar",
  "inbox", "archive", "file-text", "clipboard", "layers", "grid", "layout",
  "box", "package", "briefcase", "code", "bug", "wrench", "settings",
  "lightbulb", "sparkles", "flame", "bolt", "crown", "shield", "lock",
];

// Available colors for sections
const availableColors = [
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#22c55e" },
  { name: "Naranja", value: "#f97316" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Púrpura", value: "#8b5cf6" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Índigo", value: "#6366f1" },
  { name: "Amarillo", value: "#eab308" },
  { name: "Cian", value: "#06b6d4" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Esmeralda", value: "#10b981" },
  { name: "Lima", value: "#84cc16" },
  { name: "Ámbar", value: "#f59e0b" },
  { name: "Slate", value: "#64748b" },
];

// Helper to get icon component dynamically
function getIconComponent(iconName: string): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
  const pascalCase = iconName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[pascalCase];
  return IconComponent || LucideIcons.Folder;
}

export function SectionDialog({
  open,
  onOpenChange,
  onSubmit,
  section,
  onDelete,
}: SectionDialogProps) {
  const isEditMode = !!section;
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("folder");
  const [selectedColor, setSelectedColor] = useState("#8b5cf6");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inicializar valores cuando se abre en modo edición
  useEffect(() => {
    if (open && section) {
      setName(section.name);
      setSelectedIcon(section.icon);
      setSelectedColor(section.color);
    } else if (open && !section) {
      setName("");
      setSelectedIcon("folder");
      setSelectedColor("#8b5cf6");
    }
  }, [open, section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
      });
      if (!isEditMode) {
        setName("");
        setSelectedIcon("folder");
        setSelectedColor("#8b5cf6");
      }
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!section || !onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(section.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const SelectedIconComponent = getIconComponent(selectedIcon);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar sección" : "Nueva sección"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Modifica el nombre, icono o color de la sección."
                : "Crea una nueva sección para organizar tus tareas."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Preview */}
            <div className="flex items-center justify-center">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: `${selectedColor}15`,
                  borderColor: `${selectedColor}30`,
                }}
              >
                <SelectedIconComponent
                  className="h-5 w-5"
                  style={{ color: selectedColor } as React.CSSProperties}
                />
                <span className="font-medium" style={{ color: selectedColor }}>
                  {name || "Nombre de sección"}
                </span>
              </div>
            </div>

            {/* Name input */}
            <div className="space-y-2">
              <Label htmlFor="section-name">Nombre</Label>
              <Input
                id="section-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: En progreso, Bloqueadas, Ideas..."
                maxLength={50}
              />
            </div>

            {/* Icon selector */}
            <div className="space-y-2">
              <Label>Icono</Label>
              <ScrollArea className="h-32 border rounded-lg p-2">
                <div className="grid grid-cols-8 gap-1">
                  {availableIcons.map((iconName) => {
                    const IconComponent = getIconComponent(iconName);
                    return (
                      <button
                        key={iconName}
                        type="button"
                        title={iconName}
                        onClick={() => setSelectedIcon(iconName)}
                        className={cn(
                          "p-2 rounded-md hover:bg-muted transition-colors flex items-center justify-center",
                          selectedIcon === iconName && "bg-primary/10 ring-2 ring-primary ring-inset"
                        )}
                      >
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Color selector */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-7 gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform hover:scale-110",
                      selectedColor === color.value && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isEditMode && onDelete && !section?.isSystem && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="sm:mr-auto"
              >
                {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting || isDeleting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditMode ? "Guardar cambios" : "Crear sección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
