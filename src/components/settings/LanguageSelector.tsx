"use client";

import { useState, useCallback, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Languages, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const LANGUAGES = [
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "en", label: "English", flag: "🇬🇧" },
] as const;

interface LanguageSelectorProps {
  initialLocale?: string;
}

export function LanguageSelector({ initialLocale = "es" }: LanguageSelectorProps) {
  const t = useTranslations('settings.language');
  const [currentLocale, setCurrentLocale] = useState(initialLocale);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchLocale = async () => {
      try {
        const res = await fetch("/api/auth/locale");
        if (res.ok) {
          const data = await res.json();
          setCurrentLocale(data.locale);
        }
      } catch (error) {
        console.error("Error fetching locale:", error);
      }
    };
    fetchLocale();
  }, []);

  const handleLanguageChange = useCallback(async (locale: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      if (!res.ok) throw new Error("Failed to update language");

      setCurrentLocale(locale);
      toast.success(
        locale === "es" ? "Idioma cambiado correctamente" : "Language changed successfully"
      );
      
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error) {
      console.error("Error updating language:", error);
      toast.error(
        locale === "es" ? "Error al cambiar el idioma" : "Error changing language"
      );
    } finally {
      setSaving(false);
    }
  }, [router]);

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-ta via-ta-secondary to-ta rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
      <div className="relative bg-background/60 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Languages className="h-5 w-5 text-ta-light" />
          <h2 className="font-semibold">Idioma / Language</h2>
          {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          {currentLocale === "es" 
            ? "Selecciona tu idioma preferido" 
            : "Select your preferred language"}
        </p>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            {currentLocale === "es" ? "Idioma" : "Language"}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => handleLanguageChange(lang.value)}
                disabled={saving}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed",
                  currentLocale === lang.value
                    ? "border-ta bg-ta/10 text-foreground shadow-sm"
                    : "border-border bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.label}</span>
                {currentLocale === lang.value && <Check className="h-4 w-4 ml-auto" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
