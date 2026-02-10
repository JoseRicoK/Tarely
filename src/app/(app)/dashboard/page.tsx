"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/components/auth/UserContext";
import { redirect } from "next/navigation";
import {
  MessageSquare,
  Bug,
  Clock,
  CheckCircle2,
  Eye,
  Trash2,
  Filter,
  Loader2,
  FileText,
  Plus,
  Calendar,
  Tag,
  Image as ImageIcon,
  X,
  ChevronDown,
  ChevronUp,
  Shield,
  Upload,
  Pencil,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// ==================== TYPES ====================

interface FeedbackItem {
  id: string;
  user_id: string;
  type: "suggestion" | "bug";
  message: string;
  created_at: string;
  status: "pending" | "reviewed" | "resolved";
  user_email: string;
  user_name: string;
}

interface ChangelogFormSection {
  title: string;
  image_file: File | null;
  image_preview: string;
  image_path: string;
  items: string[];
}

interface ChangelogEntry {
  id?: string;
  version: string;
  date: string;
  changelog_sections: {
    id?: string;
    title: string;
    image_url?: string | null;
    changelog_items: { id?: string; content: string }[];
  }[];
}

function getChangelogImageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/changelog/${path}`;
}

// ==================== FEEDBACK PANEL ====================

function FeedbackPanel() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "suggestion" | "bug">("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "resolved">("active");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/feedback");
      if (!res.ok) throw new Error("Error al cargar feedback");
      const data = await res.json();
      setFeedback(data);
    } catch {
      toast.error("Error al cargar el feedback");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      setFeedback((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: newStatus as FeedbackItem["status"] } : f))
      );
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar el estado");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este feedback?")) return;
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setFeedback((prev) => prev.filter((f) => f.id !== id));
      toast.success("Feedback eliminado");
    } catch {
      toast.error("Error al eliminar el feedback");
    }
  };

  const filtered = feedback.filter((f) => {
    const typeMatch = filter === "all" || f.type === filter;
    const statusMatch =
      statusFilter === "active"
        ? f.status !== "resolved"
        : f.status === "resolved";
    return typeMatch && statusMatch;
  });

  const counts = {
    total: feedback.length,
    pending: feedback.filter((f) => f.status === "pending").length,
    reviewed: feedback.filter((f) => f.status === "reviewed").length,
    resolved: feedback.filter((f) => f.status === "resolved").length,
    suggestions: feedback.filter((f) => f.type === "suggestion").length,
    bugs: feedback.filter((f) => f.type === "bug").length,
  };

  const statusConfig = {
    pending: { label: "Pendiente", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
    reviewed: { label: "Revisado", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Eye },
    resolved: { label: "Resuelto", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: counts.total, color: "from-purple-500/20 to-purple-500/5", textColor: "text-purple-400" },
          { label: "Pendientes", value: counts.pending, color: "from-amber-500/20 to-amber-500/5", textColor: "text-amber-400" },
          { label: "Revisados", value: counts.reviewed, color: "from-blue-500/20 to-blue-500/5", textColor: "text-blue-400" },
          { label: "Resueltos", value: counts.resolved, color: "from-emerald-500/20 to-emerald-500/5", textColor: "text-emerald-400" },
          { label: "Sugerencias", value: counts.suggestions, color: "from-indigo-500/20 to-indigo-500/5", textColor: "text-indigo-400" },
          { label: "Errores", value: counts.bugs, color: "from-red-500/20 to-red-500/5", textColor: "text-red-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-gradient-to-b ${stat.color} rounded-xl border border-white/5 p-4 text-center`}
          >
            <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filtrar:</span>
        </div>

        {/* Type filter */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(["all", "suggestion", "bug"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === type
                  ? "bg-white/10 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {type === "all" ? "Todos" : type === "suggestion" ? "Sugerencias" : "Errores"}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(["active", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-white/10 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "active" ? "Activos" : "Resueltos"}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay feedback {statusFilter === "resolved" ? "resuelto" : "activo"} con estos filtros</p>
          </div>
        ) : (
          filtered.map((item) => {
            const config = statusConfig[item.status];
            const StatusIcon = config.icon;
            return (
              <div
                key={item.id}
                className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.type === "suggestion"
                        ? "bg-indigo-500/15 text-indigo-400"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {item.type === "suggestion" ? (
                      <MessageSquare className="h-5 w-5" />
                    ) : (
                      <Bug className="h-5 w-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-foreground">
                        {item.user_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.user_email}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${config.color} border`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          item.type === "suggestion"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                      >
                        {item.type === "suggestion" ? "Sugerencia" : "Error"}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {item.message}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {new Date(item.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.status === "pending" && (
                      <button
                        onClick={() => updateStatus(item.id, "reviewed")}
                        disabled={updatingId === item.id}
                        className="p-2 rounded-lg hover:bg-blue-500/15 text-muted-foreground hover:text-blue-400 transition-colors"
                        title="Marcar como revisado"
                      >
                        {updatingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    {item.status !== "resolved" && (
                      <button
                        onClick={() => updateStatus(item.id, "resolved")}
                        disabled={updatingId === item.id}
                        className="p-2 rounded-lg hover:bg-emerald-500/15 text-muted-foreground hover:text-emerald-400 transition-colors"
                        title="Marcar como resuelto"
                      >
                        {updatingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    {item.status === "resolved" && (
                      <button
                        onClick={() => updateStatus(item.id, "pending")}
                        disabled={updatingId === item.id}
                        className="p-2 rounded-lg hover:bg-amber-500/15 text-muted-foreground hover:text-amber-400 transition-colors"
                        title="Reabrir"
                      >
                        {updatingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => deleteFeedback(item.id)}
                      className="p-2 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==================== IMAGE UPLOAD COMPONENT ====================

function ImageUpload({
  currentPath,
  preview,
  onUpload,
  onRemove,
}: {
  currentPath: string;
  preview: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const displayUrl = preview || (currentPath ? getChangelogImageUrl(currentPath) : "");

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no puede superar 10MB");
      return;
    }
    onUpload(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ImageIcon className="h-3.5 w-3.5" />
        Imagen (opcional)
      </label>
      {displayUrl ? (
        <div className="relative group/img rounded-lg overflow-hidden border border-white/10 max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt="Preview" className="w-full h-auto max-h-48 object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 text-white transition-colors"
              title="Cambiar imagen"
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-2 bg-red-500/30 rounded-lg hover:bg-red-500/50 text-white transition-colors"
              title="Eliminar imagen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragOver
              ? "border-purple-500/50 bg-purple-500/10"
              : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
          }`}
        >
          <Upload className="h-6 w-6 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground/70">Arrastra una imagen o haz clic para seleccionar</p>
          <p className="text-[10px] text-muted-foreground/40">JPG, PNG, WebP, GIF · Máx 10MB</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        title="Seleccionar imagen"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ==================== CHANGELOG FORM ====================

function ChangelogForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ChangelogEntry | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [version, setVersion] = useState(initial?.version || "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().split("T")[0]);
  const [sections, setSections] = useState<ChangelogFormSection[]>(() => {
    if (initial?.changelog_sections?.length) {
      return initial.changelog_sections.map((s) => ({
        title: s.title,
        image_file: null,
        image_preview: "",
        image_path: s.image_url || "",
        items: s.changelog_items?.length ? s.changelog_items.map((i) => i.content) : [""],
      }));
    }
    return [{ title: "", image_file: null, image_preview: "", image_path: "", items: [""] }];
  });
  const [submitting, setSubmitting] = useState(false);

  const addSection = () => {
    setSections([...sections, { title: "", image_file: null, image_preview: "", image_path: "", items: [""] }]);
  };

  const removeSection = (idx: number) => {
    const s = [...sections];
    if (s[idx].image_preview) URL.revokeObjectURL(s[idx].image_preview);
    setSections(s.filter((_, i) => i !== idx));
  };

  const updateSectionTitle = (idx: number, value: string) => {
    const s = [...sections];
    s[idx] = { ...s[idx], title: value };
    setSections(s);
  };

  const handleImageUpload = (idx: number, file: File) => {
    const s = [...sections];
    if (s[idx].image_preview) URL.revokeObjectURL(s[idx].image_preview);
    s[idx] = { ...s[idx], image_file: file, image_preview: URL.createObjectURL(file) };
    setSections(s);
  };

  const handleImageRemove = (idx: number) => {
    const s = [...sections];
    if (s[idx].image_preview) URL.revokeObjectURL(s[idx].image_preview);
    s[idx] = { ...s[idx], image_file: null, image_preview: "", image_path: "" };
    setSections(s);
  };

  const addItem = (sIdx: number) => {
    const s = [...sections];
    s[sIdx].items.push("");
    setSections(s);
  };

  const removeItem = (sIdx: number, iIdx: number) => {
    const s = [...sections];
    s[sIdx].items = s[sIdx].items.filter((_, i) => i !== iIdx);
    setSections(s);
  };

  const updateItem = (sIdx: number, iIdx: number, value: string) => {
    const s = [...sections];
    s[sIdx].items[iIdx] = value;
    setSections(s);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/admin/changelog/upload-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al subir imagen");
      }
      const data = await res.json();
      return data.image_path;
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Error al subir la imagen");
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!version.trim() || !date) {
      toast.error("Versión y fecha son obligatorios");
      return;
    }
    const validSections = sections.filter((s) => s.title.trim());
    if (validSections.length === 0) {
      toast.error("Añade al menos una sección con título");
      return;
    }

    setSubmitting(true);
    try {
      const sectionData: { title: string; image_url: string | null; items: string[] }[] = [];

      for (const section of validSections) {
        let imagePath = section.image_path || null;
        if (section.image_file) {
          const uploaded = await uploadImage(section.image_file);
          if (uploaded) imagePath = uploaded;
        }
        sectionData.push({
          title: section.title.trim(),
          image_url: imagePath,
          items: section.items.filter((i) => i.trim()),
        });
      }

      const url = isEdit ? `/api/admin/changelog/${initial!.id}` : "/api/admin/changelog";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: version.trim(), date, sections: sectionData }),
      });

      if (!res.ok) throw new Error("Error al guardar");
      toast.success(isEdit ? "Changelog actualizado" : "Changelog creado");
      onSave();
    } catch {
      toast.error("Error al guardar el changelog");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-5">
      <h3 className="text-lg font-semibold text-foreground">
        {isEdit ? "Editar entrada" : "Nueva entrada de changelog"}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4" />
            Versión
          </label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.0"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            title="Fecha del changelog"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Secciones</label>
          <button onClick={addSection} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
            <Plus className="h-3 w-3" />
            Añadir sección
          </button>
        </div>

        {sections.map((section, sIdx) => (
          <div key={sIdx} className="bg-white/[0.02] border border-white/5 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Sección {sIdx + 1}</span>
              {sections.length > 1 && (
                <button onClick={() => removeSection(sIdx)} className="text-red-400/70 hover:text-red-400 transition-colors" title="Eliminar sección">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <input
              type="text"
              value={section.title}
              onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
              placeholder="Título de la sección (ej: Bug Fixes and Improvements)"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />

            <ImageUpload
              currentPath={section.image_path}
              preview={section.image_preview}
              onUpload={(file) => handleImageUpload(sIdx, file)}
              onRemove={() => handleImageRemove(sIdx)}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Items</span>
                <button onClick={() => addItem(sIdx)} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
                  <Plus className="h-3 w-3" />
                  Añadir item
                </button>
              </div>
              {section.items.map((item, iIdx) => (
                <div key={iIdx} className="flex items-center gap-2">
                  <span className="text-muted-foreground/40 text-xs">•</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateItem(sIdx, iIdx, e.target.value)}
                    placeholder="Descripción del cambio..."
                    className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  {section.items.length > 1 && (
                    <button onClick={() => removeItem(sIdx, iIdx)} className="text-red-400/50 hover:text-red-400" title="Eliminar item">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEdit ? (
            <Save className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {isEdit ? "Guardar cambios" : "Publicar entrada"}
        </button>
      </div>
    </div>
  );
}

// ==================== CHANGELOG PANEL ====================

function ChangelogPanel() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChangelogEntry | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const fetchChangelog = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/changelog");
      if (!res.ok) throw new Error("Error al cargar changelog");
      const data = await res.json();
      setEntries(data);
    } catch {
      toast.error("Error al cargar el changelog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChangelog();
  }, [fetchChangelog]);

  const toggleExpand = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta entrada del changelog?")) return;
    try {
      const res = await fetch(`/api/admin/changelog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Entrada eliminada");
    } catch {
      toast.error("Error al eliminar la entrada");
    }
  };

  const startEdit = (entry: ChangelogEntry) => {
    setEditingEntry(entry);
    setShowForm(false);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingEntry(null);
    fetchChangelog();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEntry(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {entries.length} entrada{entries.length !== 1 ? "s" : ""} en el changelog
        </p>
        {!editingEntry && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancelar" : "Nueva entrada"}
          </button>
        )}
      </div>

      {/* Forms */}
      {showForm && !editingEntry && (
        <ChangelogForm onSave={handleFormSave} onCancel={handleFormCancel} />
      )}
      {editingEntry && (
        <ChangelogForm initial={editingEntry} onSave={handleFormSave} onCancel={handleFormCancel} />
      )}

      {/* Entries list */}
      <div className="space-y-4">
        {entries.length === 0 && !showForm ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay entradas de changelog todavía</p>
            <p className="text-xs mt-1 text-muted-foreground/60">
              Crea la primera entrada con el botón &quot;Nueva entrada&quot;
            </p>
          </div>
        ) : (
          entries.map((entry) => {
            const isExpanded = expandedEntries.has(entry.id!);
            const isBeingEdited = editingEntry?.id === entry.id;
            return (
              <div
                key={entry.id}
                className={`bg-white/[0.03] border rounded-xl transition-all overflow-hidden ${
                  isBeingEdited ? "border-purple-500/30 bg-purple-500/5" : "border-white/5 hover:border-white/10"
                }`}
              >
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer select-none"
                  onClick={() => toggleExpand(entry.id!)}
                >
                  <div className="shrink-0">
                    <Badge variant="outline" className="bg-purple-500/15 text-purple-400 border-purple-500/30 font-mono text-xs">
                      {entry.version}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString("es-ES", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-0.5">
                      {entry.changelog_sections?.length || 0} sección
                      {(entry.changelog_sections?.length || 0) !== 1 ? "es" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(entry); }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                      title="Editar entrada"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id!); }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Eliminar entrada"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
                    {entry.changelog_sections?.map((section, sIdx) => (
                      <div key={sIdx} className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                        {section.image_url && (
                          <div className="rounded-lg overflow-hidden border border-white/10 max-w-2xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getChangelogImageUrl(section.image_url)}
                              alt={section.title}
                              className="w-full h-auto"
                            />
                          </div>
                        )}
                        <ul className="space-y-1 ml-4">
                          {section.changelog_items?.map((item, iIdx) => (
                            <li key={iIdx} className="text-sm text-foreground/70 flex items-start gap-2">
                              <span className="text-muted-foreground/50 mt-1.5">•</span>
                              {item.content}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==================== MAIN DASHBOARD ====================

export default function DashboardPage() {
  const { profile, isLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!profile) {
        setChecking(false);
        return;
      }
      try {
        // Verify admin access by calling admin API
        const res = await fetch("/api/admin/feedback");
        if (res.ok) {
          setIsAdmin(true);
        }
      } catch {
        // Not admin
      } finally {
        setChecking(false);
      }
    }

    if (!isLoading) {
      checkAdmin();
    }
  }, [profile, isLoading]);

  if (isLoading || checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
        <p className="text-sm text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  if (!profile || !isAdmin) {
    redirect("/app");
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Panel de Administración
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona feedback y changelog de Tarely
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="feedback" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/5">
          <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-white/10">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="changelog" className="flex items-center gap-2 data-[state=active]:bg-white/10">
            <FileText className="h-4 w-4" />
            Changelog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feedback">
          <FeedbackPanel />
        </TabsContent>

        <TabsContent value="changelog">
          <ChangelogPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
