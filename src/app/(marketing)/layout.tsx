import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://tarely.com"),
  alternates: {
    canonical: "/",
    languages: {
      "es-ES": "/",
    },
  },
  title: "Tarely — Convierte el caos en tareas claras con IA | Gestor de tareas inteligente",
  description:
    "Pega un email, una idea o un texto desordenado y Tarely lo organiza por ti en segundos con inteligencia artificial. Priorización automática, workspaces, vista Kanban, subtareas y calendario. Gratis para siempre.",
  keywords: [
    "gestor de tareas",
    "gestor de tareas con IA",
    "productividad",
    "inteligencia artificial",
    "organizar tareas",
    "priorizar tareas automáticamente",
    "kanban",
    "to-do list",
    "gestión de proyectos",
    "tarely",
    "app de productividad",
    "organizar emails",
    "lista de tareas inteligente",
    "planificador de tareas",
    "gestión del tiempo",
    "herramienta de productividad gratis",
  ],
  openGraph: {
    title: "Tarely — Convierte el caos en tareas claras con IA",
    description:
      "Pega un email, una idea o un texto desordenado. Tarely lo organiza por ti en segundos con inteligencia artificial. Gratis para siempre.",
    type: "website",
    locale: "es_ES",
    siteName: "Tarely",
    url: "https://tarely.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarely — Convierte el caos en tareas claras con IA",
    description:
      "Pega un email, una idea o un texto desordenado. Tarely lo organiza por ti en segundos con inteligencia artificial.",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  other: {
    "google-site-verification": "",
  },
};

// JSON-LD Structured Data para SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tarely",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  url: "https://tarely.com",
  description:
    "Gestor de tareas con inteligencia artificial que convierte texto desordenado en tareas claras y priorizadas automáticamente.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "1000",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "Priorización automática con IA",
    "Workspaces personalizables",
    "Vista Kanban",
    "Subtareas inteligentes",
    "Calendario integrado",
    "Colaboración en equipo",
  ],
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tarely",
  url: "https://tarely.com",
  logo: "https://tarely.com/logo/logo_tarely_bg.png",
  description: "Gestor de tareas inteligente potenciado por IA.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {children}
    </>
  );
}
