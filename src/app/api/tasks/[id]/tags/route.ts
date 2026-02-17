import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tasks/[id]/tags - Obtener tags de una tarea
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id: taskId } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("task_tags")
    .select("id, tag_id, workspace_tags(id, name, color)")
    .eq("task_id", taskId);

  if (error) {
    console.error("Error fetching task tags:", error);
    return NextResponse.json({ error: "Error al obtener etiquetas" }, { status: 500 });
  }

  const tags = (data || []).map((row: Record<string, unknown>) => {
    const tag = row.workspace_tags as { id: string; name: string; color: string } | null;
    return {
      id: row.id as string,
      tagId: row.tag_id as string,
      name: tag?.name || "",
      color: tag?.color || "#6366f1",
    };
  });

  return NextResponse.json(tags);
}

// POST /api/tasks/[id]/tags - Asignar tag a tarea
export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id: taskId } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { tagId } = body;

  if (!tagId) {
    return NextResponse.json({ error: "tagId es requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("task_tags")
    .insert({
      task_id: taskId,
      tag_id: tagId,
    } as unknown as never)
    .select("id, tag_id, workspace_tags(id, name, color)")
    .single();

  if (error) {
    // Si es duplicado, no hacer nada
    if (error.code === "23505") {
      return NextResponse.json({ error: "La etiqueta ya está asignada" }, { status: 409 });
    }
    console.error("Error assigning tag:", error);
    return NextResponse.json({ error: "Error al asignar etiqueta" }, { status: 500 });
  }

  const row = data as unknown as { id: string; tag_id: string; workspace_tags: { id: string; name: string; color: string } };
  return NextResponse.json({
    id: row.id,
    tagId: row.tag_id,
    name: row.workspace_tags?.name || "",
    color: row.workspace_tags?.color || "#6366f1",
  });
}

// DELETE /api/tasks/[id]/tags - Quitar tag de tarea
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id: taskId } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get("tagId");

  if (!tagId) {
    return NextResponse.json({ error: "tagId es requerido" }, { status: 400 });
  }

  const { error } = await supabase
    .from("task_tags")
    .delete()
    .eq("task_id", taskId)
    .eq("tag_id", tagId);

  if (error) {
    console.error("Error removing tag:", error);
    return NextResponse.json({ error: "Error al quitar etiqueta" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
