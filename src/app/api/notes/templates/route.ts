// API Route: /api/notes/templates
import { NextRequest, NextResponse } from "next/server";
import { listTemplates, createTemplate, deleteTemplate } from "@/lib/notes-store";
import { createNoteTemplateSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";

// GET /api/notes/templates
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const templates = await listTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error listing templates:", error);
    return NextResponse.json({ error: "Error al obtener plantillas" }, { status: 500 });
  }
}

// POST /api/notes/templates
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createNoteTemplateSchema.parse(body);
    const template = await createTemplate(validated);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error }, { status: 400 });
    }
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Error al crear plantilla" }, { status: 500 });
  }
}

// DELETE /api/notes/templates?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await deleteTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "Error al eliminar plantilla" }, { status: 500 });
  }
}
