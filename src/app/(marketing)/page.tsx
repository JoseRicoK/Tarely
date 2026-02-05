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
  Zap,
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
  Layers,
  Clock,
  Star,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Componente de texto animado para el hero
function AnimatedText() {
  const words = ["emails", "ideas", "notas", "reuniones", "proyectos"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={cn(
        "inline-block transition-all duration-300 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent",
        isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      )}
    >
      {words[currentIndex]}
    </span>
  );
}

// Feature Card con animación
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <div
      className="group relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm hover:border-white/20 transition-all duration-500 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl",
          gradient
        )}
      />
      <div
        className={cn(
          "inline-flex p-3 rounded-xl mb-4",
          gradient.replace("from-", "bg-").split(" ")[0] + "/20"
        )}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// Testimonial Card
function TestimonialCard({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-white/80 mb-4 italic">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="font-medium text-white">{author}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

// Stat Card
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const placeholderText =
    "Tengo varios correos pendientes, un bug urgente y no sé por dónde empezar…";

  // Cuando el usuario escribe algo, mostrar tooltip y redirigir después de un momento
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.length > 10 && !showTooltip) {
      setShowTooltip(true);
      // Redirigir al registro después de 2 segundos de escribir
      setTimeout(() => {
        router.push("/registro");
      }, 1500);
    }
  };

  const handleInputFocus = () => {
    // Mostrar tooltip al hacer focus
    setShowTooltip(true);
  };

  return (
    <div className="relative min-h-screen">
      {/* Gradient backgrounds */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-background to-slate-950" />
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-violet-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
            <Image
              src="/logo/logo_tarely_bg.png"
              alt="Tarely"
              width={40}
              height={40}
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain group-hover:scale-105 transition-transform"
              priority
            />
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Tarely
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Funcionalidades
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Cómo funciona
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Testimonios
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-white">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/registro">
              <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0">
                Empezar gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 md:pt-32 md:pb-40 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span className="text-sm text-white/80">Potenciado con Inteligencia Artificial</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                <span className="text-white">Convierte el caos en</span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  tareas claras y priorizadas
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Pega tus <AnimatedText />, una idea o un texto desordenado.
                <br />
                <span className="text-white/90">Tarely lo organiza por ti en segundos.</span>
              </p>

              {/* Fake Input - IMPORTANTE */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500" />
                  <div className="relative">
                    <textarea
                      value={inputValue}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      placeholder={placeholderText}
                      className="w-full h-32 p-5 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                      <Badge variant="outline" className="bg-white/5 border-white/10 text-xs">
                        <Sparkles className="h-3 w-3 mr-1 text-violet-400" />
                        IA
                      </Badge>
                    </div>
                    {/* Tooltip indicando que deben registrarse */}
                    {showTooltip && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-violet-600 text-white text-sm rounded-lg whitespace-nowrap animate-bounce">
                        ¡Regístrate gratis para organizar tu caos!
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-violet-600 rotate-45" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                  <Link href="/registro" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 h-12 px-8 text-base"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      Organizar mi caos
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Sin tarjeta de crédito · Gratis para siempre
                  </p>
                </div>
              </div>

              {/* Social Proof */}
              <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-white/5">
                <StatCard value="1,000+" label="Usuarios activos" />
                <StatCard value="50K+" label="Tareas organizadas" />
                <StatCard value="4.9" label="Valoración" />
              </div>
            </div>
          </div>
        </section>

        {/* Demo Visual */}
        <section className="py-16 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-pink-600/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm overflow-hidden shadow-2xl">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-slate-900/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-full bg-white/5 text-xs text-muted-foreground">
                      tarely.com/app
                    </div>
                  </div>
                </div>
                {/* Preview Content */}
                <div className="p-6 md:p-8">
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Workspace Cards Preview */}
                    {[
                      { name: "Proyecto Web", color: "from-blue-500 to-cyan-500", tasks: 5 },
                      { name: "Marketing", color: "from-fuchsia-500 to-pink-500", tasks: 3 },
                      { name: "Personal", color: "from-amber-500 to-orange-500", tasks: 8 },
                    ].map((workspace, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className={`w-full h-1.5 rounded-full bg-gradient-to-r ${workspace.color} mb-4`} />
                        <h4 className="font-medium text-white mb-1">{workspace.name}</h4>
                        <p className="text-sm text-muted-foreground">{workspace.tasks} tareas pendientes</p>
                      </div>
                    ))}
                  </div>
                  {/* Task Preview */}
                  <div className="mt-6 p-4 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="h-5 w-5 text-violet-400" />
                      <span className="text-sm text-muted-foreground">IA organizando...</span>
                    </div>
                    <div className="space-y-2">
                      {["Responder emails urgentes", "Revisar bug en producción", "Preparar reunión"].map(
                        (task, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 animate-pulse"
                            style={{ animationDelay: `${i * 200}ms` }}
                          >
                            <div className="w-5 h-5 rounded-full border-2 border-violet-400/50" />
                            <span className="text-sm text-white/80">{task}</span>
                            <Badge variant="outline" className="ml-auto text-xs">
                              {10 - i * 2}/10
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-24 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 bg-white/5 border-white/10">
                Cómo funciona
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Tres pasos para dominar tu día
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Olvídate de organizar manualmente. Deja que la IA haga el trabajo pesado.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: "01",
                  title: "Pega tu caos",
                  description:
                    "Copia y pega ese email interminable, esas notas de la reunión o esa lista mental que tienes en la cabeza.",
                  icon: MessageSquare,
                  gradient: "from-violet-500 to-purple-500",
                },
                {
                  step: "02",
                  title: "La IA organiza",
                  description:
                    "Nuestra IA analiza tu texto, extrae las tareas, las prioriza por importancia y las categoriza automáticamente.",
                  icon: Brain,
                  gradient: "from-fuchsia-500 to-pink-500",
                },
                {
                  step: "03",
                  title: "Ejecuta sin estrés",
                  description:
                    "Empieza por lo más importante. Tarely te muestra exactamente qué hacer primero para ser más productivo.",
                  icon: Target,
                  gradient: "from-pink-500 to-rose-500",
                },
              ].map((item, i) => (
                <div key={i} className="relative">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/4 right-0 translate-x-1/2 w-16 h-px bg-gradient-to-r from-white/20 to-transparent" />
                  )}
                  <div className="text-center">
                    <div
                      className={cn(
                        "inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-gradient-to-br",
                        item.gradient
                      )}
                    >
                      <item.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-sm font-medium text-violet-400 mb-2">{item.step}</div>
                    <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 bg-white/5 border-white/10">
                Funcionalidades
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Todo lo que necesitas para ser productivo
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Herramientas potentes diseñadas para simplificar tu flujo de trabajo.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <FeatureCard
                icon={Brain}
                title="IA que prioriza"
                description="Analiza tus tareas y asigna importancia del 1 al 10 automáticamente. Siempre sabrás qué hacer primero."
                gradient="from-violet-500/20 to-purple-500/20"
                delay={0}
              />
              <FeatureCard
                icon={FolderKanban}
                title="Workspaces"
                description="Organiza todo en espacios de trabajo separados. Proyectos, vida personal, ideas... cada cosa en su lugar."
                gradient="from-blue-500/20 to-cyan-500/20"
                delay={100}
              />
              <FeatureCard
                icon={Layers}
                title="Secciones personalizables"
                description="Crea tus propios estados: Pendientes, En progreso, Revisión, Completadas... tú decides cómo organizar."
                gradient="from-fuchsia-500/20 to-pink-500/20"
                delay={200}
              />
              <FeatureCard
                icon={LayoutGrid}
                title="Vista Kanban"
                description="Arrastra y suelta tareas entre columnas. Visualiza tu progreso de forma clara e intuitiva."
                gradient="from-amber-500/20 to-orange-500/20"
                delay={300}
              />
              <FeatureCard
                icon={ListChecks}
                title="Subtareas"
                description="Divide tareas grandes en pasos más pequeños. La IA también puede generar subtareas automáticamente."
                gradient="from-emerald-500/20 to-green-500/20"
                delay={400}
              />
              <FeatureCard
                icon={Calendar}
                title="Calendario integrado"
                description="Visualiza todas tus tareas con fecha límite en un calendario. Nunca más olvides una deadline."
                gradient="from-rose-500/20 to-red-500/20"
                delay={500}
              />
              <FeatureCard
                icon={Users}
                title="Colaboración"
                description="Invita a tu equipo, asigna tareas y trabaja juntos en tiempo real. Compartir es vivir."
                gradient="from-indigo-500/20 to-blue-500/20"
                delay={600}
              />
              <FeatureCard
                icon={Clock}
                title="Tareas vencidas"
                description="Alerta visual de tareas pasadas de fecha. Mantén el control de lo que necesita atención urgente."
                gradient="from-orange-500/20 to-red-500/20"
                delay={700}
              />
              <FeatureCard
                icon={Zap}
                title="Rápido y simple"
                description="Interfaz limpia y moderna. Sin distracciones, sin complicaciones. Solo tú y tus tareas."
                gradient="from-yellow-500/20 to-amber-500/20"
                delay={800}
              />
            </div>
          </div>
        </section>

        {/* AI Feature Highlight */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/50 to-transparent" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <Badge variant="outline" className="mb-4 bg-violet-500/10 border-violet-500/30 text-violet-400">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Potenciado por IA
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Deja de pensar en qué hacer primero
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  La inteligencia artificial de Tarely analiza el contexto de tus tareas y determina cuáles son más
                  urgentes e importantes. Tú solo tienes que escribir y dejar que la magia ocurra.
                </p>
                <ul className="space-y-4">
                  {[
                    "Extracción automática de tareas desde texto",
                    "Priorización inteligente del 1 al 10",
                    "Generación de subtareas automáticas",
                    "Instrucciones personalizadas por workspace",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 rounded-3xl blur-2xl" />
                <div className="relative p-6 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-sm text-muted-foreground">IA procesando...</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 mb-4">
                    <p className="text-sm text-muted-foreground italic">
                      &ldquo;Mañana tengo que enviar el presupuesto al cliente, revisar los bugs que reportó QA,
                      y preparar la presentación para el viernes...&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span className="text-sm text-white">Tareas detectadas:</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { task: "Enviar presupuesto al cliente", priority: 9 },
                      { task: "Revisar bugs de QA", priority: 8 },
                      { task: "Preparar presentación", priority: 7 },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                      >
                        <div className="w-5 h-5 rounded-full border-2 border-violet-400/50" />
                        <span className="text-sm text-white/80 flex-1">{item.task}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            item.priority >= 9
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : item.priority >= 7
                              ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          )}
                        >
                          {item.priority}/10
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 bg-white/5 border-white/10">
                Testimonios
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Lo que dicen nuestros usuarios
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Miles de personas ya organizan su caos con Tarely.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <TestimonialCard
                quote="Antes tardaba 30 minutos en organizar mi día. Ahora pego mis notas y en segundos tengo todo listo. Increíble."
                author="María García"
                role="Product Manager"
              />
              <TestimonialCard
                quote="La priorización automática es genial. Ya no me agobio pensando en qué hacer primero, la IA lo decide por mí."
                author="Carlos Ruiz"
                role="Desarrollador Senior"
              />
              <TestimonialCard
                quote="El mejor gestor de tareas que he probado. Simple, rápido y la IA realmente entiende lo que necesito."
                author="Laura Martínez"
                role="Freelance Designer"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-violet-950/50 to-transparent" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                ¿Listo para dejar de procrastinar?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Únete a miles de personas que ya organizan su caos con Tarely.
                <br />
                Empieza gratis, sin compromiso.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/registro">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 h-14 px-10 text-lg"
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Empezar gratis ahora
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                ✓ Sin tarjeta de crédito &nbsp;&nbsp; ✓ Gratis para siempre &nbsp;&nbsp; ✓ Cancela cuando quieras
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Image
                src="/logo/logo_tarely_bg.png"
                alt="Tarely"
                width={32}
                height={32}
                className="h-7 w-7 object-contain"
              />
              <span className="font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Tarely
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <a href="#features" className="text-muted-foreground hover:text-white transition-colors">
                Funcionalidades
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-white transition-colors">
                Cómo funciona
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-white transition-colors">
                Testimonios
              </a>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2026 Tarely. Gestión inteligente de tareas ✨
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
