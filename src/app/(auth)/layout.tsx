import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-force-dark className="dark min-h-screen text-foreground">
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
