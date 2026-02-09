"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Shield } from "lucide-react";

const COOKIE_CONSENT_KEY = "tarely-cookie-consent";

export type CookieConsent = "accepted" | "rejected" | null;

export function getCookieConsent(): CookieConsent {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsent;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
    // Dispatch event so GoogleAnalytics component can react
    window.dispatchEvent(new Event("cookie-consent-change"));
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setVisible(false);
    window.dispatchEvent(new Event("cookie-consent-change"));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-100"
        >
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 p-5">
            {/* Close button */}
            <button
              onClick={handleReject}
              className="absolute top-3 right-3 p-1 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/10">
                <Cookie className="h-4.5 w-4.5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Usamos cookies</h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-white/50 leading-relaxed mb-4 pr-4">
              Utilizamos cookies de analítica para entender cómo usas Tarely y mejorar tu experiencia. 
              No compartimos tus datos con terceros.
            </p>

            {/* Privacy note */}
            <div className="flex items-center gap-1.5 mb-4">
              <Shield className="h-3 w-3 text-emerald-400/70" />
              <span className="text-[10px] text-emerald-400/70 font-medium">Tu privacidad es nuestra prioridad</span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAccept}
                className="flex-1 px-4 py-2 text-xs font-medium text-white rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
              >
                Aceptar
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 text-xs font-medium text-white/60 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white/80 transition-all"
              >
                Rechazar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
