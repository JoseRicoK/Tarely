"use client";

import { useState } from "react";
import { Sparkles, FileText, ListChecks, Languages, Expand, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface NoteAIPanelProps {
  noteContent: string;
  onInsertText: (text: string) => void;
  onCreateTasks: (tasks: Array<{ title: string; description?: string; importance: number }>) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AI_ACTIONS = [
  { id: "summarize", label: "Resumir", icon: FileText, description: "Resumen conciso del contenido" },
  { id: "extract_tasks", label: "Extraer tareas", icon: ListChecks, description: "Detecta tareas accionables" },
  { id: "improve", label: "Mejorar", icon: Sparkles, description: "Mejora la redacción" },
  { id: "expand", label: "Expandir", icon: Expand, description: "Desarrolla con más detalle" },
  { id: "checklist", label: "Checklist", icon: ListChecks, description: "Convierte en checklist" },
  { id: "translate", label: "Traducir", icon: Languages, description: "Traduce ES↔EN" },
] as const;

export function NoteAIPanel({ noteContent, onInsertText, onCreateTasks, isOpen, onClose }: NoteAIPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"text" | "tasks">("text");
  const [tasks, setTasks] = useState<Array<{ title: string; description?: string; importance: number }>>([]);

  const handleAction = async (action: string) => {
    if (!noteContent.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/notes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteContent, action }),
      });

      if (!res.ok) throw new Error("Error al procesar con IA");

      const data = await res.json();
      if (data.type === "tasks" && Array.isArray(data.result)) {
        setTasks(data.result);
        setResultType("tasks");
        setResult(null);
      } else {
        setResult(data.result);
        setResultType("text");
        setTasks([]);
      }
    } catch (error) {
      console.error("AI error:", error);
      setResult("Error al procesar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-border/50 bg-background/50 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-ta)]" />
          <span className="font-semibold text-sm">Asistente IA</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Actions */}
          <div className="space-y-1.5">
            {AI_ACTIONS.map(action => (
              <button
                key={action.id}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                  "hover:bg-accent/50 text-sm",
                  loading && "opacity-50 pointer-events-none"
                )}
                onClick={() => handleAction(action.id)}
                disabled={loading}
              >
                <action.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-muted-foreground/70">{action.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando...
            </div>
          )}

          {/* Text result */}
          {result && resultType === "text" && (
            <div className="space-y-3">
              <Separator />
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Resultado
              </div>
              <div className="text-sm whitespace-pre-wrap bg-muted/30 rounded-lg p-3 border border-border/50">
                {result}
              </div>
              <Button
                size="sm"
                className="w-full text-xs"
                onClick={() => onInsertText(result)}
              >
                Insertar en la nota
              </Button>
            </div>
          )}

          {/* Tasks result */}
          {tasks.length > 0 && resultType === "tasks" && (
            <div className="space-y-3">
              <Separator />
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tareas detectadas ({tasks.length})
              </div>
              <div className="space-y-2">
                {tasks.map((task, i) => (
                  <div
                    key={i}
                    className="text-sm bg-muted/30 rounded-lg p-3 border border-border/50"
                  >
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-muted-foreground mt-1">{task.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      Importancia: {task.importance}/10
                    </div>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                className="w-full text-xs"
                onClick={() => onCreateTasks(tasks)}
              >
                Crear {tasks.length} tarea{tasks.length > 1 ? "s" : ""} en el workspace
              </Button>
            </div>
          )}

          {!noteContent.trim() && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Escribe algo en la nota para usar la IA
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
