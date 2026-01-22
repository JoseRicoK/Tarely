// API Route: /api/workspaces/[id]
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspace, updateWorkspace, deleteWorkspace } from "@/lib/store";
import { updateWorkspaceSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/workspaces/[id] - Obtener un workspace
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const workspace = await getWorkspace(id);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error getting workspace:", error);
    return NextResponse.json(
      { error: "Error al obtener el workspace" },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces/[id] - Actualizar un workspace
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log("PATCH workspace body:", JSON.stringify(body));
    const validated = updateWorkspaceSchema.parse(body);
    console.log("PATCH workspace validated:", JSON.stringify(validated));
    const workspace = await updateWorkspace(id, validated);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(workspace);
  } catch (error) {
    console.error("PATCH workspace error:", error);
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.issues);
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating workspace:", error);
    return NextResponse.json(
      { error: "Error al actualizar el workspace" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id] - Eliminar un workspace
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = await deleteWorkspace(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Workspace no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json(
      { error: "Error al eliminar el workspace" },
      { status: 500 }
    );
  }
}
