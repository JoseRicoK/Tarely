"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function ConfirmSuccessContent() {
  const searchParams = useSearchParams();
  const already = searchParams.get("already");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Fondo oscuro */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Card principal */}
      <div className="max-w-lg w-full">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative">
          {/* Borde superior verde */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-t-2xl" />
          
          {/* Icono de éxito */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-lg opacity-40" />
            <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-center mb-4 text-white">
            {already ? "Ya estás confirmado" : "¡Cuenta Confirmada!"}
          </h1>

          {/* Mensaje */}
          <p className="text-slate-300 text-center mb-8">
            {already
              ? "Tu correo ya había sido confirmado. Puedes iniciar sesión en tu cuenta."
              : "Tu correo ha sido confirmado exitosamente. ¡Bienvenido a Tarely!"}
          </p>

          {/* Mensaje destacado solo si es nuevo */}
          {!already && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-200">
                  Ya puedes comenzar a gestionar tus tareas con el poder de la IA.
                </p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col gap-3">
            <Link href="/login">
              <Button className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0">
                Iniciar Sesión
              </Button>
            </Link>

            <Link href="/">
              <Button variant="outline" className="w-full h-11 bg-white/5 border-white/10 hover:bg-white/10 text-white">
                Volver al Inicio
              </Button>
            </Link>
          </div>

          {/* Footer */}
          {!already && (
            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <p className="text-xs text-slate-400">
                Revisa tu correo, te hemos enviado un mensaje de bienvenida 📧
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-500" />
    </div>
  );
}

export default function ConfirmSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmSuccessContent />
    </Suspense>
  );
}
