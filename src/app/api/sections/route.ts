import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Type for workspace_sections table (until Supabase types are regenerated)
interface WorkspaceSectionRow {
  id: string;
  workspace_id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// GET /api/sections?workspaceId=xxx - Obtener secciones de un workspace
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

  const { data: sections, error } = await supabase
    .from("workspace_sections")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("order", { ascending: true });

  if (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json({ error: "Error al obtener secciones" }, { status: 500 });
  }

  // Mapear a formato camelCase
  const mappedSections = (sections as unknown as WorkspaceSectionRow[]).map((s) => ({
    id: s.id,
    workspaceId: s.workspace_id,
    name: s.name,
    icon: s.icon,
    color: s.color,
    order: s.order,
    isSystem: s.is_system,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }));

  return NextResponse.json(mappedSections);
}

// POST /api/sections - Crear nueva sección
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { workspaceId, name, icon, color } = body;

  if (!workspaceId || !name) {
    return NextResponse.json({ error: "workspaceId y name son requeridos" }, { status: 400 });
  }

  // Verificar que el usuario es dueño del workspace
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (wsError || !workspace) {
    return NextResponse.json({ error: "Workspace no encontrado o sin permisos" }, { status: 403 });
  }

  // Obtener el orden máximo actual
  const { data: maxOrderData } = await supabase
    .from("workspace_sections")
    .select("order")
    .eq("workspace_id", workspaceId)
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const newOrder = ((maxOrderData as { order?: number } | null)?.order ?? -1) + 1;

  const { data: section, error } = await supabase
    .from("workspace_sections")
    .insert({
      workspace_id: workspaceId,
      name: name.trim(),
      icon: icon || "folder",
      color: color || "#8b5cf6",
      order: newOrder,
      is_system: false,
    } as unknown as never)
    .select()
    .single();

  if (error) {
    console.error("Error creating section:", error);
    return NextResponse.json({ error: "Error al crear sección" }, { status: 500 });
  }

  const sectionRow = section as unknown as WorkspaceSectionRow;
  return NextResponse.json({
    id: sectionRow.id,
    workspaceId: sectionRow.workspace_id,
    name: sectionRow.name,
    icon: sectionRow.icon,
    color: sectionRow.color,
    order: sectionRow.order,
    isSystem: sectionRow.is_system,
    createdAt: sectionRow.created_at,
    updatedAt: sectionRow.updated_at,
  });
}
