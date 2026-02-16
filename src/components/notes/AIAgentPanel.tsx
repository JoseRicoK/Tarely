"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  FileText,
  Wand2,
  ListChecks,
  Expand,
  Loader2,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Editor } from "@tiptap/react";

interface AIAgentPanelProps {
  noteId: string;
  editor: Editor | null;
  noteContent: string;
}

type AIAction = "summarize" | "extract_tasks" | "improve" | "expand" | "checklist" | "translate";

const ACTION_LABELS: Record<AIAction, { label: string; icon: any; description: string }> = {
  summarize: {
    label: "Resumir",
    icon: FileText,
    description: "Resumen conciso del contenido",
  },
  extract_tasks: {
    label: "Extraer tareas",
    icon: ListChecks,
    description: "Detecta tareas accionables",
  },
  improve: {
    label: "Mejorar",
    icon: Wand2,
    description: "Mejora la redacción",
  },
  expand: {
    label: "Expandir",
    icon: Expand,
    description: "Desarrolla con más detalle",
  },
  checklist: {
    label: "Checklist",
    icon: ListChecks,
    description: "Convierte en checklist",
  },
  translate: {
    label: "Traducir",
    icon: Languages,
    description: "Traduce ES↔EN",
  },
};

export function AIAgentPanel({ noteId, editor, noteContent }: AIAgentPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = async (action: AIAction) => {
    if (!editor || !noteContent.trim()) {
      toast.error("No hay contenido para procesar");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/notes/${noteId}/ai-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          content: noteContent,
        }),
      });

      if (!response.ok) throw new Error();

      const data = await response.json();

      // Insertar al final de la nota sin borrar nada
      if (data.type === "modification" && data.result) {
        // Si es JSON TipTap, insertarlo directamente
        editor.chain().focus('end').insertContent(data.result).run();
        toast.success("Contenido añadido con IA");
      } else if (data.type === "text" && data.result) {
        // Si es texto plano, envolverlo en un párrafo
        editor.chain().focus('end').insertContent({
          type: 'paragraph',
          content: [{ type: 'text', text: data.result }]
        }).run();
        toast.success("Contenido añadido");
      }
    } catch (error) {
      console.error("Error al procesar con IA:", error);
      toast.error("Error al procesar la acción");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Procesando...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">Asistente IA</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-1">
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Asistente IA
            </p>
          </div>
          {(Object.entries(ACTION_LABELS) as [AIAction, typeof ACTION_LABELS[AIAction]][]).map(
            ([action, { label, icon: Icon, description }]) => (
              <button
                key={action}
                onClick={() => {
                  handleAction(action);
                  setIsOpen(false);
                }}
                disabled={isLoading}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md",
                  "text-left transition-colors",
                  "hover:bg-accent",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {description}
                  </div>
                </div>
              </button>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
