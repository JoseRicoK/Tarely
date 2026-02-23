import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://tarely.com"),
  alternates: {
    canonical: "/",
    languages: {
      "es-ES": "/",
    },
  },
  title: "Tarely — Tu Ecosistema de Productividad con IA | Tareas, Notas y Calendario",
  description:
    "Más que un gestor de tareas. Tarely conecta tus notas, tareas y calendario con Inteligencia Artificial. Convierte texto en tareas, resume documentos y planifica tu día automáticamente. Gratis para siempre.",
  keywords: [
    "gestor de tareas",
    "tareas inteligentes",
    "gestor de tareas con IA",
    "productividad",
    "organizar proyectos",
    "inteligencia artificial",
    "organizar tareas",
    "notas inteligentes",
    "gestor de notas",
    "calendario inteligente",
    "sincronización google calendar",
    "ecosistema de productividad",
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
    title: "Tarely — Tu Ecosistema de Productividad con IA",
    description:
      "Conecta tus notas, tareas y calendario en un solo lugar. Tarely usa Inteligencia Artificial para organizar tu caos en segundos. Gratis para siempre.",
    type: "website",
    locale: "es_ES",
    siteName: "Tarely",
    url: "https://tarely.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarely — Tu Ecosistema de Productividad con IA",
    description:
      "Más que un gestor de tareas. Conecta tus notas, tareas y calendario con Inteligencia Artificial. Gratis para siempre.",
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
    "Ecosistema de productividad con Inteligencia Artificial que integra gestión de tareas, notas interactivas y calendario.",
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
    "Generación de tareas con IA",
    "Editor de notas inteligente",
    "Integración con Google Calendar",
    "Asistente IA transversal",
    "Workspaces personalizables",
    "Vista Kanban y Calendario",
    "Subtareas y recurrencia",
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
    <div data-force-dark className="dark min-h-screen text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {children}
    </div>
  );
}
