"use client";

import { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile, queryKeys } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, User, ArrowLeft, Sparkles, Upload, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getAvatarUrl, getDiceBearUrl, generateRandomAvatarSeed } from "@/lib/utils";

const InvitationsPanel = lazy(() => import("@/components/workspace").then(m => ({ default: m.InvitationsPanel })));

export default function PerfilPage() {
  const router = useRouter();

  const qc = useQueryClient();
  const { data: profile, isPending: isLoading } = useProfile();

  const initializedRef = useRef(false);
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);

  // Sync form state from profile on first load
  useEffect(() => {
    if (profile && !initializedRef.current) {
      setName(profile.name);
      setSelectedAvatar(profile.avatar);
      initializedRef.current = true;
    }
  }, [profile]);

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
      void qc.invalidateQueries({ queryKey: queryKeys.profile });
      // Refrescar el perfil en el header
      window.dispatchEvent(new Event('profile-updated'));
    } catch {
      toast.error("Error al guardar el perfil");
    } finally {
      setIsSaving(false);
    }
  }, [name, selectedAvatar, qc]);

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
      void qc.invalidateQueries({ queryKey: queryKeys.profile });
      window.dispatchEvent(new Event('profile-updated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir avatar');
      setCustomAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [qc]);

  // Generar un nuevo avatar aleatorio de DiceBear
  const handleShuffleAvatar = useCallback(() => {
    const newSeed = generateRandomAvatarSeed();
    setSelectedAvatar(newSeed);
    setCustomAvatarPreview(null);
  }, []);

  // URL del avatar para preview
  const avatarPreviewUrl = useMemo(() => {
    if (customAvatarPreview) return customAvatarPreview;
    if (!selectedAvatar || !selectedAvatar.includes('/')) {
      const seed = selectedAvatar || profile?.id || "user";
      return getDiceBearUrl(seed);
    }
    return getAvatarUrl(selectedAvatar, profile?.id || "", profile?.avatar_version);
  }, [customAvatarPreview, selectedAvatar, profile]);

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
          <Button variant="ghost" size="icon" className="hover:bg-foreground/5" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-accent-gradient">
              Mi Perfil
            </h1>
            <p className="text-muted-foreground text-sm">Gestiona tu información personal</p>
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarPreviewUrl}
                      alt="Avatar actual"
                      className="w-full h-full object-cover"
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
                
                {/* Botones: Generar otro / Subir imagen */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShuffleAvatar}
                    className="flex-1 bg-foreground/5 border-border hover:bg-foreground/10 hover:border-ta/50"
                  >
                    <Shuffle className="mr-2 h-4 w-4" />
                    Generar otro
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
                  Genera avatares aleatorios o sube tu propia imagen (JPG, PNG, WebP, máx 5MB)
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
      </div>
    </div>
  );
}
