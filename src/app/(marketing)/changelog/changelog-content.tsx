"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Loader2,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  changelog_sections: {
    title: string;
    image_url?: string | null;
    changelog_items: { content: string }[];
  }[];
}

function getChangelogImageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/changelog/${path}`;
}

export function ChangelogContent() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  useEffect(() => {
    async function fetchChangelog() {
      try {
        const res = await fetch("/api/changelog");
        if (!res.ok) throw new Error("Error");
        const data = await res.json();
        setEntries(data);
        // Auto-expand the first entry
        if (data.length > 0) {
          setExpandedEntries(new Set([data[0].id]));
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchChangelog();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedEntries(new Set());
    } else {
      setExpandedEntries(new Set(entries.map((e) => e.id)));
    }
    setAllExpanded(!allExpanded);
  };

  return (
    <div className="min-h-screen">
      {/* Fondo con efectos */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradiente base */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-background to-blue-950/25" />
        
        {/* Orbes de luz */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/12 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/8 rounded-full blur-[60px] animate-pulse delay-2000" />
        
        {/* Grid pattern sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-white/[0.02] backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Tarely
          </Link>
          <Link
            href="/registro"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Empieza gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-400">
            <Sparkles className="h-4 w-4" />
            Novedades
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent mb-8 pb-2 leading-tight">
            Changelog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Todas las novedades, mejoras y correcciones de Tarely.
            Mantente al día con las últimas actualizaciones.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            <p className="text-sm text-muted-foreground">Cargando changelog...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No se pudo cargar el changelog</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-purple-400 hover:text-purple-300 underline underline-offset-4"
            >
              Reintentar
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Pronto publicaremos las primeras novedades</p>
          </div>
        ) : (
          <>
            {/* Expand/Collapse All */}
            {entries.length > 1 && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={toggleAll}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  {allExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Contraer todo
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Expandir todo
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[23px] top-2 bottom-2 w-px bg-gradient-to-b from-purple-500/40 via-purple-500/20 to-transparent hidden sm:block" />

              <div className="space-y-8">
                {entries.map((entry, entryIdx) => {
                  const isExpanded = expandedEntries.has(entry.id);
                  const isLatest = entryIdx === 0;

                  return (
                    <div key={entry.id} className="relative flex gap-6">
                      {/* Timeline dot */}
                      <div className="hidden sm:flex shrink-0 relative z-10">
                        <div
                          className={`w-[48px] h-[48px] rounded-xl flex items-center justify-center ${
                            isLatest
                              ? "bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20"
                              : "bg-white/[0.06] border border-white/10"
                          }`}
                        >
                          <FileText
                            className={`h-5 w-5 ${
                              isLatest ? "text-white" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Entry card */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`rounded-xl border transition-all overflow-hidden ${
                            isLatest
                              ? "bg-white/[0.12] border-purple-500/20 shadow-lg shadow-purple-500/5"
                              : "bg-white/[0.08] border-white/5 hover:border-white/10"
                          }`}
                        >
                          {/* Entry header */}
                          <button
                            onClick={() => toggleExpand(entry.id)}
                            className="w-full flex items-center gap-4 p-5 text-left"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-mono ${
                                  isLatest
                                    ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30"
                                    : "bg-white/5 text-muted-foreground border border-white/10"
                                }`}
                              >
                                v{entry.version}
                              </span>
                              {isLatest && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                  Último
                                </span>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {new Date(entry.date).toLocaleDateString("es-ES", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                          </button>

                          {/* Entry content */}
                          {isExpanded && (
                            <div className="px-5 pb-6 space-y-6 border-t border-white/5 pt-5">
                              {entry.changelog_sections?.map((section, sIdx) => (
                                <div key={sIdx} className="space-y-3">
                                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                    {section.title}
                                  </h3>

                                  {section.image_url && (
                                    <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={getChangelogImageUrl(section.image_url)}
                                        alt={section.title}
                                        className="w-full h-auto"
                                        loading="lazy"
                                      />
                                    </div>
                                  )}

                                  {section.changelog_items?.length > 0 && (
                                    <ul className="space-y-2 ml-4">
                                      {section.changelog_items.map((item, iIdx) => (
                                        <li
                                          key={iIdx}
                                          className="text-sm text-foreground/75 leading-relaxed flex items-start gap-2.5"
                                        >
                                          <span className="text-purple-400/60 mt-1.5 shrink-0">•</span>
                                          <span>{item.content}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Tarely. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
