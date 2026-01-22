import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/sections/reorder - Reorder sections
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { sections } = body;

  if (!sections || !Array.isArray(sections)) {
    return NextResponse.json({ error: "sections array es requerido" }, { status: 400 });
  }

  try {
    // Update each section's order
    for (const section of sections) {
      if (!section.id || typeof section.order !== "number") {
        continue;
      }

      await supabase
        .from("workspace_sections")
        .update({ order: section.order, updated_at: new Date().toISOString() } as unknown as never)
        .eq("id", section.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering sections:", error);
    return NextResponse.json({ error: "Error al reordenar secciones" }, { status: 500 });
  }
}
