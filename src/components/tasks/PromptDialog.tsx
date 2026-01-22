"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: string;
  taskTitle: string;
  isLoading?: boolean;
}

export function PromptDialog({
  open,
  onOpenChange,
  prompt,
  taskTitle,
  isLoading = false,
}: PromptDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Prompt copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Error al copiar el prompt");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Prompt para IDE
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            Prompt generado con IA para: {taskTitle}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] rounded-md border bg-muted/50 p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generando prompt con IA...</p>
            </div>
          ) : (
            <pre className="text-sm whitespace-pre-wrap font-mono">{prompt}</pre>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handleCopy} disabled={isLoading || !prompt}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar al portapapeles
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
