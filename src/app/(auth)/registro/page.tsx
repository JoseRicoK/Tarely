"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, Mail, Lock, User, Sparkles, AlertCircle, Shuffle } from "lucide-react";
import Image from "next/image";

// Generar array de 20 avatares: avatar1.png, avatar2.png, ..., avatar20.png
const AVATARS = Array.from({ length: 20 }, (_, i) => `avatar${i + 1}.png`);

// Función para obtener un avatar aleatorio
const getRandomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];

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
  const [selectedAvatar, setSelectedAvatar] = useState(getRandomAvatar());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Handler para generar avatar aleatorio
  const handleGenerateAvatar = () => {
    const randomAvatar = getRandomAvatar();
    setSelectedAvatar(randomAvatar);
    toast.success("Avatar generado aleatoriamente");
  };

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

      // Redirigir a la página de confirmación de email
      router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
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
        {/* Card con glassmorphism */}
        <div className="relative group">
          {/* Borde gradiente animado */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-xy" />
          
          <div className="relative bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <Image
                  src="/logo/logo_tarely_bg.png"
                  alt="Tarely"
                  width={60}
                  height={60}
                  className="h-16 w-16 object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:drop-shadow-[0_0_35px_rgba(59,130,246,0.6)] transition-all duration-300"
                  priority
                />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-1">
                Crear Cuenta
              </h1>
              <p className="text-muted-foreground text-xs">
                Únete a Tarely y gestiona tus tareas con IA
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar y botón en la misma fila */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Avatar</Label>
                <div className="flex items-center gap-4">
                  {/* Avatar preview */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-sm opacity-50" />
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
                      <Image
                        src={`${supabaseUrl}/storage/v1/object/public/avatars/${selectedAvatar}`}
                        alt="Avatar seleccionado"
                        fill
                        sizes="80px"
                        className="object-cover object-center"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                  
                  {/* Botón generar */}
                  <div className="flex-1 space-y-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateAvatar}
                      className="w-full bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50"
                    >
                      <Shuffle className="mr-2 h-4 w-4" />
                      Generar aleatorio
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Podrás subir tu imagen desde tu perfil
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-medium">Nombre</Label>
                <div className="relative group/input">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors ${
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
                  <p className="text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium">Correo electrónico</Label>
                <div className="relative group/input">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors ${
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
                  <p className="text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-medium">Contraseña</Label>
                  <div className="relative group/input">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors ${
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
                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirmar</Label>
                  <div className="relative group/input">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors ${
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
                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.02]"
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
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 text-muted-foreground">
                  ¿Ya tienes cuenta?
                </span>
              </div>
            </div>

            <p className="text-center text-sm">
              <Link 
                href="/login" 
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors hover:underline underline-offset-4"
              >
                Inicia sesión aquí
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
