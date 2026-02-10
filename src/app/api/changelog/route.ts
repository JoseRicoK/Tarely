import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Obtener todo el changelog (público, para la página /changelog)
export async function GET() {
  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entries, error } = await (supabase as any)
      .from("changelog")
      .select(`
        *,
        changelog_sections (
          *,
          changelog_items (*)
        )
      `)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching changelog:", error);
      return NextResponse.json({ error: "Error al cargar changelog" }, { status: 500 });
    }

    // Ordenar secciones e items por sort_order
    const sorted = (entries || []).map((entry: Record<string, unknown>) => ({
      ...entry,
      changelog_sections: ((entry.changelog_sections as Array<Record<string, unknown>>) || [])
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.sort_order as number) - (b.sort_order as number))
        .map((section: Record<string, unknown>) => ({
          ...section,
          changelog_items: ((section.changelog_items as Array<Record<string, unknown>>) || [])
            .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.sort_order as number) - (b.sort_order as number)),
        })),
    }));

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Error in GET /api/changelog:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
