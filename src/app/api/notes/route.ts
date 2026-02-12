// API Route: /api/notes
import { NextRequest, NextResponse } from "next/server";
import { listNotes, listAllNotes, searchNotes, createNote } from "@/lib/notes-store";
import { createNoteSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";

// GET /api/notes?workspaceId=&folderId=&search=
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const folderId = searchParams.get("folderId");
    const search = searchParams.get("search");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId es requerido" }, { status: 400 });
    }

    if (search) {
      const notes = await searchNotes(workspaceId, search);
      return NextResponse.json(notes);
    }

    if (folderId === "all") {
      const notes = await listAllNotes(workspaceId);
      return NextResponse.json(notes);
    }

    const notes = await listNotes(
      workspaceId,
      folderId === "root" ? null : folderId || undefined
    );
    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error listing notes:", error);
    return NextResponse.json({ error: "Error al obtener las notas" }, { status: 500 });
  }
}

// POST /api/notes
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createNoteSchema.parse(body);
    const note = await createNote(validated);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error }, { status: 400 });
    }
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Error al crear la nota" }, { status: 500 });
  }
}
