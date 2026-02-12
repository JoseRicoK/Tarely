// API Route: /api/notes/folders/[id]
import { NextRequest, NextResponse } from "next/server";
import { getFolder, updateFolder, deleteFolder } from "@/lib/notes-store";
import { updateNoteFolderSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/notes/folders/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateNoteFolderSchema.parse(body);
    const folder = await updateFolder(id, validated);
    if (!folder) {
      return NextResponse.json({ error: "Carpeta no encontrada" }, { status: 404 });
    }
    return NextResponse.json(folder);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error }, { status: 400 });
    }
    console.error("Error updating folder:", error);
    return NextResponse.json({ error: "Error al actualizar carpeta" }, { status: 500 });
  }
}

// GET /api/notes/folders/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const folder = await getFolder(id);
    if (!folder) {
      return NextResponse.json({ error: "Carpeta no encontrada" }, { status: 404 });
    }
    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error getting folder:", error);
    return NextResponse.json({ error: "Error al obtener carpeta" }, { status: 500 });
  }
}

// DELETE /api/notes/folders/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteFolder(id);
    if (!deleted) {
      return NextResponse.json({ error: "Carpeta no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json({ error: "Error al eliminar carpeta" }, { status: 500 });
  }
}
