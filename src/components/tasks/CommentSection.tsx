"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
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
import { cn } from "@/lib/utils";

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

  // Auto-scroll al final cuando hay nuevos comentarios
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

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
    <div className="flex flex-col h-full">
      {/* Lista de comentarios */}
      <ScrollArea className="flex-1 pr-4 -mr-4 max-h-[400px]" ref={scrollRef}>
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
              const avatarUrl = comment.userAvatar?.startsWith("http")
                ? comment.userAvatar
                : `${supabaseUrl}/storage/v1/object/public/avatars/${comment.userAvatar}`;
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
                        <p className="text-sm whitespace-pre-wrap break-words flex-1 bg-muted/50 rounded-lg px-3 py-2">
                          {comment.content}
                        </p>
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

      {/* Input para nuevo comentario */}
      <div className="pt-4 border-t mt-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none pr-10"
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
        <p className="text-xs text-muted-foreground mt-2">
          Presiona <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Enter</kbd> para enviar, <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Shift+Enter</kbd> para nueva línea
        </p>
      </div>
    </div>
  );
}
