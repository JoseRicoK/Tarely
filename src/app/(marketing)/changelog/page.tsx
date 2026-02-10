import type { Metadata } from "next";
import { ChangelogContent } from "./changelog-content";

export const metadata: Metadata = {
  title: "Changelog — Tarely | Novedades y actualizaciones",
  description:
    "Descubre todas las novedades, mejoras y correcciones de Tarely. Mantente al día con las últimas actualizaciones de tu gestor de tareas con IA.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: "Changelog — Tarely | Novedades y actualizaciones",
    description:
      "Descubre todas las novedades, mejoras y correcciones de Tarely. Mantente al día con las últimas actualizaciones.",
    type: "website",
    url: "https://tarely.com/changelog",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ChangelogPage() {
  return <ChangelogContent />;
}
