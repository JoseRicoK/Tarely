import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Tarely - Convierte el caos en tareas claras y priorizadas",
  description: "Pega un email, una idea o un texto desordenado. Tarely lo organiza por ti en segundos con IA. Priorización automática, workspaces, kanban y más.",
  keywords: [
    "gestor de tareas",
    "productividad",
    "inteligencia artificial",
    "organizar tareas",
    "priorizar tareas",
    "kanban",
    "to-do list",
    "gestión de proyectos",
    "tarely",
  ],
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
        {children}
      </body>
    </html>
  );
}
