"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Fondo oscuro */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/15 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Card principal */}
      <div className="max-w-lg w-full">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Borde superior */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-t-2xl" />
          
          {/* Icono */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-lg opacity-40" />
            <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-center mb-4 text-white">
            ¡Revisa tu correo!
          </h1>

          {/* Texto */}
          <p className="text-slate-300 text-center mb-4">
            Te hemos enviado un correo a
          </p>

          {/* Email destacado */}
          {email && (
            <div className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4 mb-6">
              <p className="text-white font-semibold text-center break-all">
                {email}
              </p>
            </div>
          )}

          {/* Instrucciones */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-200 text-center">
              Haz clic en el enlace del correo para confirmar tu cuenta y comenzar a usar <span className="font-semibold text-white">Tarely</span>.
            </p>
          </div>

          {/* Ayuda */}
          <div className="mb-6 space-y-1 text-center">
            <p className="text-sm text-slate-400">
              ¿No recibiste el correo?
            </p>
            <p className="text-xs text-slate-500">
              Revisa tu carpeta de spam o correo no deseado
            </p>
          </div>

          {/* Botón */}
          <Link href="/login">
            <Button 
              variant="outline" 
              className="w-full h-11 bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Login
            </Button>
          </Link>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500">
              El enlace expirará en 24 horas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
