"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconColorPicker } from "@/components/ui/icon-color-picker";
import { Loader2 } from "lucide-react";

const workspaceSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(24, "Máximo 24 caracteres"),
  description: z.string().max(500),
  instructions: z.string().max(10000),
  icon: z.string().max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

interface WorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WorkspaceFormData) => Promise<void>;
  initialData?: WorkspaceFormData;
  mode: "create" | "edit";
}

export function WorkspaceDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: WorkspaceDialogProps) {
  const [icon, setIcon] = useState(initialData?.icon || "Folder");
  const [color, setColor] = useState(initialData?.color || "#6366f1");
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      description: "",
      instructions: "",
      icon: "Folder",
      color: "#6366f1",
    },
  });

  // Actualizar valores cuando cambia initialData o se abre el diálogo
  useEffect(() => {
    if (open && initialData) {
      setValue("name", initialData.name);
      setValue("description", initialData.description || "");
      setValue("instructions", initialData.instructions || "");
      setValue("icon", initialData.icon || "Folder");
      setValue("color", initialData.color || "#6366f1");
      setIcon(initialData.icon || "Folder");
      setColor(initialData.color || "#6366f1");
    } else if (open && !initialData) {
      reset({ name: "", description: "", instructions: "", icon: "Folder", color: "#6366f1" });
      setIcon("Folder");
      setColor("#6366f1");
    }
  }, [open, initialData, setValue, reset]);

  // Sincronizar icon y color con el form
  useEffect(() => {
    setValue("icon", icon);
  }, [icon, setValue]);

  useEffect(() => {
    setValue("color", color);
  }, [color, setValue]);

  const handleFormSubmit = async (data: WorkspaceFormData) => {
    await onSubmit({ ...data, icon, color });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nuevo Workspace" : "Editar Workspace"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Crea un nuevo espacio de trabajo para organizar tus tareas."
              : "Modifica los detalles de tu workspace."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Icono, Color y Nombre en línea */}
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Icono</label>
              <IconColorPicker
                icon={icon}
                color={color}
                onIconChange={setIcon}
                onColorChange={setColor}
              />
            </div>
            <div className="flex-1 space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nombre <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                placeholder="Ej: Proyecto E-commerce"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción corta
            </label>
            <Input
              id="description"
              placeholder="Una breve descripción del proyecto"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="instructions" className="text-sm font-medium">
              Instrucciones para la IA
            </label>
            <Textarea
              id="instructions"
              placeholder="Instrucciones detalladas que la IA usará como contexto para generar tareas relevantes..."
              {...register("instructions")}
              rows={6}
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Estas instrucciones se usarán como contexto al generar tareas con
              IA. Incluye información sobre el stack, convenciones, prioridades,
              etc.
            </p>
            {errors.instructions && (
              <p className="text-sm text-destructive">
                {errors.instructions.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Crear Workspace" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
