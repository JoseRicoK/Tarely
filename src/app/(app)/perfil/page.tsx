"use client";

import { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile, queryKeys } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, User, ArrowLeft, Sparkles, Upload, Shuffle, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getAvatarUrl, getDiceBearUrl, generateRandomAvatarSeed } from "@/lib/utils";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { createClient } from "@/lib/supabase/client";

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
  const [hasGoogleLinked, setHasGoogleLinked] = useState(false);
  const [checkingProviders, setCheckingProviders] = useState(true);

  // Sync form state from profile on first load
  useEffect(() => {
    if (profile && !initializedRef.current) {
      setName(profile.name);
      setSelectedAvatar(profile.avatar);
      initializedRef.current = true;
    }
  }, [profile]);

  // Check if user has Google provider linked
  useEffect(() => {
    const checkGoogleProvider = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const hasGoogle = !!(user.app_metadata.providers?.includes('google') || 
                           user.identities?.some(identity => identity.provider === 'google'));
          setHasGoogleLinked(hasGoogle);
        }
      } catch (error) {
        console.error('Error checking providers:', error);
      } finally {
        setCheckingProviders(false);
      }
    };

    void checkGoogleProvider();
  }, []);

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

        {/* Card de vinculación con Google */}
        {!checkingProviders && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
            <div className="relative bg-background/60 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-1">
                <Link2 className="h-5 w-5 text-blue-500" />
                <h2 className="font-semibold">Vinculación con Google</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {hasGoogleLinked 
                  ? "Tu cuenta está vinculada con Google. Puedes iniciar sesión con Google en cualquier momento."
                  : "Vincula tu cuenta con Google para poder iniciar sesión más rápidamente en el futuro."
                }
              </p>

              {hasGoogleLinked ? (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-400">Cuenta vinculada con Google</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Puedes usar Google Login para acceder a tu cuenta
                    </p>
                  </div>
                </div>
              ) : (
                <GoogleLoginButton 
                  mode="link" 
                  variant="outline" 
                  className="bg-foreground/5 border-border hover:bg-foreground/10 hover:border-blue-500/50" 
                />
              )}
            </div>
          </div>
        )}

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
