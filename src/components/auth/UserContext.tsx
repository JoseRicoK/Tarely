"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAccentColor } from "@/components/theme-provider";
import type { AccentColor } from "@/components/theme-provider";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatar_version?: number;
}

interface UserContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  clearProfile: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const { setTheme } = useTheme();
  const { setAccentColor } = useAccentColor();

  const fetchPreferences = useCallback(async () => {
    if (preferencesLoaded) return;
    try {
      const res = await fetch("/api/auth/preferences");
      if (res.ok) {
        const data = await res.json();
        if (data.theme_mode) {
          setTheme(data.theme_mode);
        }
        if (data.accent_color) {
          setAccentColor(data.accent_color as AccentColor);
        }
        setPreferencesLoaded(true);
      }
    } catch {
      // Usar defaults
    }
  }, [preferencesLoaded, setTheme, setAccentColor]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/perfil");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        // Cargar preferencias de tema al obtener perfil
        fetchPreferences();
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPreferences]);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    await fetchProfile();
  }, [fetchProfile]);

  const clearProfile = useCallback(() => {
    setProfile(null);
    setPreferencesLoaded(false);
  }, []);

  // Refetch cuando cambia la ruta
  useEffect(() => {
    fetchProfile();
  }, [pathname, fetchProfile]);

  // Escuchar evento de actualización de perfil
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchProfile();
    };
    
    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [fetchProfile]);

  return (
    <UserContext.Provider value={{ profile, isLoading, refreshProfile, clearProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
