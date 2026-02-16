"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Send, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Loader2,
  MessageCircle,
  Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { TaskComment } from "@/lib/types";
import { getAvatarUrl } from "@/lib/utils";

interface CommentSectionProps {
  taskId: string;
  currentUserId: string;
}

export function CommentSection({ taskId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cargar comentarios
  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (!res.ok) {
        // Si es un 500, probablemente la tabla no existe aún
        if (res.status === 500) {
          setHasError(true);
          return;
        }
        throw new Error("Error cargando comentarios");
      }
      const data = await res.json();
      setComments(data);
      setHasError(false);
    } catch (error) {
      console.error("Error cargando comentarios:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Auto-scroll al final cuando hay nuevos comentarios o cuando se cargan
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [comments, isLoading]);

  // Enviar comentario
  const handleSend = async () => {
    if (!newComment.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (!res.ok) throw new Error("Error enviando comentario");

      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      
      // Focus back to textarea
      textareaRef.current?.focus();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error enviando comentario");
    } finally {
      setIsSending(false);
    }
  };

  // Editar comentario
  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, content: editContent }),
      });

      if (!res.ok) throw new Error("Error editando comentario");

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content: editContent, updatedAt: new Date().toISOString() }
            : c
        )
      );
      setEditingId(null);
      setEditContent("");
      toast.success("Comentario actualizado");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error editando comentario");
    }
  };

  // Eliminar comentario
  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error eliminando comentario");

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comentario eliminado");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error eliminando comentario");
    }
  };

  // Manejar Enter para enviar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Mostrar mensaje de error si la tabla no existe
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 opacity-50" />
        </div>
        <p className="text-sm font-medium">Comentarios no disponibles</p>
        <p className="text-xs mt-1 text-center max-w-[250px]">
          El sistema de comentarios requiere configuración adicional en la base de datos.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            setHasError(false);
            setIsLoading(true);
            loadComments();
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Lista de comentarios - Scrolleable independiente */}
      <ScrollArea className="pr-4 -mr-4 h-[300px] md:h-[400px]" ref={scrollRef}>
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 opacity-50" />
            </div>
            <p className="text-sm font-medium">No hay comentarios aún</p>
            <p className="text-xs mt-1">Sé el primero en comentar</p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {comments.map((comment) => {
              const avatarUrl = getAvatarUrl(comment.userAvatar, comment.userId);
              const isOwner = comment.userId === currentUserId;
              const wasEdited = comment.createdAt !== comment.updatedAt;

              return (
                <div key={comment.id} className="group flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={avatarUrl} alt={comment.userName} />
                    <AvatarFallback className="text-xs">
                      {comment.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {comment.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                      {wasEdited && (
                        <span className="text-xs text-muted-foreground">(editado)</span>
                      )}
                    </div>

                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[60px] text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleEdit(comment.id)}>
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(null);
                              setEditContent("");
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="text-sm flex-1 bg-muted/50 rounded-lg px-3 py-2 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              img: (props) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  {...props}
                                  alt={props.alt || ""}
                                  className="max-w-full h-auto rounded-lg my-2 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => {
                                    if (typeof props.src === 'string') {
                                      window.open(props.src, "_blank");
                                    }
                                  }}
                                />
                              ),
                              ul: (props) => (
                                <ul className="list-disc list-inside space-y-1" {...props} />
                              ),
                              ol: (props) => (
                                <ol className="list-decimal list-inside space-y-1" {...props} />
                              ),
                              a: (props) => (
                                <a
                                  {...props}
                                  className="text-primary hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                />
                              ),
                            }}
                          >
                            {comment.content}
                          </ReactMarkdown>
                        </div>
                        {isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingId(comment.id);
                                  setEditContent(comment.content);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(comment.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input para nuevo comentario - Siempre visible */}
      <div className="pt-4 border-t sticky bottom-0 bg-background">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] md:min-h-[80px] resize-none pr-10 text-sm"
              disabled={isSending}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 bottom-1 h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newComment.trim() || isSending}
            className="h-10 w-10 shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 hidden md:block">
          Soporta Markdown: <code className="px-1 py-0.5 bg-muted rounded">**negrita**</code>, <code className="px-1 py-0.5 bg-muted rounded">- listas</code>, <code className="px-1 py-0.5 bg-muted rounded">![](url)</code> para imágenes
        </p>
      </div>
    </div>
  );
}
