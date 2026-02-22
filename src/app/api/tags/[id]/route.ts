import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/tags/[id] - Actualizar etiqueta
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.color !== undefined) updateData.color = body.color;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
  }

  const { data: tag, error } = await supabase
    .from("workspace_tags")
    .update(updateData as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json({ error: "Error al actualizar etiqueta" }, { status: 500 });
  }

  const t = tag as unknown as { id: string; workspace_id: string; name: string; color: string; created_at: string; updated_at: string };
  return NextResponse.json({
    id: t.id,
    workspaceId: t.workspace_id,
    name: t.name,
    color: t.color,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  });
}

// DELETE /api/tags/[id] - Eliminar etiqueta
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { error } = await supabase
    .from("workspace_tags")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Error al eliminar etiqueta" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
