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
import { DatePicker } from "@/components/ui/date-picker";
import { RecurrenceSelector } from "./RecurrenceSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { RecurrenceRule } from "@/lib/types";

const taskSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(1000),
  description: z.string().max(5000).optional(),
  importance: z.number().int().min(1).max(10),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData & { dueDate?: string | null; recurrence?: RecurrenceRule | null; workspaceId?: string }) => Promise<void>;
  initialData?: TaskFormData & { dueDate?: string | null; recurrence?: RecurrenceRule | null; workspaceId?: string };
  mode: "create" | "edit";
  workspaces?: { id: string; name: string }[];
}

export function TaskDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
  workspaces,
}: TaskDialogProps) {
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      importance: 5,
    },
  });

  // Actualizar valores cuando cambia initialData o se abre el diálogo
  useEffect(() => {
    if (open && initialData) {
      setDueDate(initialData.dueDate || null);
      setRecurrence(initialData.recurrence || null);
      setSelectedWorkspace(initialData.workspaceId || "");
      setValue("title", initialData.title);
      setValue("description", initialData.description || "");
      setValue("importance", initialData.importance);
    } else if (open && !initialData) {
      reset({ title: "", description: "", importance: 5 });
      setDueDate(null);
      setRecurrence(null);
      setSelectedWorkspace(workspaces?.[0]?.id || "");
    }
  }, [open, initialData, setValue, reset, workspaces]);

  const handleFormSubmit = async (data: TaskFormData) => {
    await onSubmit({ ...data, dueDate, recurrence, workspaceId: selectedWorkspace });
    reset();
    setDueDate(null);
    setRecurrence(null);
    setSelectedWorkspace("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nueva Tarea" : "Editar Tarea"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Crea una nueva tarea manualmente."
              : "Modifica los detalles de la tarea."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Título <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              placeholder="¿Qué hay que hacer?"
              {...register("title")}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción
            </label>
            <Textarea
              id="description"
              placeholder="Detalles adicionales (opcional)"
              {...register("description")}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {workspaces && workspaces.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Workspace
              </label>
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map(ws => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Fecha límite
            </label>
            <DatePicker
              value={dueDate || undefined}
              onChange={(date) => setDueDate(date)}
              showTime
              placeholder="Sin fecha límite"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Recurrencia
            </label>
            <RecurrenceSelector
              value={recurrence}
              onChange={setRecurrence}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="importance" className="text-sm font-medium">
              Importancia (1-10) <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-4">
              <Input
                id="importance"
                type="number"
                min={1}
                max={10}
                {...register("importance", { valueAsNumber: true })}
                className={`w-24 ${errors.importance ? "border-destructive" : ""}`}
              />
              <div className="flex gap-1">
                {[1, 3, 5, 7, 10].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue("importance", val)}
                  >
                    {val}
                  </Button>
                ))}
              </div>
            </div>
            {errors.importance && (
              <p className="text-sm text-destructive">
                {errors.importance.message}
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
              {mode === "create" ? "Crear Tarea" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
