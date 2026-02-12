"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { NoteTemplate } from "@/lib/types";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: NoteTemplate[];
  onSelectTemplate: (template: NoteTemplate) => void;
  onSaveTemplate: (data: { name: string; description: string; category?: string }) => void;
  onDeleteTemplate?: (template: NoteTemplate) => void;
  mode: "select" | "save";
  isLoading?: boolean;
  hasSelectedNote?: boolean;
}

const TEMPLATE_CATEGORIES: Record<string, string> = {
  general: "General",
  meeting: "Reuniones",
  project: "Proyectos",
  personal: "Personal",
  work: "Trabajo",
};

export function TemplateDialog({
  open,
  onOpenChange,
  templates,
  onSelectTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  mode,
  isLoading,
  hasSelectedNote = false,
}: TemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [activeTab, setActiveTab] = useState<string>(mode === "save" ? "save" : "select");

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("general");
  };

  if (mode === "save") {
    return (
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Guardar como plantilla</DialogTitle>
            <DialogDescription>
              Guarda el contenido actual como plantilla reutilizable
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nombre</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la plantilla"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-desc">Descripción</Label>
              <Textarea
                id="template-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { onOpenChange(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => { onSaveTemplate({ name, description, category }); resetForm(); }}
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // mode === "select" — with tabs: browse templates + create new
  const grouped = templates.reduce<Record<string, NoteTemplate[]>>((acc, t) => {
    const cat = t.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { resetForm(); setActiveTab("select"); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Plantillas</DialogTitle>
          <DialogDescription>
            Usa una plantilla existente o crea una nueva
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Usar plantilla</TabsTrigger>
            <TabsTrigger value="create">Crear plantilla</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="mt-4">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {Object.entries(grouped).map(([cat, catTemplates]) => (
                <div key={cat}>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {TEMPLATE_CATEGORIES[cat] || cat}
                  </div>
                  <div className="grid gap-2">
                    {catTemplates.map(template => (
                      <div
                        key={template.id}
                        className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-border hover:bg-accent/50 transition-colors"
                      >
                        <button
                          className="flex items-start gap-3 flex-1 text-left"
                          onClick={() => onSelectTemplate(template)}
                        >
                          <span className="text-xl">{template.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{template.name}</div>
                            {template.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {template.description}
                              </div>
                            )}
                          </div>
                        </button>
                        {onDeleteTemplate && (
                          <button
                            className="shrink-0 p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive rounded transition-all"
                            onClick={() => onDeleteTemplate(template)}
                            title="Eliminar plantilla"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No hay plantillas todavía
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("create")}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Crear primera plantilla
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="create" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-template-name">Nombre</Label>
                <Input
                  id="new-template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre de la plantilla"
                  autoFocus={activeTab === "create"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-template-desc">Descripción</Label>
                <Textarea
                  id="new-template-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción opcional..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasSelectedNote ? (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Se guardará el contenido de la nota seleccionada actualmente como plantilla.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Se creará una plantilla vacía. Puedes guardar el contenido de una nota como plantilla desde el menú de opciones de la nota.
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => { setActiveTab("select"); resetForm(); }}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => { onSaveTemplate({ name, description, category }); resetForm(); setActiveTab("select"); }}
                  disabled={!name.trim() || isLoading}
                >
                  {isLoading ? "Guardando..." : "Crear plantilla"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
