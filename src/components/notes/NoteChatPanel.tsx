"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2,
  Sparkles,
  Bot,
  User as UserIcon,
  Minimize2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface NoteChatPanelProps {
  noteId: string;
  noteContent: string;
  workspaceColor?: string;
}

export function NoteChatPanel({ noteId, noteContent, workspaceColor = "#8b5cf6" }: NoteChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al agregar mensajes
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/notes/${noteId}/ai-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ask",
          content: noteContent,
          query: input.trim(),
        }),
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.result,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      toast.error("Error al comunicarse con la IA");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Lo siento, hubo un error al procesar tu pregunta.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Botón flotante mejorado */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: workspaceColor }}
        className={cn(
          "fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-50 transition-all duration-300",
          "hover:scale-110 active:scale-95 hover:opacity-90",
          "border-4 border-white dark:border-gray-900",
          isOpen && "scale-95 rotate-90"
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="h-7 w-7 text-white" />
        ) : (
          <MessageCircle className="h-7 w-7 text-white" />
        )}
      </Button>

      {/* Panel de chat mejorado */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[480px] h-[680px] bg-background border-2 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
          style={{ borderColor: `${workspaceColor}33` }}
        >
          {/* Header minimalista */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div 
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: workspaceColor }}
              >
                <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">Asistente IA</h3>
                <p className="text-xs text-muted-foreground truncate">Pregunta sobre tu nota</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 sm:h-8 sm:w-8 p-0 rounded-lg hover:bg-accent active:scale-95 transition-transform"
              >
                <X className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          {/* Messages con mejor diseño */}
          <div className="flex-1 overflow-hidden" ref={scrollRef}>
            <ScrollArea className="h-full p-4">
              {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 rounded-2xl mb-4"
                  style={{ backgroundColor: `${workspaceColor}20` }}
                >
                  <Bot className="h-16 w-16" style={{ color: workspaceColor }} />
                </div>
                <p className="text-base font-semibold mb-2">
                  ¡Hola! 👋 Estoy aquí para ayudarte
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Hazme cualquier pregunta sobre el contenido de esta nota y te responderé al instante
                </p>
                <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-xs">
                  <div className="p-3 rounded-lg bg-muted/50 text-xs text-left">
                    <span className="font-semibold">💡 Ejemplo:</span> "¿Cuál es el tema principal?"
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-xs text-left">
                    <span className="font-semibold">💡 Ejemplo:</span> "Resume los puntos clave"
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                        style={{ backgroundColor: workspaceColor }}
                      >
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
                        msg.role === "user"
                          ? "text-white"
                          : "bg-muted border border-border/50"
                      )}
                      style={msg.role === "user" ? { backgroundColor: workspaceColor } : {}}
                    >
                      {msg.role === "assistant" ? (
                        <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg bg-blue-500">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
            </ScrollArea>
          </div>

          {/* Input - Touch optimized */}
          <div className="p-3 sm:p-4 border-t border-border bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                disabled={isLoading}
                className="flex-1 h-11 sm:h-10 text-base sm:text-sm"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="icon"
                style={{ backgroundColor: workspaceColor }}
                className="text-white hover:opacity-90 h-11 w-11 sm:h-10 sm:w-10 shrink-0 active:scale-95 transition-transform"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Send className="h-5 w-5 sm:h-4 sm:w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
