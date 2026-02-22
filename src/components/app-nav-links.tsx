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
    <div className="flex items-center gap-1 sm:gap-2">
      <Link
        href={isOnNotes ? "/app" : "/notes"}
        className="flex items-center gap-1.5 px-2 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      >
        {isOnNotes ? <LayoutGrid className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}
        <span className="hidden sm:inline">{isOnNotes ? "Tareas" : "Notas"}</span>
      </Link>
      
      <Link
        href={isOnCalendar ? "/app" : "/calendario"}
        className="flex items-center gap-1.5 px-2 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      >
        {isOnCalendar ? <LayoutGrid className="h-4.5 w-4.5" /> : <Calendar className="h-4.5 w-4.5" />}
        <span className="hidden sm:inline">{isOnCalendar ? "Tareas" : "Calendario"}</span>
      </Link>
    </div>
  );
}
