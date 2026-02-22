import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Types for database rows
interface WorkspaceTagRow {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// GET /api/tags?workspaceId=xxx - Obtener tags de un workspace
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId es requerido" }, { status: 400 });
  }

  const { data: tags, error } = await supabase
    .from("workspace_tags")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Error al obtener etiquetas" }, { status: 500 });
  }

  const mappedTags = (tags as unknown as WorkspaceTagRow[]).map((t) => ({
    id: t.id,
    workspaceId: t.workspace_id,
    name: t.name,
    color: t.color,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  return NextResponse.json(mappedTags);
}

// POST /api/tags - Crear nueva etiqueta
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { workspaceId, name, color } = body;

  if (!workspaceId || !name) {
    return NextResponse.json({ error: "workspaceId y name son requeridos" }, { status: 400 });
  }

  if (name.trim().length > 50) {
    return NextResponse.json({ error: "El nombre no puede tener más de 50 caracteres" }, { status: 400 });
  }

  const { data: tag, error } = await supabase
    .from("workspace_tags")
    .insert({
      workspace_id: workspaceId,
      name: name.trim(),
      color: color || "#6366f1",
    } as unknown as never)
    .select()
    .single();

  if (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "Error al crear etiqueta" }, { status: 500 });
  }

  const tagRow = tag as unknown as WorkspaceTagRow;
  return NextResponse.json({
    id: tagRow.id,
    workspaceId: tagRow.workspace_id,
    name: tagRow.name,
    color: tagRow.color,
    createdAt: tagRow.created_at,
    updatedAt: tagRow.updated_at,
  });
}
