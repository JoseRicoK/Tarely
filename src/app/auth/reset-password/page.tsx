"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Lock, ArrowLeft, AlertCircle, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);

  const validatePassword = (value: string) => {
    if (!value) return "La contraseña es obligatoria";
    if (value.length < 6) return "Mínimo 6 caracteres";
    return undefined;
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) return "Confirma tu contraseña";
    if (value !== password) return "Las contraseñas no coinciden";
    return undefined;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === "password") {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
      if (touched.confirmPassword && confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: validateConfirmPassword(confirmPassword),
        }));
      }
    } else if (field === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(confirmPassword),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(confirmPassword);

    setErrors({ password: passwordError, confirmPassword: confirmError });
    setTouched({ password: true, confirmPassword: true });

    if (passwordError || confirmError) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al restablecer la contraseña");
        return;
      }

      setSuccess(true);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClassName = (field: keyof FieldErrors) => {
    const hasError = touched[field] && errors[field];
    return `pl-10 h-11 bg-white/5 border-white/10 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all ${
      hasError ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20" : ""
    }`;
  };

  // Sin token => error
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/15 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="max-w-lg w-full">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-t-2xl" />

            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-lg opacity-40" />
              <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-4 text-white">
              Enlace no válido
            </h1>
            <p className="text-slate-300 text-center mb-8">
              El enlace para restablecer tu contraseña no es válido o ha expirado. Solicita uno nuevo.
            </p>

            <div className="flex flex-col gap-3">
              <Link href="/auth/forgot-password">
                <Button className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                  Solicitar nuevo enlace
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full h-11 bg-white/5 border-white/10 hover:bg-white/10 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Éxito
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="max-w-lg w-full">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-t-2xl" />

            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-lg opacity-40" />
              <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-4 text-white">
              ¡Contraseña actualizada!
            </h1>
            <p className="text-slate-300 text-center mb-4">
              Tu contraseña se ha restablecido correctamente.
            </p>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-200">
                  Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>
            </div>

            <Link href="/login">
              <Button className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de nueva contraseña
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      {/* Fondo con efectos */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-background to-blue-950/30" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/25 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-yellow-500/20 rounded-full blur-[80px] animate-float" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      <div className="w-full max-w-md">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-xy" />

          <div className="relative bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-6">
                <Image
                  src="/logo/logo_tarely_bg.png"
                  alt="Tarely"
                  width={80}
                  height={80}
                  className="h-20 w-20 object-contain drop-shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:drop-shadow-[0_0_35px_rgba(245,158,11,0.6)] transition-all duration-300"
                  priority
                />
              </div>
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full mb-4">
                <KeyRound className="w-7 h-7 text-amber-400" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-amber-200 to-orange-200 bg-clip-text text-transparent mb-2">
                Nueva Contraseña
              </h1>
              <p className="text-muted-foreground text-sm">
                Ingresa tu nueva contraseña para tu cuenta
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Nueva contraseña
                </Label>
                <div className="relative group/input">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    touched.password && errors.password ? "text-red-400" : "text-muted-foreground group-focus-within/input:text-amber-400"
                  }`} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (touched.password) {
                        setErrors((prev) => ({
                          ...prev,
                          password: validatePassword(e.target.value),
                        }));
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmar contraseña
                </Label>
                <div className="relative group/input">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    touched.confirmPassword && errors.confirmPassword ? "text-red-400" : "text-muted-foreground group-focus-within/input:text-amber-400"
                  }`} />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (touched.confirmPassword) {
                        setErrors((prev) => ({
                          ...prev,
                          confirmPassword: validateConfirmPassword(e.target.value),
                        }));
                      }
                    }}
                    onBlur={() => handleBlur("confirmPassword")}
                    className={getInputClassName("confirmPassword")}
                    disabled={isLoading}
                  />
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Restablecer Contraseña
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              <Link
                href="/login"
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors hover:underline underline-offset-4 inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver a Iniciar Sesión
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          Gestiona tus tareas con el poder de la IA ✨
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
