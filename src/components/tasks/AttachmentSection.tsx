"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Paperclip,
  Upload,
  Image as ImageIcon,
  FileText,
  File as FileIcon,
  Trash2,
  Download,
  Loader2,
  X,
  ZoomIn,
  Clipboard,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { TaskAttachment } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AttachmentSectionProps {
  taskId: string;
  currentUserId: string;
}

export function AttachmentSection({ taskId, currentUserId }: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<TaskAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Cargar attachments
  const loadAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`);
      if (!res.ok) {
        if (res.status === 500) {
          setHasError(true);
          return;
        }
        throw new Error("Error cargando archivos");
      }
      const data = await res.json();
      setAttachments(data);
      setHasError(false);
    } catch (error) {
      console.error("Error cargando archivos:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  // Subir archivo
  const uploadFile = async (file: File) => {
    // Validar tamaño
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande (máximo 10MB)");
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Subiendo ${file.name}...`);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error subiendo archivo");
      }

      const attachment = await res.json();
      setAttachments((prev) => [attachment, ...prev]);
      toast.success("Archivo subido correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error subiendo archivo");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Eliminar archivo
  const handleDelete = async (attachmentId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    try {
      const res = await fetch(
        `/api/tasks/${taskId}/attachments?attachmentId=${attachmentId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Error eliminando archivo");

      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast.success("Archivo eliminado");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error eliminando archivo");
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(uploadFile);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Manejar drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      Array.from(files).forEach(uploadFile);
    }
  };

  // Manejar pegado de imágenes (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Solo procesar si el foco está en esta sección
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            // Crear nombre único para la imagen pegada
            const timestamp = Date.now();
            const extension = file.type.split("/")[1] || "png";
            const newFile = new File([file], `captura_${timestamp}.${extension}`, {
              type: file.type,
            });
            uploadFile(newFile);
            toast.info("Imagen pegada desde el portapapeles");
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [taskId]);

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Obtener icono según tipo de archivo
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return <ImageIcon className="h-5 w-5" />;
      case "document":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileIcon className="h-5 w-5" />;
    }
  };

  // Separar imágenes de otros archivos
  const images = attachments.filter((a) => a.fileType === "image");
  const documents = attachments.filter((a) => a.fileType !== "image");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Paperclip className="h-8 w-8 opacity-50" />
        </div>
        <p className="text-sm font-medium">Archivos no disponibles</p>
        <p className="text-xs mt-1 text-center max-w-[250px]">
          El sistema de archivos requiere configuración adicional en la base de datos.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            setHasError(false);
            setIsLoading(true);
            loadAttachments();
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Zona de drop / upload */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{uploadProgress}</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-4 mb-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Clipboard className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <p className="text-sm font-medium mb-1">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground">
              También puedes pegar imágenes con <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+V</kbd>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Máximo 10MB por archivo • Imágenes, PDFs, documentos
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          multiple
        />
      </div>

      {/* Galería de imágenes */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Imágenes ({images.length})</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((attachment) => {
              const avatarUrl = attachment.userAvatar?.startsWith("http")
                ? attachment.userAvatar
                : `${supabaseUrl}/storage/v1/object/public/avatars/${attachment.userAvatar}`;
              const isOwner = attachment.userId === currentUserId;

              return (
                <div
                  key={attachment.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => setPreviewImage(attachment)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachment.url || ""}
                    alt={attachment.fileName}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay con acciones */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(attachment);
                            }}
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(attachment.url, "_blank");
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Descargar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {isOwner && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-8 w-8"
                              onClick={(e) => handleDelete(attachment.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  {/* Info del uploader */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="text-[8px]">
                          {attachment.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-white truncate">
                        {formatDistanceToNow(new Date(attachment.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      {documents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Documentos ({documents.length})</h4>
          </div>
          <div className="space-y-2">
            {documents.map((attachment) => {
              const avatarUrl = attachment.userAvatar?.startsWith("http")
                ? attachment.userAvatar
                : `${supabaseUrl}/storage/v1/object/public/avatars/${attachment.userAvatar}`;
              const isOwner = attachment.userId === currentUserId;

              return (
                <div
                  key={attachment.id}
                  className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {getFileIcon(attachment.fileType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(attachment.fileSize)}</span>
                      <span>•</span>
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="text-[8px]">
                          {attachment.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{attachment.userName}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(attachment.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => window.open(attachment.url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Abrir</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            asChild
                          >
                            <a href={attachment.url} download={attachment.fileName}>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Descargar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {isOwner && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(attachment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {attachments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Paperclip className="h-8 w-8 opacity-50" />
          </div>
          <p className="text-sm font-medium">No hay archivos adjuntos</p>
          <p className="text-xs mt-1">Arrastra archivos o pega capturas de pantalla</p>
        </div>
      )}

      {/* Preview de imagen */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="truncate">{previewImage?.fileName}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full max-h-[70vh] p-4">
            {previewImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewImage.url || ""}
                alt={previewImage.fileName}
                className="w-full h-full object-contain rounded-lg"
              />
            )}
          </div>
          <div className="p-4 pt-0 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {previewImage && (
                <>
                  {formatFileSize(previewImage.fileSize)} • Subido por {previewImage.userName}
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => previewImage && window.open(previewImage.url, "_blank")}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button variant="ghost" onClick={() => setPreviewImage(null)}>
                <X className="h-4 w-4 mr-2" />
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
