"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function ConfirmErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, { title: string; message: string; icon: React.ReactNode }> = {
    token_missing: {
      title: "Token no encontrado",
      message: "No se proporcionó un token de confirmación. Revisa el enlace en tu correo.",
      icon: <Mail className="w-10 h-10 text-red-400" />,
    },
    invalid_token: {
      title: "Token inválido",
      message: "El token de confirmación no es válido o ya fue utilizado.",
      icon: <XCircle className="w-10 h-10 text-red-400" />,
    },
    token_expired: {
      title: "Token expirado",
      message: "El enlace de confirmación ha expirado (24h). Solicita un nuevo registro.",
      icon: <Clock className="w-10 h-10 text-red-400" />,
    },
    creation_failed: {
      title: "Error al crear usuario",
      message: "No se pudo crear tu cuenta. Inténtalo de nuevo.",
      icon: <AlertCircle className="w-10 h-10 text-red-400" />,
    },
    profile_failed: {
      title: "Error al crear perfil",
      message: "Hubo un problema al configurar tu cuenta. Contacta con soporte.",
      icon: <AlertCircle className="w-10 h-10 text-red-400" />,
    },
  };

  const currentError = errorMessages[error || ""] || {
    title: "Error inesperado",
    message: "Ocurrió un error inesperado. Por favor, contacta con soporte.",
    icon: <AlertCircle className="w-10 h-10 text-red-400" />,
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Fondo oscuro */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/15 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Card principal */}
      <div className="max-w-lg w-full">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Borde superior rojo */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-t-2xl" />
          
          {/* Icono de error */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-lg opacity-40" />
            <div className="relative w-full h-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-full flex items-center justify-center">
              {currentError.icon}
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-center mb-3 text-white">
            {currentError.title}
          </h1>

          {/* Mensaje */}
          <p className="text-slate-300 text-center mb-8 text-sm">
            {currentError.message}
          </p>

          {/* Botones */}
          <div className="space-y-3">
            <Link href="/registro">
              <Button className="w-full h-11 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0">
                Registrarse de nuevo
              </Button>
            </Link>

            <Link href="/login">
              <Button variant="outline" className="w-full h-11 bg-white/5 border-white/10 hover:bg-white/10 text-white">
                Ir a Iniciar Sesión
              </Button>
            </Link>

            <Link href="/">
              <Button variant="ghost" className="w-full h-11 text-slate-400 hover:text-white hover:bg-white/5">
                Volver al Inicio
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500">
              ¿Necesitas ayuda? Contacta con nuestro equipo de soporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ConfirmErrorContent />
    </Suspense>
  );
}
