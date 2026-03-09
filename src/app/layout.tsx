import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@/components/google-analytics";
import { CookieBanner } from "@/components/cookie-banner";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { getUserLocale } from '@/lib/locale';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tarely.com"),
  title: {
    default: "Tarely — Gestor de tareas inteligente con IA",
    template: "%s | Tarely",
  },
  description:
    "Pega un email, una idea o un texto desordenado y Tarely lo organiza por ti en segundos con inteligencia artificial. Priorización automática, workspaces, kanban y más.",
  keywords: [
    "gestor de tareas",
    "gestor de tareas con IA",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getUserLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen relative`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
        <GoogleAnalytics />
        <CookieBanner />
      </body>
    </html>
  );
}
