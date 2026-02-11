"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Activity,
  CheckCircle2,
  Circle,
  MessageCircle,
  Paperclip,
  Pencil,
  UserPlus,
  UserMinus,
  ListPlus,
  Trash2,
  Loader2,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TaskActivity, TaskActivityAction } from "@/lib/types";
import { cn, getAvatarUrl } from "@/lib/utils";

interface ActivitySectionProps {
  taskId: string;
}

// Configuración de iconos y colores por tipo de acción
const activityConfig: Record<TaskActivityAction, { icon: typeof Activity; color: string; label: string }> = {
  created: { icon: Circle, color: "text-blue-500", label: "creó la tarea" },
  updated: { icon: Pencil, color: "text-yellow-500", label: "actualizó" },
  completed: { icon: CheckCircle2, color: "text-green-500", label: "completó la tarea" },
  uncompleted: { icon: Circle, color: "text-orange-500", label: "restauró la tarea" },
  assigned: { icon: UserPlus, color: "text-purple-500", label: "asignó a" },
  unassigned: { icon: UserMinus, color: "text-red-500", label: "quitó la asignación de" },
  comment_added: { icon: MessageCircle, color: "text-blue-400", label: "añadió un comentario" },
  comment_deleted: { icon: Trash2, color: "text-red-400", label: "eliminó un comentario" },
  attachment_added: { icon: Paperclip, color: "text-green-400", label: "subió" },
  attachment_deleted: { icon: Trash2, color: "text-red-400", label: "eliminó" },
  subtask_added: { icon: ListPlus, color: "text-indigo-500", label: "añadió subtarea" },
  subtask_completed: { icon: CheckCircle2, color: "text-green-400", label: "completó subtarea" },
  subtask_deleted: { icon: Trash2, color: "text-red-400", label: "eliminó subtarea" },
};

// Función para generar texto de actividad
function getActivityText(activity: TaskActivity): string {
  const config = activityConfig[activity.action];
  let text = config.label;

  // Añadir detalles específicos
  if (activity.fieldChanged) {
    text = `actualizó ${getFieldLabel(activity.fieldChanged)}`;
  }

  if (activity.metadata) {
    const meta = activity.metadata as Record<string, unknown>;
    if (meta.fileName) {
      text += ` "${meta.fileName}"`;
    }
    if (meta.userName) {
      text += ` ${meta.userName}`;
    }
    if (meta.subtaskTitle) {
      text += `: ${meta.subtaskTitle}`;
    }
  }

  return text;
}

// Obtener label amigable para campos
function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    title: "el título",
    description: "la descripción",
    importance: "la importancia",
    dueDate: "la fecha límite",
    sectionId: "la sección",
  };
  return labels[field] || field;
}

export function ActivitySection({ taskId }: ActivitySectionProps) {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Cargar actividad
  const loadActivity = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/activity`);
      if (!res.ok) {
        if (res.status === 500) {
          setHasError(true);
          return;
        }
        throw new Error("Error cargando actividad");
      }
      const data = await res.json();
      setActivities(data);
      setHasError(false);
    } catch (error) {
      console.error("Error cargando actividad:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 opacity-50" />
        </div>
        <p className="text-sm font-medium">Actividad no disponible</p>
        <p className="text-xs mt-1 text-center max-w-[250px]">
          El historial de actividad requiere configuración adicional en la base de datos.
        </p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 opacity-50" />
        </div>
        <p className="text-sm font-medium">No hay actividad registrada</p>
        <p className="text-xs mt-1">Los cambios aparecerán aquí</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4 -mr-4">
      <div className="relative">
        {/* Línea de tiempo */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {activities.map((activity, index) => {
            const config = activityConfig[activity.action] || activityConfig.updated;
            const Icon = config.icon;
            const avatarUrl = getAvatarUrl(activity.userAvatar, activity.userId);

            return (
              <div key={activity.id} className="relative flex gap-4 pl-2">
                {/* Icono de la actividad */}
                <div
                  className={cn(
                    "relative z-10 h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center shrink-0",
                    config.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="text-[10px]">
                        {activity.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName}</span>{" "}
                        <span className="text-muted-foreground">
                          {getActivityText(activity)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>

                      {/* Mostrar cambio de valor si aplica */}
                      {activity.oldValue && activity.newValue && (
                        <div className="mt-2 text-xs bg-muted rounded-lg p-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Antes:</span>
                            <span className="line-through">{activity.oldValue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Después:</span>
                            <span className="font-medium">{activity.newValue}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
