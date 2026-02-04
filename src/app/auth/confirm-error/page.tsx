"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Mail, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ConfirmErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, { title: string; message: string; icon: React.ReactNode }> = {
    token_missing: {
      title: "Token no encontrado",
      message: "No se proporcionó un token de confirmación. Por favor, revisa el enlace en tu correo electrónico.",
      icon: <Mail className="w-12 h-12 text-red-600" />,
    },
    invalid_token: {
      title: "Token inválido",
      message: "El token de confirmación no es válido o ya fue utilizado. Por favor, solicita un nuevo correo de confirmación.",
      icon: <XCircle className="w-12 h-12 text-red-600" />,
    },
    token_expired: {
      title: "Token expirado",
      message: "El enlace de confirmación ha expirado. Por favor, solicita un nuevo correo de confirmación.",
      icon: <Clock className="w-12 h-12 text-red-600" />,
    },
    update_failed: {
      title: "Error del servidor",
      message: "Hubo un problema al confirmar tu correo. Por favor, inténtalo de nuevo más tarde.",
      icon: <AlertCircle className="w-12 h-12 text-red-600" />,
    },
  };

  const currentError = errorMessages[error || ""] || {
    title: "Error desconocido",
    message: "Ocurrió un error inesperado. Por favor, contacta con soporte.",
    icon: <AlertCircle className="w-12 h-12 text-red-600" />,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          {currentError.icon}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {currentError.title}
        </h1>

        <p className="text-gray-600 mb-8">
          {currentError.message}
        </p>

        <div className="space-y-3">
          <Link href="/registro" className="block">
            <Button className="w-full" size="lg">
              Registrarse de nuevo
            </Button>
          </Link>

          <Link href="/login" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Ir a Iniciar Sesión
            </Button>
          </Link>

          <Link href="/" className="block">
            <Button variant="ghost" className="w-full" size="lg">
              Volver al Inicio
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          ¿Necesitas ayuda? Contacta con nuestro equipo de soporte.
        </p>
      </Card>
    </div>
  );
}
