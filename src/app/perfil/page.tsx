"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, User, LogOut, ArrowLeft, Check, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { InvitationsPanel } from "@/components/workspace";

const AVATARS = [
  "avatar1.png",
  "avatar2.png",
  "avatar3.png",
  "avatar4.png",
  "avatar5.png",
  "avatar6.png",
];

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
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
  };

  const handleSave = async () => {
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
  };

  const handleLogout = async () => {
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
  };

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
          <Link href="/">
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
                      src={`${supabaseUrl}/storage/v1/object/public/avatars/${selectedAvatar}`}
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

              {/* Selector de avatar */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Cambiar avatar</Label>
                <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      title={`Seleccionar ${avatar}`}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-300 ${
                        selectedAvatar === avatar
                          ? "border-purple-500 ring-2 ring-purple-500/50 scale-110"
                          : "border-white/20 hover:border-white/40 hover:scale-105"
                      }`}
                    >
                      <Image
                        src={`${supabaseUrl}/storage/v1/object/public/avatars/${avatar}`}
                        alt={`Avatar ${avatar}`}
                        fill
                        sizes="48px"
                        className="object-cover object-center"
                        style={{ objectFit: 'cover' }}
                      />
                      {selectedAvatar === avatar && (
                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
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
                disabled={isSaving} 
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all hover:scale-[1.02]"
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
        <InvitationsPanel />

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
