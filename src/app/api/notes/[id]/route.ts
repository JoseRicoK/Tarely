// API Route: /api/notes/[id]
import { NextRequest, NextResponse } from "next/server";
import { getNote, updateNote, deleteNote } from "@/lib/notes-store";
import { updateNoteSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/notes/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const note = await getNote(id);
    if (!note) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    console.error("Error getting note:", error);
    return NextResponse.json({ error: "Error al obtener la nota" }, { status: 500 });
  }
}

// PATCH /api/notes/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateNoteSchema.parse(body);
    const note = await updateNote(id, validated);
    if (!note) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error }, { status: 400 });
    }
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Error al actualizar la nota" }, { status: 500 });
  }
}

// DELETE /api/notes/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteNote(id);
    if (!deleted) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Error al eliminar la nota" }, { status: 500 });
  }
}
