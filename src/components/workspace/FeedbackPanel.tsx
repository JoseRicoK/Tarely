"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, MessageSquare, Bug, Lightbulb, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackType = "suggestion" | "bug";

export function FeedbackPanel() {
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Por favor, escribe un mensaje");
      return;
    }

    if (message.length > 1000) {
      toast.error("El mensaje no puede exceder 1000 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al enviar feedback");
      }

      toast.success(
        type === "suggestion" 
          ? "¡Gracias por tu sugerencia! La revisaremos pronto." 
          : "¡Gracias por reportar el error! Lo investigaremos."
      );
      
      setMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al enviar feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = message.length;
  const charLimit = 1000;
  const isNearLimit = charCount > charLimit * 0.9;
  const isOverLimit = charCount > charLimit;

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-blue-400" />
          Sugerencias y Errores
        </CardTitle>
        <CardDescription>
          Ayúdanos a mejorar reportando errores o compartiendo tus ideas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de tipo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de feedback</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType("suggestion")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                  type === "suggestion"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:bg-white/10"
                )}
              >
                <Lightbulb className="h-4 w-4" />
                <span className="font-medium">Sugerencia</span>
              </button>
              
              <button
                type="button"
                onClick={() => setType("bug")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                  type === "bug"
                    ? "border-orange-500 bg-orange-500/10 text-orange-400"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:bg-white/10"
                )}
              >
                <Bug className="h-4 w-4" />
                <span className="font-medium">Error</span>
              </button>
            </div>
          </div>

          {/* Área de texto */}
          <div className="space-y-2">
            <Label htmlFor="feedback-message" className="text-sm font-medium">
              {type === "suggestion" ? "Tu sugerencia" : "Describe el error"}
            </Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === "suggestion"
                  ? "Me gustaría que la aplicación tuviera..."
                  : "He encontrado un error cuando..."
              }
              className={cn(
                "min-h-[120px] resize-none bg-white/5 border-white/10 focus:border-blue-500/50",
                isOverLimit && "border-red-500/50 focus:border-red-500"
              )}
              maxLength={1050} // Permitir un poco más para no cortar abruptamente
            />
            
            {/* Contador de caracteres */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {type === "suggestion" 
                  ? "Comparte tus ideas para mejorar la aplicación" 
                  : "Describe qué sucedió y cómo reproducirlo"}
              </span>
              <span className={cn(
                "font-medium",
                isOverLimit ? "text-red-500" : isNearLimit ? "text-orange-500" : "text-muted-foreground"
              )}>
                {charCount}/{charLimit}
              </span>
            </div>
          </div>

          {/* Botón de envío */}
          <Button
            type="submit"
            disabled={isSubmitting || !message.trim() || isOverLimit}
            className={cn(
              "w-full h-11 text-white shadow-lg transition-all hover:scale-[1.02]",
              type === "suggestion"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20 hover:shadow-blue-500/30"
                : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-500/20 hover:shadow-orange-500/30"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar {type === "suggestion" ? "sugerencia" : "reporte"}
              </>
            )}
          </Button>
        </form>

        {/* Mensaje informativo */}
        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-muted-foreground">
            💡 Tu feedback nos ayuda a mejorar. Revisamos todos los mensajes y tu información 
            de usuario se guarda automáticamente para poder contactarte si es necesario.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
