"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  Users,
  Calendar,
  LayoutGrid,
  ListChecks,
  Brain,
  Target,
  Rocket,
  CheckCircle2,
  MessageSquare,
  FolderKanban,
  Star,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Componente de texto animado para el hero
function AnimatedText() {
  const words = ["emails", "ideas", "notas", "reuniones", "proyectos", "tareas inteligentes"];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={words[currentIndex]}
        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
        transition={{ duration: 0.3 }}
        className="inline-block bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
      >
        {words[currentIndex]}
      </motion.span>
    </AnimatePresence>
  );
}

// Feature Card con animación
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  index = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:border-white/15 hover:bg-white/[0.04] transition-all duration-500"
    >
      <div
        className={cn(
          "inline-flex p-3 rounded-xl mb-4 bg-gradient-to-br",
          gradient
        )}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

// Testimonial Card
function TestimonialCard({
  quote,
  author,
  role,
  index = 0,
}: {
  quote: string;
  author: string;
  role: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
    >
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-white/70 mb-5 text-sm leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="font-medium text-white text-sm">{author}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </motion.div>
  );
}

// Floating number counter
function CountUp({ target, suffix = "" }: { target: string; suffix?: string }) {
  return (
    <span className="tabular-nums">{target}{suffix}</span>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cuando el usuario escribe algo, mostrar tooltip y redirigir después de un momento
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.length > 10 && !showTooltip) {
      setShowTooltip(true);
      setTimeout(() => {
        router.push("/registro");
      }, 1500);
    }
  };

  const handleInputFocus = () => {
    setShowTooltip(true);
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
  };

  return (
    <div className="relative min-h-screen">
      {/* Gradient backgrounds - más sutiles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-background to-slate-950" />
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-violet-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-fuchsia-500/6 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-14 md:h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
            <Image
              src="/logo/logo_tarely_bg.png"
              alt="Tarely - Gestor de tareas con inteligencia artificial"
              width={40}
              height={40}
              className="h-8 w-8 object-contain group-hover:scale-105 transition-transform"
              priority
            />
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Tarely
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Cómo funciona
            </a>
            <a href="#funcionalidades" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Funcionalidades
            </a>
            <a href="#testimonios" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Testimonios
            </a>
            <Link href="/changelog" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Changelog
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/registro">
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 text-xs sm:text-sm">
                Empezar gratis
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menú de navegación"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-white/5 bg-background/95 backdrop-blur-xl"
            >
              <nav className="flex flex-col px-4 py-4 gap-1">
                <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                  Cómo funciona
                </a>
                <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                  Funcionalidades
                </a>
                <a href="#testimonios" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                  Testimonios
                </a>
                <Link href="/changelog" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                  Changelog
                </Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                  Iniciar sesión
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* ═══════════════════════════════════════════
            HERO — limpio, centrado, respira
        ═══════════════════════════════════════════ */}
        <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 md:pt-32 md:pb-36 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 backdrop-blur-sm mb-6 sm:mb-8"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-xs sm:text-sm text-violet-300">Tu segundo cerebro potenciado por IA</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="text-[2.25rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5 sm:mb-6"
              >
                <span className="text-white">Conecta tus ideas,</span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  ejecuta sin fricción
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed"
              >
                Notas, tareas y calendario en un solo ecosistema. La IA organiza tu caos, extrae las <AnimatedText /> y planifica tu día automáticamente.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6"
              >
                <Link href="/registro" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 h-12 sm:h-13 px-8 text-base shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Empezar gratis
                  </Button>
                </Link>
                <a href="#como-funciona" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-12 sm:h-13 px-8 text-base border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                  >
                    Ver cómo funciona
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </a>
              </motion.div>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={4}
                className="text-xs sm:text-sm text-muted-foreground/70"
              >
                Sin tarjeta de crédito · Gratis para siempre
              </motion.p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SOCIAL PROOF — números compactos
        ═══════════════════════════════════════════ */}
        <section className="relative pb-16 sm:pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 md:gap-16 py-6 sm:py-8 border-y border-white/5 max-w-3xl mx-auto"
            >
              {[
                { value: "1,000+", label: "Usuarios activos" },
                { value: "50K+", label: "Tareas organizadas" },
                { value: "4.9/5", label: "Valoración" },
              ].map((stat, i) => (
                <div key={i} className="text-center min-w-[80px]">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    <CountUp target={stat.value} />
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            DEMO VISUAL — preview interactivo
        ═══════════════════════════════════════════ */}
        <section className="relative pb-24 sm:pb-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative max-w-4xl mx-auto"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/15 via-fuchsia-600/10 to-pink-600/15 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-violet-500/5">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-slate-900/50">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-3 py-0.5 rounded-md bg-white/5 text-[10px] text-muted-foreground">
                      tarely.com/app
                    </div>
                  </div>
                </div>
                {/* Preview - Textarea → AI → Tasks */}
                <div className="p-4 sm:p-6 md:p-8">
                  {/* Input area */}
                  <div className="relative mb-5">
                    <textarea
                      value={inputValue}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      placeholder="Escribe tus notas aquí... Ej: Reunión de producto terminada. Hay que lanzar la nueva landing el próximo martes y avisar a marketing mañana a primera hora."
                      className="w-full h-24 sm:h-28 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/30 transition-all"
                    />
                    <div className="absolute bottom-3 right-3">
                      <Badge variant="outline" className="bg-violet-500/10 border-violet-500/20 text-[10px] text-violet-400">
                        <Sparkles className="h-2.5 w-2.5 mr-1" />
                        IA Asistente
                      </Badge>
                    </div>
                    {showTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-11 left-1/2 -translate-x-1/2 px-4 py-2 bg-violet-600 text-white text-xs rounded-lg whitespace-nowrap z-10"
                      >
                        ¡Regístrate gratis para organizar tus ideas!
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-violet-600 rotate-45" />
                      </motion.div>
                    )}
                  </div>

                  {/* AI Processing indicator */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Tareas detectadas y sincronizadas con tu calendario</span>
                  </div>

                  {/* Task list */}
                  <div className="space-y-2">
                    {[
                      { task: "Lanzar nueva landing", priority: 9, due: "Próximo martes", color: "bg-red-500/20 text-red-400 border-red-500/20" },
                      { task: "Avisar a marketing", priority: 7, due: "Mañana", color: "bg-orange-500/20 text-orange-400 border-orange-500/20" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-violet-400/40 shrink-0" />
                        <div className="flex-1 flex flex-col">
                          <span className="text-sm text-white/80">{item.task}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center mt-0.5">
                            <Calendar className="w-3 h-3 mr-1 inline-block" /> {item.due}
                          </span>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px]", item.color)}>
                          {item.priority}/10
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            NOTES UI HIGHLIGHT — Editor de notas interactivas
        ═══════════════════════════════════════════ */}
        <section className="relative pb-24 sm:pb-32 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-16"
            >
              <p className="text-sm font-medium text-violet-400 mb-3 tracking-wide uppercase">El concepto diferenciador</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                Tu nota <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">ES</span> tu tarea
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                No añades tareas dentro de una nota. <strong className="text-white/90">La nota entera se convierte en una tarea.</strong> Cuando completas la tarea en tu Kanban, la nota se marca como completada automáticamente. Todo vive en el mismo Workspace.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative max-w-5xl mx-auto"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-teal-600/10 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row h-[450px] sm:h-[550px]">
                
                {/* Sidebar (hidden on small mobile, visible on md) */}
                <div className="hidden md:flex flex-col w-64 border-r border-white/5 bg-slate-950/50 p-4">
                  <div className="flex flex-col gap-1 mb-6 px-1">
                    <span className="text-[10px] text-muted-foreground tracking-widest font-semibold uppercase">Workspace</span>
                    <div className="flex items-center gap-2 mt-1 px-2 py-1.5 bg-white/5 rounded-md cursor-pointer border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-white/90 flex-1">Marketing</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground rotate-90" />
                    </div>
                  </div>
                  
                  <div className="relative mb-5">
                    <div className="w-full h-8 bg-white/5 rounded-md border border-white/5 flex items-center px-3">
                      <span className="text-xs text-muted-foreground">Buscar notas...</span>
                    </div>
                  </div>
                  
                  <button className="w-full h-9 bg-white/10 hover:bg-white/15 transition-colors rounded-md border border-white/10 flex items-center justify-center gap-2 mb-6 text-white text-sm font-medium">
                    Nueva nota
                  </button>

                  <div className="flex-1 overflow-y-auto pr-1">
                    <div className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-3 px-2">NOTAS DEL WORKSPACE</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 text-sm text-white/70 cursor-pointer">
                        <div className="w-4 h-4 rounded-full border-2 border-green-400 shrink-0 bg-green-400/20 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="truncate flex-1 line-through">📝 Estrategia Q1</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/10 text-sm text-white font-medium cursor-pointer border border-white/5">
                        <div className="w-4 h-4 rounded-full border-2 border-violet-400 shrink-0" />
                        <span className="truncate flex-1">🚀 Lanzamiento Q3</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 text-sm text-white/60 cursor-pointer">
                        <div className="w-4 h-4 rounded-full border-2 border-white/40 shrink-0" />
                        <span className="truncate flex-1">💡 Ideas creativas</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 text-sm text-white/60 cursor-pointer">
                        <div className="w-4 h-4 rounded-full border-2 border-white/40 shrink-0" />
                        <span className="truncate flex-1">📊 Analíticas mensuales</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 flex flex-col relative bg-slate-900/30">
                  {/* Top bar */}
                  <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-slate-900/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                      <span className="hidden sm:inline font-medium text-violet-300">Marketing</span>
                      <span className="hidden sm:inline">/</span>
                      <span className="text-white/70 truncate">🚀 Lanzamiento Q3</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Badge variant="outline" className="bg-orange-500/10 border-orange-500/20 text-xs text-orange-400 gap-1.5 py-1 px-2.5">
                        <Target className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Tarea activa</span>
                        <span className="sm:hidden">Tarea</span>
                      </Badge>
                      <Badge variant="outline" className="bg-violet-500/10 border-violet-500/20 text-xs text-violet-400 gap-1.5 py-1 px-2.5 cursor-pointer hover:bg-violet-500/20 transition-colors">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">IA</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Editor Content */}
                  <div className="flex-1 p-5 sm:p-8 md:p-10 overflow-y-auto">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="max-w-3xl mx-auto relative"
                    >
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="text-3xl sm:text-4xl">🚀</span> Plan de Lanzamiento Q3
                      </h1>
                      
                      <div className="space-y-4 sm:space-y-5 text-white/70 text-sm sm:text-base leading-relaxed">
                        <p>
                          El objetivo de este trimestre es lanzar el nuevo "Ecosistema de Productividad" donde las <strong className="text-white">Notas y Tareas están 100% enlazadas dentro del mismo Workspace</strong>.
                        </p>
                        
                        <div className="pl-4 sm:pl-5 border-l-2 border-violet-500/40 py-1 my-5 sm:my-6 bg-violet-500/5 rounded-r-lg pr-4">
                          <p className="text-white/90 italic text-sm">
                            💡 <strong>Concepto clave:</strong> Esta nota ES una tarea. Cuando la marque como completada en mi tablero Kanban, esta nota entera se marcará como completada automáticamente.
                          </p>
                        </div>
                        
                        <p>
                          Acciones acordadas en la reunión de hoy:
                        </p>
                        
                        <ul className="list-disc pl-5 sm:pl-6 space-y-2 sm:space-y-3 text-white/80 marker:text-violet-500">
                          <li>Rediseñar la landing page para reflejar el ecosistema completo (Para este viernes).</li>
                          <li>Preparar la campaña de email marketing para usuarios inactivos.</li>
                          <li>Grabar el video demostrativo de cómo funciona la vinculación Nota-Tarea.</li>
                        </ul>

                        <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <ListChecks className="h-4 w-4 text-violet-400" />
                            <span className="text-sm font-medium text-white">Estado de esta nota/tarea:</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border-2 border-violet-400" />
                            <span className="text-sm text-white/70">Pendiente (Importancia: 9/10)</span>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                    
                    {/* Simulated completion popover */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 20 }}
                      className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 w-[calc(100%-3rem)] sm:w-80 rounded-xl border border-white/10 bg-slate-800/95 backdrop-blur-xl p-4 sm:p-5 shadow-2xl shadow-violet-900/20"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-green-500/20">
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          </div>
                          <span className="text-sm font-semibold text-white">Vinculación activa</span>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
                        Esta nota está vinculada a una tarea en tu Kanban. <strong className="text-white">Si completas la tarea, esta nota se marcará como completada automáticamente.</strong>
                      </p>
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-xs font-medium text-white transition-all shadow-lg shadow-green-500/20">
                          Ver en Kanban
                        </button>
                      </div>
                    </motion.div>

                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CÓMO FUNCIONA — 3 pasos
        ═══════════════════════════════════════════ */}
        <section id="como-funciona" className="py-20 sm:py-28 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-16"
            >
              <p className="text-sm font-medium text-violet-400 mb-3 tracking-wide uppercase">Cómo funciona</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                Tres pasos para dominar tu día
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
                Olvídate de organizar manualmente. Deja que la IA haga el trabajo pesado.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  title: "Captura tus ideas",
                  description:
                    "Escribe en tus Notas todo lo que pasa por tu mente. Documenta reuniones, ideas o emails sin preocuparte por el formato.",
                  icon: MessageSquare,
                  gradient: "from-violet-500/80 to-purple-600/80",
                },
                {
                  step: "02",
                  title: "La IA extrae y organiza",
                  description:
                    "El asistente IA analiza tu texto, deduce las tareas accionables, fechas límite, recurrencia y les asigna una prioridad (1-10).",
                  icon: Brain,
                  gradient: "from-fuchsia-500/80 to-pink-600/80",
                },
                {
                  step: "03",
                  title: "Ejecuta y sincroniza",
                  description:
                    "Tus tareas aparecen en el Calendario y se sincronizan con Google Calendar. Completa la tarea y tu Nota se actualizará sola.",
                  icon: Target,
                  gradient: "from-pink-500/80 to-rose-600/80",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="text-center"
                >
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 bg-gradient-to-br shadow-lg",
                      item.gradient
                    )}
                  >
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-violet-400 mb-2 tracking-widest">{item.step}</p>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FEATURES — grid de 6 (más limpio)
        ═══════════════════════════════════════════ */}
        <section id="funcionalidades" className="py-20 sm:py-28 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-16"
            >
              <p className="text-sm font-medium text-violet-400 mb-3 tracking-wide uppercase">Funcionalidades</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                Todo lo que necesitas para ser productivo
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
                Herramientas potentes diseñadas para simplificar tu flujo de trabajo.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
              <FeatureCard
                icon={Brain}
                title="IA que prioriza y extrae"
                description="Analiza tus notas o texto libre, extrae tareas, asigna fechas y prioriza del 1 al 10 automáticamente."
                gradient="from-violet-500/80 to-purple-600/80"
                index={0}
              />
              <FeatureCard
                icon={MessageSquare}
                title="Editor de Notas Inteligente"
                description="Resumen, traducción, mejora de redacción y checklists a un clic gracias al asistente de IA integrado."
                gradient="from-blue-500/80 to-cyan-600/80"
                index={1}
              />
              <FeatureCard
                icon={Calendar}
                title="Google Calendar integrado"
                description="Sincronización bidireccional. Tus tareas aparecen en tu calendario y revisamos tu disponibilidad (Free/Busy)."
                gradient="from-amber-500/80 to-orange-600/80"
                index={2}
              />
              <FeatureCard
                icon={Rocket}
                title="Generador de Prompts (Devs)"
                description="La IA genera prompts altamente contextualizados para tu IDE (Cursor, Copilot) basados en la tarea."
                gradient="from-emerald-500/80 to-green-600/80"
                index={3}
              />
              <FeatureCard
                icon={LayoutGrid}
                title="Vista Kanban y Subtareas"
                description="Arrastra y suelta tareas entre columnas o desglosa tareas complejas en subtareas más pequeñas."
                gradient="from-fuchsia-500/80 to-pink-600/80"
                index={4}
              />
              <FeatureCard
                icon={FolderKanban}
                title="Workspaces Aislados"
                description="Organiza tu vida personal, trabajo o proyectos en espacios separados, cada uno con sus propias instrucciones para la IA."
                gradient="from-indigo-500/80 to-blue-600/80"
                index={5}
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            AI HIGHLIGHT — la IA en acción
        ═══════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-transparent to-transparent" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-sm font-medium text-violet-400 mb-3 tracking-wide uppercase">El cerebro del ecosistema</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                  Deja que la IA organice tu vida
                </h2>
                <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed">
                  Tarely analiza el contexto de tus notas o textos libres, entiende tus necesidades y estructura tu trabajo automáticamente para que tú solo te enfoques en ejecutar.
                </p>
                <ul className="space-y-3">
                  {[
                    "Extracción de tareas desde notas de reuniones",
                    "Deducción automática de fechas límite y recurrencia",
                    "Asistente en el editor: resume, traduce y mejora",
                    "Priorización inteligente del 1 al 10",
                  ].map((feature, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2 className="h-4.5 w-4.5 text-violet-400 shrink-0 mt-0.5" />
                      <span className="text-white/70 text-sm">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl blur-2xl" />
                <div className="relative p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-slate-900/70 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-xs text-muted-foreground">IA procesando...</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-4">
                    <p className="text-xs sm:text-sm text-muted-foreground/70 italic leading-relaxed">
                      &ldquo;Mañana tengo que enviar el presupuesto a Carlos. Además, acordamos en la reunión revisar los bugs de QA todos los viernes a primera hora.&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-xs text-white/80">Tareas extraídas por IA:</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { task: "Enviar presupuesto a Carlos", priority: 9, due: "Mañana", color: "bg-red-500/15 text-red-400 border-red-500/20" },
                      { task: "Revisar bugs de QA", priority: 7, due: "Cada Viernes", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.12, duration: 0.3 }}
                        className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full border-2 border-violet-400/40 shrink-0" />
                          <span className="text-xs sm:text-sm text-white/70 flex-1">{item.task}</span>
                          <Badge variant="outline" className={cn("text-[10px]", item.color)}>
                            {item.priority}/10
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 pl-7">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{item.due}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            TESTIMONIALS
        ═══════════════════════════════════════════ */}
        <section id="testimonios" className="py-20 sm:py-28 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-16"
            >
              <p className="text-sm font-medium text-violet-400 mb-3 tracking-wide uppercase">Testimonios</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                Lo que dicen nuestros usuarios
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
                Miles de personas ya organizan su caos con Tarely.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
              <TestimonialCard
                quote="Antes usaba Notion para notas, Todoist para tareas y Calendar. Ahora tengo todo en Tarely y la IA me ahorra horas cada semana."
                author="María García"
                role="Product Manager"
                index={0}
              />
              <TestimonialCard
                quote="La priorización automática es genial, pero la extracción de tareas de las actas de reunión me voló la cabeza."
                author="Carlos Ruiz"
                role="Desarrollador Senior"
                index={1}
              />
              <TestimonialCard
                quote="El mejor ecosistema que he probado. Simple, rápido y la IA entiende perfectamente mis rutinas y necesidades."
                author="Laura Martínez"
                role="Freelance Designer"
                index={2}
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CTA FINAL
        ═══════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-violet-950/30 to-transparent" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                ¿Listo para dejar de procrastinar?
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-7 sm:mb-9 leading-relaxed">
                Únete a miles de personas que ya organizan su caos con Tarely.
                <br className="hidden sm:block" />{" "}
                Empieza gratis, sin compromiso.
              </p>
              <Link href="/registro">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 h-13 sm:h-14 px-10 text-base sm:text-lg shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all"
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Empezar gratis ahora
                </Button>
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-6 text-xs sm:text-sm text-muted-foreground/60">
                <span>Sin tarjeta de crédito</span>
                <span className="hidden sm:inline">·</span>
                <span>Gratis para siempre</span>
                <span className="hidden sm:inline">·</span>
                <span>Cancela cuando quieras</span>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 sm:py-12 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            {/* Top row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo/logo_tarely_bg.png"
                  alt="Tarely"
                  width={28}
                  height={28}
                  className="h-6 w-6 object-contain"
                />
                <span className="font-semibold text-sm bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Tarely
                </span>
              </div>
              <nav className="flex items-center gap-5 text-xs sm:text-sm">
                <a href="#como-funciona" className="text-muted-foreground hover:text-white transition-colors">
                  Cómo funciona
                </a>
                <a href="#funcionalidades" className="text-muted-foreground hover:text-white transition-colors">
                  Funcionalidades
                </a>
                <a href="#testimonios" className="text-muted-foreground hover:text-white transition-colors">
                  Testimonios
                </a>
              </nav>
            </div>
            {/* Bottom row - Legal links */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5">
              <p className="text-xs text-muted-foreground/60">
                © 2026 Tarely. Todos los derechos reservados.
              </p>
              <nav className="flex items-center gap-4 text-xs">
                <Link href="/politica-de-privacidad" className="text-muted-foreground/60 hover:text-white transition-colors">
                  Política de Privacidad
                </Link>
                <span className="text-muted-foreground/30">·</span>
                <Link href="/terminos-y-condiciones" className="text-muted-foreground/60 hover:text-white transition-colors">
                  Términos y Condiciones
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
