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
import { useTranslations } from "next-intl";

interface AIAgentPanelProps {
  noteId: string;
  editor: Editor | null;
  noteContent: string;
}

type AIAction = "summarize" | "extract_tasks" | "improve" | "expand" | "checklist" | "translate";

const ACTION_ICONS: Record<AIAction, any> = {
  summarize: FileText,
  extract_tasks: ListChecks,
  improve: Wand2,
  expand: Expand,
  checklist: ListChecks,
  translate: Languages,
};

export function AIAgentPanel({ noteId, editor, noteContent }: AIAgentPanelProps) {
  const t = useTranslations('aiAgent');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = async (action: AIAction) => {
    if (!editor || !noteContent.trim()) {
      toast.error(t('noContent'));
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
        toast.success(t('contentAdded'));
      } else if (data.type === "text" && data.result) {
        // Si es texto plano, envolverlo en un párrafo
        editor.chain().focus('end').insertContent({
          type: 'paragraph',
          content: [{ type: 'text', text: data.result }]
        }).run();
        toast.success(t('contentAdded'));
      }
    } catch (error) {
      console.error("Error al procesar con IA:", error);
      toast.error(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const getActionLabel = (action: AIAction) => {
    const labels: Record<AIAction, string> = {
      summarize: t('summarize'),
      extract_tasks: t('extractTasks'),
      improve: t('improve'),
      expand: t('expand'),
      checklist: t('checklist'),
      translate: t('translate'),
    };
    return labels[action];
  };

  const getActionDesc = (action: AIAction) => {
    const descs: Record<AIAction, string> = {
      summarize: t('summarizeDesc'),
      extract_tasks: t('extractTasksDesc'),
      improve: t('improveDesc'),
      expand: t('expandDesc'),
      checklist: t('checklistDesc'),
      translate: t('translateDesc'),
    };
    return descs[action];
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
                <span className="text-sm">{t('processing')}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">IA</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-1">
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              IA
            </p>
          </div>
          {(Object.keys(ACTION_ICONS) as AIAction[]).map((action) => {
            const Icon = ACTION_ICONS[action];
            const label = getActionLabel(action);
            const description = getActionDesc(action);
            return (
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
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
