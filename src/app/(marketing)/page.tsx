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
  const words = ["emails", "ideas", "notas", "reuniones", "proyectos"];
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
  const placeholderText =
    "Tengo varios correos pendientes, un bug urgente y no sé por dónde empezar…";

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
                <span className="text-xs sm:text-sm text-violet-300">Potenciado con IA</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="text-[2.25rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5 sm:mb-6"
              >
                <span className="text-white">Convierte el caos en</span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  tareas claras
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
                Pega tus <AnimatedText />, una idea o un texto desordenado.{" "}
                <span className="text-white/80">Tarely lo organiza por ti en segundos.</span>
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
                      placeholder={placeholderText}
                      className="w-full h-20 sm:h-24 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/30 transition-all"
                    />
                    <div className="absolute bottom-3 right-3">
                      <Badge variant="outline" className="bg-violet-500/10 border-violet-500/20 text-[10px] text-violet-400">
                        <Sparkles className="h-2.5 w-2.5 mr-1" />
                        IA
                      </Badge>
                    </div>
                    {showTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-11 left-1/2 -translate-x-1/2 px-4 py-2 bg-violet-600 text-white text-xs rounded-lg whitespace-nowrap"
                      >
                        ¡Regístrate gratis para organizar tu caos!
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-violet-600 rotate-45" />
                      </motion.div>
                    )}
                  </div>

                  {/* AI Processing indicator */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Tareas detectadas por IA</span>
                  </div>

                  {/* Task list */}
                  <div className="space-y-2">
                    {[
                      { task: "Responder emails urgentes", priority: 10, color: "bg-red-500/20 text-red-400 border-red-500/20" },
                      { task: "Revisar bug en producción", priority: 8, color: "bg-orange-500/20 text-orange-400 border-orange-500/20" },
                      { task: "Preparar reunión de equipo", priority: 6, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20" },
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
                        <span className="text-sm text-white/80 flex-1">{item.task}</span>
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
                  title: "Pega tu caos",
                  description:
                    "Copia y pega ese email, esas notas de la reunión o esa lista mental que tienes en la cabeza.",
                  icon: MessageSquare,
                  gradient: "from-violet-500/80 to-purple-600/80",
                },
                {
                  step: "02",
                  title: "La IA organiza",
                  description:
                    "Nuestra IA extrae las tareas, las prioriza por importancia y las categoriza automáticamente.",
                  icon: Brain,
                  gradient: "from-fuchsia-500/80 to-pink-600/80",
                },
                {
                  step: "03",
                  title: "Ejecuta sin estrés",
                  description:
                    "Tarely te muestra exactamente qué hacer primero para ser más productivo.",
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
                title="IA que prioriza"
                description="Analiza tus tareas y asigna importancia del 1 al 10. Siempre sabrás qué hacer primero."
                gradient="from-violet-500/80 to-purple-600/80"
                index={0}
              />
              <FeatureCard
                icon={FolderKanban}
                title="Workspaces"
                description="Organiza todo en espacios separados. Proyectos, vida personal, ideas... cada cosa en su lugar."
                gradient="from-blue-500/80 to-cyan-600/80"
                index={1}
              />
              <FeatureCard
                icon={LayoutGrid}
                title="Vista Kanban"
                description="Arrastra y suelta tareas entre columnas. Visualiza tu progreso de forma clara e intuitiva."
                gradient="from-fuchsia-500/80 to-pink-600/80"
                index={2}
              />
              <FeatureCard
                icon={ListChecks}
                title="Subtareas inteligentes"
                description="Divide tareas grandes en pasos pequeños. La IA genera subtareas automáticamente."
                gradient="from-emerald-500/80 to-green-600/80"
                index={3}
              />
              <FeatureCard
                icon={Calendar}
                title="Calendario integrado"
                description="Todas tus tareas con fecha límite en un calendario. Nunca más olvides una deadline."
                gradient="from-amber-500/80 to-orange-600/80"
                index={4}
              />
              <FeatureCard
                icon={Users}
                title="Colaboración en equipo"
                description="Invita a tu equipo, asigna tareas y trabaja juntos en tiempo real."
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
                <p className="text-sm font-medium text-violet-400 mb-3 tracking-wide uppercase">Potenciado por IA</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                  Deja de pensar en qué hacer primero
                </h2>
                <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed">
                  Tarely analiza el contexto de tus tareas y determina cuáles son más urgentes e importantes. Tú solo
                  tienes que escribir.
                </p>
                <ul className="space-y-3">
                  {[
                    "Extracción automática de tareas desde texto",
                    "Priorización inteligente del 1 al 10",
                    "Generación de subtareas automáticas",
                    "Instrucciones personalizadas por workspace",
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
                      &ldquo;Mañana tengo que enviar el presupuesto al cliente, revisar los bugs que reportó QA,
                      y preparar la presentación para el viernes...&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-xs text-white/80">Tareas detectadas:</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { task: "Enviar presupuesto al cliente", priority: 9, color: "bg-red-500/15 text-red-400 border-red-500/20" },
                      { task: "Revisar bugs de QA", priority: 8, color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
                      { task: "Preparar presentación", priority: 7, color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.12, duration: 0.3 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-violet-400/40 shrink-0" />
                        <span className="text-xs sm:text-sm text-white/70 flex-1">{item.task}</span>
                        <Badge variant="outline" className={cn("text-[10px]", item.color)}>
                          {item.priority}/10
                        </Badge>
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
                quote="Antes tardaba 30 minutos en organizar mi día. Ahora pego mis notas y en segundos tengo todo listo."
                author="María García"
                role="Product Manager"
                index={0}
              />
              <TestimonialCard
                quote="La priorización automática es genial. Ya no me agobio pensando en qué hacer primero."
                author="Carlos Ruiz"
                role="Desarrollador Senior"
                index={1}
              />
              <TestimonialCard
                quote="El mejor gestor de tareas que he probado. Simple, rápido y la IA realmente entiende lo que necesito."
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
