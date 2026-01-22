import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { UserMenu, UserProvider } from "@/components/auth";
import { Calendar } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TareAI - Gestión de Tareas con IA",
  description: "Genera y organiza tareas con ayuda de inteligencia artificial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen relative`}
      >
        <UserProvider>
        {/* Fondo global sutil */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-background to-slate-950" />
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="flex min-h-screen flex-col relative">
          <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
              <a href="/" className="flex items-center gap-2 font-bold text-lg group">
                <span className="text-xl group-hover:scale-110 transition-transform">🤖</span>
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">TareAI</span>
              </a>
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
              TareAI - Gestión inteligente de tareas ✨
            </div>
          </footer>
        </div>
        <Toaster position="bottom-right" richColors closeButton />
        </UserProvider>
      </body>
    </html>
  );
}
