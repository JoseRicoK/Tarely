import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const reorderSchema = z.object({
  workspaceIds: z.array(z.string().uuid()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceIds } = reorderSchema.parse(body);

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const updates = workspaceIds.map((id, index) => ({
      id,
      sort_order: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from("workspaces")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id)
        .eq("user_id", user.id);

      if (error) {
        console.error(`Error actualizando workspace ${update.id}:`, error);
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error reordenando workspaces:", error);
    return NextResponse.json(
      { error: "Error al reordenar workspaces" },
      { status: 500 }
    );
  }
}
