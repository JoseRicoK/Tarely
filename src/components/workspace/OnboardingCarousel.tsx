"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Sparkles, Calendar, Layout, Briefcase } from "lucide-react";

interface Slide {
  image: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlights: string[];
}

const slides: Slide[] = [
  {
    image: "/task.png",
    title: "Tareas Inteligentes con IA",
    description: "Escribe tu texto caótico y deja que la IA lo transforme en tareas organizadas y priorizadas automáticamente.",
    icon: <Sparkles className="w-5 h-5" />,
    highlights: [
      "🎯 Priorización automática por importancia",
      "👥 Colabora con tu equipo asignando tareas",
      "📅 Añade fechas de vencimiento fácilmente"
    ]
  },
  {
    image: "/kanban.png",
    title: "Tablero Kanban Personalizable",
    description: "Organiza tus tareas en secciones personalizadas y muévelas con arrastrar y soltar.",
    icon: <Layout className="w-5 h-5" />,
    highlights: [
      "📋 Crea las secciones que necesites",
      "🔄 Arrastra tareas entre columnas",
      "🎨 Visualiza tu flujo de trabajo"
    ]
  },
  {
    image: "/workspace.png",
    title: "Múltiples Workspaces",
    description: "Separa tus proyectos en diferentes espacios de trabajo, cada uno con sus propias instrucciones para la IA.",
    icon: <Briefcase className="w-5 h-5" />,
    highlights: [
      "💼 Organiza por proyectos o equipos",
      "🤖 Instrucciones personalizadas de IA por workspace",
      "⚠️ Vista rápida de tareas vencidas"
    ]
  },
  {
    image: "/calendario.png",
    title: "Calendario Unificado",
    description: "Visualiza todas tus tareas en un calendario con código de colores por prioridad y estado.",
    icon: <Calendar className="w-5 h-5" />,
    highlights: [
      "🗓️ Vista de calendario de todos tus workspaces",
      "🎨 Colores por prioridad (rojo crítico → gris bajo)",
      "✅ Identifica tareas completadas y vencidas"
    ]
  }
];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [open, setOpen] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto-play cada 5 segundos
  useEffect(() => {
    if (!autoPlay) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay]);

  const handleNext = () => {
    setAutoPlay(false);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setAutoPlay(false);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleClose = () => {
    setOpen(false);
    onComplete();
  };

  const slide = slides[currentSlide];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="!max-w-[90vw] !w-[1300px] p-0 gap-0 bg-slate-900 border border-white/20 overflow-hidden">
        <div className="relative">
          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all border border-white/10"
            aria-label="Cerrar introducción"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-0">
            {/* Parte izquierda - Texto */}
            <div className="p-6 md:p-8 flex flex-col justify-between bg-slate-900">
              <div>
                {/* Icono y título */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/40">
                    {slide.icon}
                  </div>
                  <h2 className="text-3xl font-bold text-white leading-tight">{slide.title}</h2>
                </div>

                {/* Descripción */}
                <p className="text-slate-200 mb-8 text-lg leading-relaxed">
                  {slide.description}
                </p>

                {/* Highlights */}
                <div className="space-y-4 mb-8">
                  {slide.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-slate-100 text-base leading-relaxed">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                {/* Dots indicadores */}
                <div className="flex gap-2.5">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAutoPlay(false);
                        setCurrentSlide(idx);
                      }}
                      aria-label={`Ir a slide ${idx + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentSlide
                          ? "w-8 bg-purple-500"
                          : "w-2 bg-slate-600 hover:bg-slate-500"
                      }`}
                    />
                  ))}
                </div>

                {/* Botones navegación */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrev}
                    className="bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  {currentSlide === slides.length - 1 ? (
                    <Button
                      onClick={handleClose}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 font-semibold"
                    >
                      ¡Empezar! 🚀
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNext}
                      className="bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Parte derecha - Imagen (oculta en móvil) */}
            <div className="hidden md:flex relative bg-slate-900 p-6 items-center justify-center">
              <div className="relative w-full h-[600px]">
                {/* Gradientes difuminados en los bordes */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-900 via-slate-900/60 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-900 via-slate-900/60 to-transparent z-10 pointer-events-none" />
                
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
