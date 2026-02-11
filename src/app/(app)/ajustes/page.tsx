"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAccentColor } from "@/components/theme-provider";
import type { AccentColor } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, LogOut, ArrowLeft, Check, Sun, Moon, Palette, FileText, Shield, Trash2, AlertTriangle, MessageSquarePlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { lazy, Suspense } from "react";

const FeedbackPanel = lazy(() => import("@/components/workspace").then(m => ({ default: m.FeedbackPanel })));

const ACCENT_COLORS: { value: AccentColor; label: string; color: string }[] = [
  { value: "pink", label: "Rosa", color: "#ec4899" },
  { value: "blue", label: "Azul", color: "#3b82f6" },
  { value: "green", label: "Verde", color: "#10b981" },
  { value: "orange", label: "Naranja", color: "#f97316" },
  { value: "cyan", label: "Cian", color: "#06b6d4" },
  { value: "red", label: "Rojo", color: "#ef4444" },
];

function ThemeSettingsSection() {
  const { theme, setTheme } = useTheme();
  const { accentColor, setAccentColor } = useAccentColor();
  const [saving, setSaving] = useState(false);

  const persistPreferences = useCallback(async (mode?: string, accent?: string) => {
    setSaving(true);
    try {
      await fetch("/api/auth/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(mode !== undefined && { theme_mode: mode }),
          ...(accent !== undefined && { accent_color: accent }),
        }),
      });
    } catch {
      toast.error("Error al guardar preferencias");
    } finally {
      setSaving(false);
    }
  }, []);

  const handleThemeChange = useCallback((mode: string) => {
    setTheme(mode);
    persistPreferences(mode, undefined);
  }, [setTheme, persistPreferences]);

  const handleAccentChange = useCallback((color: AccentColor) => {
    setAccentColor(color);
    persistPreferences(undefined, color);
  }, [setAccentColor, persistPreferences]);

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-ta via-ta-secondary to-ta rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
      <div className="relative bg-background/60 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-5 w-5 text-ta-light" />
          <h2 className="font-semibold">Apariencia</h2>
          {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
        </div>
        <p className="text-sm text-muted-foreground mb-5">Personaliza el aspecto de tu espacio de trabajo</p>

        {/* Modo claro / oscuro */}
        <div className="mb-5">
          <Label className="text-sm font-medium mb-3 block">Modo</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleThemeChange("light")}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium",
                theme === "light"
                  ? "border-ta bg-ta/10 text-foreground shadow-sm"
                  : "border-border bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
              )}
            >
              <Sun className="h-4 w-4" />
              Claro
            </button>
            <button
              onClick={() => handleThemeChange("dark")}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium",
                theme === "dark"
                  ? "border-ta bg-ta/10 text-foreground shadow-sm"
                  : "border-border bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
              )}
            >
              <Moon className="h-4 w-4" />
              Oscuro
            </button>
          </div>
        </div>

        <Separator className="bg-border mb-5" />

        {/* Color de acento */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Color de acento</Label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {/* Sin color (default) */}
            <button
              onClick={() => handleAccentChange("none")}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                accentColor === "none"
                  ? "border-ta bg-ta/10 shadow-sm"
                  : "border-border bg-foreground/5 hover:bg-foreground/10"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center ring-2 ring-offset-2 ring-offset-background ring-transparent">
                {accentColor === "none" && <Check className="h-4 w-4 text-white" />}
              </div>
              <span className="text-[10px] text-muted-foreground">Por defecto</span>
            </button>

            {/* Color swatches */}
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => handleAccentChange(c.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                  accentColor === c.value
                    ? "border-ta bg-ta/10 shadow-sm"
                    : "border-border bg-foreground/5 hover:bg-foreground/10"
                )}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-background ring-transparent"
                  style={{ backgroundColor: c.color }}
                >
                  {accentColor === c.value && <Check className="h-4 w-4 text-white" />}
                </div>
                <span className="text-[10px] text-muted-foreground">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AjustesPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Error al cerrar sesión");
      toast.success("Sesión cerrada");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Error al cerrar sesión");
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== "ELIMINAR") return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar la cuenta");
      }
      toast.success("Cuenta eliminada correctamente. ¡Hasta pronto!");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar la cuenta");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmText("");
    }
  }, [deleteConfirmText, router]);

  return (
    <div className="min-h-[85vh] py-8 px-4 settings-accent">
      {/* Fondo sutil */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 app-bg-gradient" />
        <div className="absolute top-0 right-0 w-96 h-96 app-bg-glow-1 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 app-bg-glow-2 rounded-full blur-[120px]" />
        <div className="absolute inset-0 app-grid-pattern" />
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/app">
            <Button variant="ghost" size="icon" className="hover:bg-foreground/5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-accent-gradient">
              Ajustes
            </h1>
            <p className="text-muted-foreground text-sm">Configura tu experiencia en Tarely</p>
          </div>
        </div>

        {/* Apariencia */}
        <ThemeSettingsSection />

        {/* Panel de sugerencias y errores */}
        <Suspense fallback={
          <Card className="bg-foreground/5 border-border">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        }>
          <FeedbackPanel />
        </Suspense>

        {/* Legal links */}
        <div className="relative bg-background/60 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-ta-light" />
            <h2 className="font-semibold">Legal</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Documentos legales y privacidad</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/politica-de-privacidad"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-muted-foreground rounded-xl border border-border bg-foreground/5 hover:bg-foreground/10 hover:text-foreground transition-all"
            >
              <Shield className="h-4 w-4" />
              Política de Privacidad
            </Link>
            <Link
              href="/terminos-y-condiciones"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-muted-foreground rounded-xl border border-border bg-foreground/5 hover:bg-foreground/10 hover:text-foreground transition-all"
            >
              <FileText className="h-4 w-4" />
              Términos y Condiciones
            </Link>
          </div>
        </div>

        {/* Card de cerrar sesión */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/30 to-orange-600/30 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
          <div className="relative bg-background/60 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <LogOut className="h-5 w-5 text-red-400" />
              <h2 className="font-semibold text-red-400">Cerrar Sesión</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Cierra tu sesión en este dispositivo</p>

            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02]"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cerrando sesión...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Zona de peligro - Eliminar cuenta */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-700/40 to-red-900/40 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500" />
          <div className="relative bg-background/60 backdrop-blur-xl border border-red-600/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="font-semibold text-red-500">Zona de peligro</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Acciones irreversibles sobre tu cuenta</p>

            <Separator className="bg-red-500/20 my-4" />

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-red-400">Eliminar cuenta</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Se eliminarán permanentemente todos tus datos: workspaces, tareas, comentarios, archivos adjuntos y cualquier información asociada a tu cuenta. Esta acción no se puede deshacer.
                </p>
              </div>

              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full h-11 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 shadow-lg shadow-red-900/30 transition-all hover:scale-[1.02] border border-red-600/50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar mi cuenta
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de confirmación para eliminar cuenta */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open);
        if (!open) setDeleteConfirmText("");
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Eliminar cuenta permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Esta acción es <strong className="text-red-400">irreversible</strong>. Se eliminarán permanentemente:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Todos tus workspaces y tareas</li>
                  <li>Comentarios y archivos adjuntos</li>
                  <li>Subtareas y actividad</li>
                  <li>Membresías en workspaces compartidos</li>
                  <li>Tu perfil y datos de cuenta</li>
                </ul>
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">Escribe <strong className="text-red-400">ELIMINAR</strong> para confirmar:</p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Escribe ELIMINAR"
                    className="border-red-500/30 focus:border-red-500"
                    autoComplete="off"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setDeleteConfirmText("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText !== "ELIMINAR"}
              className="bg-red-700 text-white hover:bg-red-600 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando cuenta...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar cuenta definitivamente
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
