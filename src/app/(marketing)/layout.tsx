import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarely - Convierte el caos en tareas claras y priorizadas | IA",
  description:
    "Pega un email, una idea o un texto desordenado. Tarely lo organiza por ti en segundos con IA. Priorización automática, workspaces, kanban y más. Gratis para siempre.",
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
    "IA tareas",
  ],
  openGraph: {
    title: "Tarely - Convierte el caos en tareas claras y priorizadas",
    description:
      "Pega un email, una idea o un texto desordenado. Tarely lo organiza por ti en segundos con IA.",
    type: "website",
    locale: "es_ES",
    siteName: "Tarely",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarely - Convierte el caos en tareas claras y priorizadas",
    description:
      "Pega un email, una idea o un texto desordenado. Tarely lo organiza por ti en segundos con IA.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Este layout no tiene header/footer porque la landing page tiene los suyos propios
  return <>{children}</>;
}
