import { Suspense } from "react";
import { NotesPageClient } from "./NotesPageClient";

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-pulse text-muted-foreground text-sm">Cargando...</div></div>}>
      <NotesPageClient />
    </Suspense>
  );
}
