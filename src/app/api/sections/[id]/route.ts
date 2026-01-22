import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

// GET /api/sections/[id] - Obtener una sección
export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: sectionData, error } = await supabase
    .from("workspace_sections")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !sectionData) {
    return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
  }

  const section = sectionData as unknown as WorkspaceSectionRow;
  return NextResponse.json({
    id: section.id,
    workspaceId: section.workspace_id,
    name: section.name,
    icon: section.icon,
    color: section.color,
    order: section.order,
    isSystem: section.is_system,
    createdAt: section.created_at,
    updatedAt: section.updated_at,
  });
}

// PATCH /api/sections/[id] - Actualizar sección
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, icon, color, order } = body;

  // Verificar que la sección existe y pertenece a un workspace del usuario
  const { data: sectionData, error: sectionError } = await supabase
    .from("workspace_sections")
    .select("*, workspaces!inner(user_id)")
    .eq("id", id)
    .single();

  if (sectionError || !sectionData) {
    return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
  }

  const section = sectionData as unknown as WorkspaceSectionRow & { workspaces: { user_id: string } };
  
  // Verificar que el usuario es dueño del workspace
  if (section.workspaces.user_id !== user.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  // Construir objeto de actualización
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updateData.name = name.trim();
  if (icon !== undefined) updateData.icon = icon;
  if (color !== undefined) updateData.color = color;
  if (order !== undefined) updateData.order = order;

  const { data: updatedData, error } = await supabase
    .from("workspace_sections")
    .update(updateData as unknown as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating section:", error);
    return NextResponse.json({ error: "Error al actualizar sección" }, { status: 500 });
  }

  const updated = updatedData as unknown as WorkspaceSectionRow;
  return NextResponse.json({
    id: updated.id,
    workspaceId: updated.workspace_id,
    name: updated.name,
    icon: updated.icon,
    color: updated.color,
    order: updated.order,
    isSystem: updated.is_system,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  });
}

// DELETE /api/sections/[id] - Eliminar sección
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Verificar que la sección existe y no es del sistema
  const { data: sectionData, error: sectionError } = await supabase
    .from("workspace_sections")
    .select("*, workspaces!inner(user_id)")
    .eq("id", id)
    .single();

  if (sectionError || !sectionData) {
    return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
  }

  const section = sectionData as unknown as WorkspaceSectionRow & { workspaces: { user_id: string } };
  
  // Verificar que el usuario es dueño del workspace
  if (section.workspaces.user_id !== user.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  // No permitir eliminar secciones del sistema
  if (section.is_system) {
    return NextResponse.json({ error: "No se pueden eliminar secciones del sistema" }, { status: 400 });
  }

  // Mover tareas de esta sección a la primera sección del sistema (Pendientes)
  const { data: defaultSection } = await supabase
    .from("workspace_sections")
    .select("id")
    .eq("workspace_id", section.workspace_id)
    .eq("is_system", true)
    .order("order", { ascending: true })
    .limit(1)
    .single();

  if (defaultSection) {
    await supabase
      .from("tasks")
      .update({ section_id: (defaultSection as { id: string }).id } as unknown as never)
      .eq("section_id", id);
  }

  const { error } = await supabase
    .from("workspace_sections")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json({ error: "Error al eliminar sección" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
