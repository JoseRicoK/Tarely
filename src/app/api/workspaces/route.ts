// API Route: /api/workspaces
import { NextRequest, NextResponse } from "next/server";
import { listWorkspaces, createWorkspace } from "@/lib/store";
import { createWorkspaceSchema } from "@/lib/validations";

// GET /api/workspaces - Listar todos los workspaces
export async function GET() {
  try {
    const workspaces = await listWorkspaces();
    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("Error listing workspaces:", error);
    return NextResponse.json(
      { error: "Error al obtener los workspaces" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Crear un nuevo workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createWorkspaceSchema.parse(body);
    const workspace = await createWorkspace(validated);
    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error },
        { status: 400 }
      );
    }
    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Error al crear el workspace" },
      { status: 500 }
    );
  }
}
