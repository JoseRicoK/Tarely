"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Mail, ArrowLeft, AlertCircle, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const validateEmail = (value: string) => {
    if (!value) return "El correo es obligatorio";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Correo no válido";
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    setError(emailError);
    setTouched(true);

    if (emailError) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al procesar la solicitud");
        return;
      }

      setEmailSent(true);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  // Vista de email enviado
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Fondo oscuro */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/15 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="max-w-lg w-full">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-t-2xl" />

            {/* Icono */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full blur-lg opacity-40" />
              <div className="relative w-full h-full bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-4 text-white">
              ¡Revisa tu correo!
            </h1>

            <p className="text-slate-300 text-center mb-4">
              Te hemos enviado un enlace para restablecer tu contraseña a
            </p>

            <div className="bg-slate-800/50 border border-amber-500/20 rounded-xl p-4 mb-6">
              <p className="text-white font-semibold text-center break-all">
                {email}
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-200 text-center">
                Haz clic en el enlace del correo para crear una nueva contraseña. El enlace expirará en <span className="font-semibold text-white">1 hora</span>.
              </p>
            </div>

            <div className="mb-6 space-y-1 text-center">
              <p className="text-sm text-slate-400">
                ¿No recibiste el correo?
              </p>
              <p className="text-xs text-slate-500">
                Revisa tu carpeta de spam o correo no deseado
              </p>
            </div>

            <Link href="/login">
              <Button
                variant="outline"
                className="w-full h-11 bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de solicitud
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
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="text-muted-foreground text-sm">
                Ingresa tu correo y te enviaremos un enlace para restablecerla
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <div className="relative group/input">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                    touched && error ? "text-red-400" : "text-muted-foreground group-focus-within/input:text-amber-400"
                  }`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (touched) {
                        setError(validateEmail(e.target.value));
                      }
                    }}
                    onBlur={() => {
                      setTouched(true);
                      setError(validateEmail(email));
                    }}
                    className={`pl-10 h-11 bg-white/5 border-white/10 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all ${
                      touched && error ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20" : ""
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {touched && error && (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
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
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar enlace de recuperación
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
