"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ConfirmSuccessPage() {
  const searchParams = useSearchParams();
  const already = searchParams.get("already");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {already ? "Ya estás confirmado" : "¡Correo Confirmado!"}
        </h1>

        <p className="text-gray-600 mb-8">
          {already
            ? "Tu correo electrónico ya había sido confirmado previamente. Puedes iniciar sesión en tu cuenta."
            : "Tu dirección de correo electrónico ha sido confirmada exitosamente. Ya puedes comenzar a usar TareAI."}
        </p>

        <div className="space-y-3">
          <Link href="/login" className="block">
            <Button className="w-full" size="lg">
              Iniciar Sesión
            </Button>
          </Link>

          <Link href="/" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Volver al Inicio
            </Button>
          </Link>
        </div>

        {!already && (
          <p className="text-sm text-gray-500 mt-6">
            ¡Bienvenido a TareAI! Revisa tu correo, te hemos enviado información adicional.
          </p>
        )}
      </Card>
    </div>
  );
}
