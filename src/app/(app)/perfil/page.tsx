"use client";

import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAccentColor } from "@/components/theme-provider";
import type { AccentColor } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, User, LogOut, ArrowLeft, Check, Sparkles, Upload, X, FileText, Shield, Sun, Moon, Palette, Ban, Trash2, AlertTriangle } from "lucide-react";
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
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getAvatarUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Lazy load de componentes pesados para mejorar rendimiento
const InvitationsPanel = lazy(() => import("@/components/workspace").then(m => ({ default: m.InvitationsPanel })));
const FeedbackPanel = lazy(() => import("@/components/workspace").then(m => ({ default: m.FeedbackPanel })));

// Generar array de 20 avatares: avatar1.png, avatar2.png, ..., avatar20.png
const AVATARS = Array.from({ length: 20 }, (_, i) => `avatar${i + 1}.png`);

// Función para obtener un avatar aleatorio
const getRandomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatar_version?: number;
}

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

export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/perfil");
      if (!res.ok) throw new Error("Error al cargar perfil");
      const data = await res.json();
      setProfile(data);
      setName(data.name);
      setSelectedAvatar(data.avatar);
    } catch {
      toast.error("Error al cargar el perfil");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/auth/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar: selectedAvatar }),
      });

      if (!res.ok) throw new Error("Error al guardar");

      toast.success("Perfil actualizado correctamente");
      // Refrescar el perfil en el header
      window.dispatchEvent(new Event('profile-updated'));
    } catch {
      toast.error("Error al guardar el perfil");
    } finally {
      setIsSaving(false);
    }
  }, [name, selectedAvatar]);

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

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona una imagen");
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB");
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir imagen
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al subir avatar');
      }

      const data = await res.json();
      setSelectedAvatar(data.avatar);
      toast.success('¡Avatar actualizado!');
      
      // Refrescar perfil para obtener nueva versión
      fetchProfile();
      window.dispatchEvent(new Event('profile-updated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir avatar');
      setCustomAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [fetchProfile]);

  const clearCustomAvatar = useCallback(() => {
    setCustomAvatarPreview(null);
  }, []);

  // Generar avatar aleatorio
  const handleGenerateAvatar = useCallback(() => {
    const randomAvatar = getRandomAvatar();
    setSelectedAvatar(randomAvatar);
    setCustomAvatarPreview(null);
    toast.success("Avatar generado aleatoriamente");
  }, []);

  // Determinar si es un avatar personalizado
  const isCustomAvatar = useCallback((avatar: string) => {
    return avatar.includes('/') && !AVATARS.includes(avatar);
  }, []);

  // Memoizar si hay cambios sin guardar
  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return name !== profile.name || selectedAvatar !== profile.avatar;
  }, [name, selectedAvatar, profile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              Mi Perfil
            </h1>
            <p className="text-muted-foreground text-sm">Gestiona tu cuenta y preferencias</p>
          </div>
        </div>

        {/* Card de perfil */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-ta via-ta-secondary to-ta rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
          <div className="relative bg-background/60 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-5 w-5 text-ta-light" />
              <h2 className="font-semibold">Información del perfil</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Actualiza tu nombre y avatar</p>

            <div className="space-y-6">
              {/* Avatar actual */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-ta to-ta-secondary rounded-full blur-sm opacity-50" />
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border">
                    <Image
                      src={customAvatarPreview || getAvatarUrl(selectedAvatar, profile?.avatar_version)}
                      alt="Avatar actual"
                      fill
                      sizes="80px"
                      className="object-cover object-center"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
                <div>
                  <p className="font-medium">{profile?.name}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              {/* Cambiar avatar */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Cambiar avatar</Label>
                
                {/* Botones: Generar o Subir (misma fila) */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateAvatar}
                    className="flex-1 bg-foreground/5 border-border hover:bg-foreground/10 hover:border-ta/50"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar avatar
                  </Button>
                  
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Subir avatar personalizado"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={isUploadingAvatar}
                    className="flex-1 bg-foreground/5 border-border hover:bg-foreground/10 hover:border-ta/50"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir imagen
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Genera un avatar aleatorio o sube tu propia imagen (JPG, PNG, WebP, máx 5MB)
                </p>
              </div>

              <Separator className="bg-border" />

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="h-11 bg-foreground/5 border-border focus:border-ta/50"
                />
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isSaving || !hasChanges} 
                className="w-full h-11 btn-accent-gradient glow-accent transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Apariencia */}
        <ThemeSettingsSection />

        {/* Panel de invitaciones */}
        <Suspense fallback={
          <Card className="bg-foreground/5 border-border">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        }>
          <InvitationsPanel />
        </Suspense>

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
