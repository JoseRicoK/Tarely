import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "@/components/ui/sonner";
import { UserMenu, UserProvider } from "@/components/auth";
import { Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Tarely - Gestión de Tareas con IA",
  description: "Genera y organiza tareas con ayuda de inteligencia artificial",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      {/* Fondo global sutil */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-background to-slate-950" />
        <div className="absolute top-0 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-500/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="flex min-h-screen flex-col relative overflow-x-hidden">
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
            <Link href="/app" className="flex items-center gap-2 font-bold text-lg group">
              <Image
                src="/logo/logo_tarely_bg.png"
                alt="Tarely"
                width={32}
                height={32}
                className="h-7 w-7 sm:h-8 sm:w-8 object-contain group-hover:scale-105 transition-transform"
                priority
              />
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Tarely</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/calendario"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendario</span>
              </Link>
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
        <footer className="border-t border-white/5 py-4 bg-background/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground/60">
            Tarely - Gestión inteligente de tareas ✨
          </div>
        </footer>
      </div>
      <Toaster position="bottom-right" richColors closeButton />
    </UserProvider>
  );
}
