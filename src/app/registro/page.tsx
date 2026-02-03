"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, Mail, Lock, User, Sparkles, Check, AlertCircle, Send } from "lucide-react";
import Image from "next/image";

const AVATARS = [
  "avatar1.png",
  "avatar2.png",
  "avatar3.png",
  "avatar4.png",
  "avatar5.png",
  "avatar6.png",
];

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Validaciones
  const validateName = (value: string) => {
    if (!value.trim()) return "El nombre es obligatorio";
    if (value.length < 2) return "Mínimo 2 caracteres";
    return undefined;
  };

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

  const validateConfirmPassword = (value: string) => {
    if (!value) return "Confirma la contraseña";
    if (value !== password) return "No coinciden";
    return undefined;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const validators: Record<string, (v: string) => string | undefined> = {
      name: validateName,
      email: validateEmail,
      password: validatePassword,
      confirmPassword: validateConfirmPassword,
    };
    
    const value = { name, email, password, confirmPassword }[field] || "";
    setErrors(prev => ({ ...prev, [field]: validators[field]?.(value) }));
  };

  const getInputClassName = (field: keyof FieldErrors) => {
    const hasError = touched[field] && errors[field];
    return `pl-10 h-11 bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all ${
      hasError ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20" : ""
    }`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los campos
    const newErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword),
    };
    
    setErrors(newErrors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    
    if (Object.values(newErrors).some(e => e)) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          password,
          avatar: selectedAvatar 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Mostrar error específico del servidor
        if (data.error?.includes("already registered")) {
          setErrors(prev => ({ ...prev, email: "Este correo ya está registrado" }));
        } else if (data.error?.includes("nombre ya está en uso") || data.error?.includes("username")) {
          setErrors(prev => ({ ...prev, name: "Este nombre ya está en uso" }));
        } else {
          toast.error(data.error || "Error al registrarse");
        }
        return;
      }

      // Mostrar mensaje de verificación de email
      setRegisteredEmail(email);
      setShowVerificationMessage(true);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      {/* Fondo con efectos */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradiente base */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-background to-purple-950/30" />
        
        {/* Orbes de luz */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/25 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-500/20 rounded-full blur-[80px] animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-cyan-500/15 rounded-full blur-[60px] animate-pulse delay-2000" />
        
        {/* Grid pattern sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      <div className="w-full max-w-md">
        {/* Mensaje de verificación de email */}
        {showVerificationMessage ? (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000" />
            
            <div className="relative bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-6 shadow-lg shadow-green-500/25">
                <Send className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-3">
                ¡Revisa tu correo!
              </h2>
              
              <p className="text-muted-foreground mb-4">
                Hemos enviado un enlace de verificación a:
              </p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 mb-6">
                <Mail className="w-4 h-4 text-purple-400" />
                <span className="font-medium text-white">{registeredEmail}</span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6">
                Haz clic en el enlace del correo para activar tu cuenta y poder iniciar sesión.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                >
                  Ir a Iniciar Sesión
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  ¿No recibes el correo? Revisa tu carpeta de spam
                </p>
              </div>
            </div>
          </div>
        ) : (
        /* Card con glassmorphism */
        <div className="relative group">
          {/* Borde gradiente animado */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-xy" />
          
          <div className="relative bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-6">
                <img
                  src="/logo/logo_tarely_bg.png"
                  alt="Tarely"
                  className="h-20 w-20 object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:drop-shadow-[0_0_35px_rgba(59,130,246,0.6)] transition-all duration-300"
                />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-2">
                Crear Cuenta
              </h1>
              <p className="text-muted-foreground text-sm">
                Únete a Tarely y gestiona tus tareas con IA
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selector de Avatar */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Elige tu avatar</Label>
                <div className="flex flex-wrap gap-3 justify-center p-3 rounded-xl bg-white/5 border border-white/10">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      title={`Seleccionar ${avatar}`}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-300 ${
                        selectedAvatar === avatar
                          ? "border-purple-500 ring-2 ring-purple-500/50 ring-offset-2 ring-offset-background scale-110"
                          : "border-white/20 hover:border-white/40 hover:scale-105"
                      }`}
                    >
                      <Image
                        src={`${supabaseUrl}/storage/v1/object/public/avatars/${avatar}`}
                        alt={`Avatar ${avatar}`}
                        fill
                        sizes="48px"
                        className="object-cover object-center"
                        style={{ objectFit: 'cover' }}
                      />
                      {selectedAvatar === avatar && (
                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nombre</Label>
                <div className="relative group/input">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    touched.name && errors.name ? "text-red-400" : "text-muted-foreground group-focus-within/input:text-purple-400"
                  }`} />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (touched.name) setErrors(prev => ({ ...prev, name: validateName(e.target.value) }));
                    }}
                    onBlur={() => handleBlur("name")}
                    className={getInputClassName("name")}
                    disabled={isLoading}
                  />
                </div>
                {touched.name && errors.name && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
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
                      if (touched.email) setErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
                    }}
                    onBlur={() => handleBlur("email")}
                    className={getInputClassName("email")}
                    disabled={isLoading}
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                  <div className="relative group/input">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                      touched.password && errors.password ? "text-red-400" : "text-muted-foreground group-focus-within/input:text-purple-400"
                    }`} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (touched.password) setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
                      }}
                      onBlur={() => handleBlur("password")}
                      className={getInputClassName("password")}
                      disabled={isLoading}
                    />
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar</Label>
                  <div className="relative group/input">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                      touched.confirmPassword && errors.confirmPassword ? "text-red-400" : "text-muted-foreground group-focus-within/input:text-purple-400"
                    }`} />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (touched.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(e.target.value) }));
                      }}
                      onBlur={() => handleBlur("confirmPassword")}
                      className={getInputClassName("confirmPassword")}
                      disabled={isLoading}
                    />
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.02] mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Crear Cuenta
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background/80 px-2 text-muted-foreground">
                  ¿Ya tienes cuenta?
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              <Link 
                href="/login" 
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors hover:underline underline-offset-4"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
        )}

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          Gestiona tus tareas con el poder de la IA ✨
        </p>
      </div>
    </div>
  );
}
