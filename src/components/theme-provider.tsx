"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export type AccentColor = "none" | "pink" | "blue" | "green" | "orange" | "cyan" | "red";

interface ThemeContextType {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  accentColor: "none",
  setAccentColor: () => {},
});

export function useAccentColor() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>("none");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Cargar preferencia guardada en localStorage como fallback rápido
    const saved = localStorage.getItem("accent-color") as AccentColor | null;
    if (saved && ["none", "pink", "blue", "green", "orange", "cyan", "red"].includes(saved)) {
      setAccentColorState(saved);
      applyAccent(saved);
    }
  }, []);

  // Escuchar evento de sincronización de preferencias del servidor
  useEffect(() => {
    const handleSync = (e: CustomEvent<{ accentColor?: AccentColor; themeMode?: string }>) => {
      if (e.detail.accentColor) {
        setAccentColorState(e.detail.accentColor);
        applyAccent(e.detail.accentColor);
        localStorage.setItem("accent-color", e.detail.accentColor);
      }
    };

    window.addEventListener("theme-sync", handleSync as EventListener);
    return () => window.removeEventListener("theme-sync", handleSync as EventListener);
  }, []);

  const applyAccent = (color: AccentColor) => {
    const html = document.documentElement;
    if (color === "none") {
      html.removeAttribute("data-accent");
    } else {
      html.setAttribute("data-accent", color);
    }
  };

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
    applyAccent(color);
    localStorage.setItem("accent-color", color);
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <ThemeContext.Provider value={{ accentColor, setAccentColor }}>
        {children}
      </ThemeContext.Provider>
    </NextThemesProvider>
  );
}
