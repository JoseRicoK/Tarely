"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
          <Mail className="w-12 h-12 text-purple-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Revisa tu correo!
        </h1>

        <p className="text-gray-600 mb-6">
          Te hemos enviado un correo electrónico a{" "}
          {email && <strong className="text-gray-900">{email}</strong>}
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-800">
            Haz clic en el enlace del correo para confirmar tu cuenta y comenzar a usar TareAI.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <p className="text-sm text-gray-500">
            ¿No recibiste el correo? Revisa tu carpeta de spam o correo no deseado.
          </p>
        </div>

        <Link href="/login">
          <Button variant="outline" className="w-full" size="lg">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Login
          </Button>
        </Link>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            El enlace de confirmación expirará en 24 horas por seguridad.
          </p>
        </div>
      </Card>
    </div>
  );
}
