"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import type { Workspace } from "@/lib/types";

interface InstructionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
  onSave: (instructions: string) => Promise<void>;
}

export function InstructionsSheet({
  open,
  onOpenChange,
  workspace,
  onSave,
}: InstructionsSheetProps) {
  const [instructions, setInstructions] = useState(workspace.instructions);
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar cuando cambia el workspace o se abre el sheet
  useEffect(() => {
    if (open) {
      setInstructions(workspace.instructions);
    }
  }, [open, workspace.instructions]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(instructions);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = instructions !== workspace.instructions;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col h-full p-6">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Instrucciones del Workspace</SheetTitle>
          <SheetDescription>
            Estas instrucciones se usarán como contexto para la IA al generar
            tareas. Incluye información sobre el stack, convenciones,
            prioridades del proyecto, etc.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex-1 flex flex-col min-h-0 overflow-hidden">
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Escribe aquí las instrucciones detalladas para la IA..."
            className="flex-1 min-h-0 resize-none overflow-y-auto"
          />
        </div>
        <div className="flex-shrink-0 pt-4 pb-4 flex justify-end gap-3 border-t mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setInstructions(workspace.instructions);
              onOpenChange(false);
            }}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
