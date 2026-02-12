// API Route: /api/notes/folders
import { NextRequest, NextResponse } from "next/server";
import { listFolders, createFolder } from "@/lib/notes-store";
import { createNoteFolderSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";

// GET /api/notes/folders?workspaceId=
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId es requerido" }, { status: 400 });
    }

    const folders = await listFolders(workspaceId);
    return NextResponse.json(folders);
  } catch (error) {
    console.error("Error listing folders:", error);
    return NextResponse.json({ error: "Error al obtener carpetas" }, { status: 500 });
  }
}

// POST /api/notes/folders
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createNoteFolderSchema.parse(body);
    const folder = await createFolder(validated);
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error }, { status: 400 });
    }
    console.error("Error creating folder:", error);
    return NextResponse.json({ error: "Error al crear carpeta" }, { status: 500 });
  }
}
