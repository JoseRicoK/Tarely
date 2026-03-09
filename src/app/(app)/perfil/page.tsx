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
import { useTranslations } from "next-intl";

const InvitationsPanel = lazy(() => import("@/components/workspace").then(m => ({ default: m.InvitationsPanel })));

export default function PerfilPage() {
  const t = useTranslations('profile');
  const tInfo = useTranslations('profile.info');
  const tErrors = useTranslations('profile.errors');
  const tSuccess = useTranslations('profile.success');
  const router = useRouter();

  const qc = useQueryClient();
  const { data: profile, isPending: isLoading } = useProfile();

  const initializedRef = useRef(false);
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !initializedRef.current) {
      setName(profile.name);
      setSelectedAvatar(profile.avatar);
      initializedRef.current = true;
    }
  }, [profile]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error(tErrors('emptyName'));
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

      toast.success(tSuccess('updated'));
      void qc.invalidateQueries({ queryKey: queryKeys.profile });
      window.dispatchEvent(new Event('profile-updated'));
    } catch {
      toast.error(tErrors('saveError'));
    } finally {
      setIsSaving(false);
    }
  }, [name, selectedAvatar, qc, tErrors, tSuccess]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(tErrors('invalidImage'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(tErrors('imageTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

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
      toast.success(tSuccess('avatarUploaded'));
      
      void qc.invalidateQueries({ queryKey: queryKeys.profile });
      window.dispatchEvent(new Event('profile-updated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tErrors('uploadError'));
      setCustomAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [qc, tErrors, tSuccess]);

  const handleShuffleAvatar = useCallback(() => {
    const newSeed = generateRandomAvatarSeed();
    setSelectedAvatar(newSeed);
    setCustomAvatarPreview(null);
  }, []);

  const avatarPreviewUrl = useMemo(() => {
    if (customAvatarPreview) return customAvatarPreview;
    if (!selectedAvatar || !selectedAvatar.includes('/')) {
      const seed = selectedAvatar || profile?.id || "user";
      return getDiceBearUrl(seed);
    }
    return getAvatarUrl(selectedAvatar, profile?.id || "", profile?.avatar_version);
  }, [customAvatarPreview, selectedAvatar, profile]);

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
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 app-bg-gradient" />
        <div className="absolute top-0 right-0 w-96 h-96 app-bg-glow-1 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 app-bg-glow-2 rounded-full blur-[120px]" />
        <div className="absolute inset-0 app-grid-pattern" />
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hover:bg-foreground/5" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-accent-gradient">
              {t('title')}
            </h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-ta via-ta-secondary to-ta rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
          <div className="relative bg-background/60 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-5 w-5 text-ta-light" />
              <h2 className="font-semibold">{tInfo('title')}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{tInfo('description')}</p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-ta to-ta-secondary rounded-full blur-sm opacity-50" />
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarPreviewUrl}
                      alt={tInfo('currentAvatar')}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <p className="font-medium">{profile?.name}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">{tInfo('changeAvatar')}</Label>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShuffleAvatar}
                    className="flex-1 bg-foreground/5 border-border hover:bg-foreground/10 hover:border-ta/50"
                  >
                    <Shuffle className="mr-2 h-4 w-4" />
                    {tInfo('generateAnother')}
                  </Button>
                  
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label={tInfo('uploadImage')}
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
                        {tInfo('uploading')}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {tInfo('uploadImage')}
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {tInfo('avatarHelp')}
                </p>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">{tInfo('name')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tInfo('namePlaceholder')}
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
                    {tInfo('saving')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {tInfo('saveChanges')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

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
