"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, FileText, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppNavLinks() {
  const pathname = usePathname();
  const isOnNotes = pathname.startsWith("/notes");
  const isOnCalendar = pathname.startsWith("/calendario");

  return (
    <>
      {/* Si estamos en Notes, mostrar enlace a Tareas. Si estamos en otra parte, mostrar enlace a Notes */}
      {isOnNotes ? (
        <Link
          href="/app"
          className="flex items-center gap-1.5 px-2 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <LayoutGrid className="h-4.5 w-4.5" />
          <span>Tareas</span>
        </Link>
      ) : (
        <Link
          href="/notes"
          className={cn(
            "flex items-center gap-1.5 px-2 py-2.5 rounded-md text-sm font-medium transition-colors",
            "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <FileText className="h-4.5 w-4.5" />
          <span>Notas</span>
        </Link>
      )}
      <Link
        href="/calendario"
        className={cn(
          "flex items-center gap-1.5 px-2 py-2.5 rounded-md text-sm font-medium transition-colors",
          isOnCalendar
            ? "text-foreground bg-accent/50"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
      >
        <Calendar className="h-4.5 w-4.5" />
        <span className="hidden sm:inline">Calendario</span>
      </Link>
    </>
  );
}
