"use client";

import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, User, LogOut, ArrowLeft, Check, Sparkles, Upload, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getAvatarUrl } from "@/lib/utils";

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
    <div className="min-h-[85vh] py-8 px-4">
      {/* Fondo sutil */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-background to-purple-950/15" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/app">
            <Button variant="ghost" size="icon" className="hover:bg-white/5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Mi Perfil
            </h1>
            <p className="text-muted-foreground text-sm">Gestiona tu cuenta y preferencias</p>
          </div>
        </div>

        {/* Card de perfil */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/50 via-blue-500/50 to-indigo-600/50 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
          <div className="relative bg-background/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-5 w-5 text-purple-400" />
              <h2 className="font-semibold">Información del perfil</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Actualiza tu nombre y avatar</p>

            <div className="space-y-6">
              {/* Avatar actual */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-sm opacity-50" />
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
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
                    className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50"
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
                    className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50"
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

              <Separator className="bg-white/10" />

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="h-11 bg-white/5 border-white/10 focus:border-purple-500/50"
                />
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isSaving || !hasChanges} 
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Panel de invitaciones */}
        <Suspense fallback={
          <Card className="bg-white/5 border-white/10">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        }>
          <InvitationsPanel />
        </Suspense>

        {/* Panel de sugerencias y errores */}
        <Suspense fallback={
          <Card className="bg-white/5 border-white/10">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        }>
          <FeedbackPanel />
        </Suspense>

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
      </div>
    </div>
  );
}
