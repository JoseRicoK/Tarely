"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

interface ImportancePickerProps {
  value: number;
  onChange: (importance: number) => void;
  compact?: boolean;
  disabled?: boolean;
}

function getImportanceColor(importance: number): string {
  if (importance >= 9) return "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20";
  if (importance >= 7) return "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20";
  if (importance >= 5) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20";
  if (importance >= 3) return "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20";
  return "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20";
}

function getImportanceDotColor(importance: number): string {
  if (importance >= 9) return "bg-red-500";
  if (importance >= 7) return "bg-orange-500";
  if (importance >= 5) return "bg-yellow-500";
  if (importance >= 3) return "bg-blue-500";
  return "bg-slate-400";
}

function getImportanceLabel(importance: number): string {
  if (importance >= 9) return "Crítica";
  if (importance >= 7) return "Alta";
  if (importance >= 5) return "Media";
  if (importance >= 3) return "Baja";
  return "Muy baja";
}

const IMPORTANCE_OPTIONS = [
  { value: 10, label: "10 - Crítica máxima", description: "Emergencia absoluta" },
  { value: 9, label: "9 - Crítica", description: "Producción rota" },
  { value: 8, label: "8 - Muy urgente", description: "Bloquea trabajo" },
  { value: 7, label: "7 - Urgente", description: "Necesita atención pronta" },
  { value: 6, label: "6 - Importante", description: "Debe hacerse pronto" },
  { value: 5, label: "5 - Media", description: "Prioridad normal" },
  { value: 4, label: "4 - Baja-media", description: "Puede esperar un poco" },
  { value: 3, label: "3 - Baja", description: "Sin urgencia" },
  { value: 2, label: "2 - Muy baja", description: "Cuando haya tiempo" },
  { value: 1, label: "1 - Mínima", description: "Nice to have" },
];

export function ImportancePicker({
  value,
  onChange,
  compact = false,
  disabled = false,
}: ImportancePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelect = async (newValue: number) => {
    if (newValue === value) {
      setIsOpen(false);
      return;
    }
    
    setIsUpdating(true);
    try {
      await onChange(newValue);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  const importanceColor = getImportanceColor(value);
  const importanceLabel = getImportanceLabel(value);

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs cursor-pointer transition-all",
                    importanceColor,
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  {value}/10 · {importanceLabel}
                </Badge>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cambiar importancia</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent className="w-56 p-0 bg-background/95 backdrop-blur-xl border-white/10" align="start">
          <div className="py-1 max-h-64 overflow-y-auto">
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-white/10 mb-1">
              Seleccionar importancia
            </div>
            {IMPORTANCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                disabled={isUpdating}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  "hover:bg-white/5",
                  value === option.value && "bg-white/10"
                )}
              >
                <div className={cn("w-2.5 h-2.5 rounded-full", getImportanceDotColor(option.value))} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{option.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{option.description}</div>
                </div>
                {value === option.value && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Versión no compacta para TaskDialog
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start gap-2",
            importanceColor,
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <div className={cn("w-3 h-3 rounded-full", getImportanceDotColor(value))} />
          {value}/10 - {importanceLabel}
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-background/95 backdrop-blur-xl border-white/10" align="start">
        <div className="py-1 max-h-80 overflow-y-auto">
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-white/10 mb-1">
            Seleccionar importancia
          </div>
          {IMPORTANCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              disabled={isUpdating}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                "hover:bg-white/5",
                value === option.value && "bg-white/10"
              )}
            >
              <div className={cn("w-3 h-3 rounded-full shrink-0", getImportanceDotColor(option.value))} />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
              {value === option.value && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
