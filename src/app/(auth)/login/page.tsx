"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Mail, Lock, Sparkles, AlertCircle } from "lucide-react";

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (value: string) => {
    if (!value) return "El correo es obligatorio";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Correo no válido";
    return undefined;
  };

  const validatePassword = (value: string) => {
    if (!value) return "La contraseña es obligatoria";
    if (value.length < 6) return "Mínimo 6 caracteres";
    return undefined;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === "email") {
      setErrors(prev => ({ ...prev, email: validateEmail(email) }));
    } else if (field === "password") {
      setErrors(prev => ({ ...prev, password: validatePassword(password) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los campos
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setErrors({ email: emailError, password: passwordError });
    setTouched({ email: true, password: true });
    
    if (emailError || passwordError) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Mostrar error específico del servidor
        if (data.error?.includes("Invalid login")) {
          setErrors({ password: "Correo o contraseña incorrectos" });
        } else {
          toast.error(data.error || "Error al iniciar sesión");
        }
        return;
      }

      toast.success("¡Bienvenido!");
      // Forzar navegación completa para refrescar el header
      window.location.href = "/";
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClassName = (field: keyof FieldErrors) => {
    const hasError = touched[field] && errors[field];
    return `pl-10 h-11 bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all ${
      hasError ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20" : ""
    }`;
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      {/* Fondo con efectos */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradiente base */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-background to-blue-950/30" />
        
        {/* Orbes de luz */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/25 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-[80px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/15 rounded-full blur-[60px] animate-pulse delay-2000" />
        
        {/* Grid pattern sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      <div className="w-full max-w-md">
        {/* Card con glassmorphism */}
        <div className="relative group">
          {/* Borde gradiente animado */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-xy" />
          
          <div className="relative bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-6">
                <Image
                  src="/logo/logo_tarely_bg.png"
                  alt="Tarely"
                  width={80}
                  height={80}
                  className="h-20 w-20 object-contain drop-shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:drop-shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all duration-300"
                  priority
                />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2">
                Iniciar Sesión
              </h1>
              <p className="text-muted-foreground text-sm">
                Accede a tu cuenta de Tarely
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <div className="relative group/input">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    touched.email && errors.email ? "text-red-400" : "text-muted-foreground group-focus-within/input:text-purple-400"
                  }`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (touched.email) {
                        setErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
                      }
                    }}
                    onBlur={() => handleBlur("email")}
                    className={getInputClassName("email")}
                    disabled={isLoading}
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative group/input">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    touched.password && errors.password ? "text-red-400" : "text-muted-foreground group-focus-within/input:text-purple-400"
                  }`} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (touched.password) {
                        setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
                      }
                    }}
                    onBlur={() => handleBlur("password")}
                    className={getInputClassName("password")}
                    disabled={isLoading}
                  />
                </div>
                {touched.password && errors.password && (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 text-muted-foreground">
                  ¿Nuevo aquí?
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link 
                href="/registro" 
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors hover:underline underline-offset-4"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          Gestiona tus tareas con el poder de la IA ✨
        </p>
      </div>
    </div>
  );
}
