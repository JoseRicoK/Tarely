// API Route: /api/tasks
import { NextRequest, NextResponse } from "next/server";
import { listTasks, createTask } from "@/lib/store";
import { createTaskSchema } from "@/lib/validations";
import { z } from "zod";

// GET /api/tasks?workspaceId= - Listar tareas de un workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId es requerido" },
        { status: 400 }
      );
    }

    // Validar que sea un UUID válido
    const uuidSchema = z.string().uuid();
    try {
      uuidSchema.parse(workspaceId);
    } catch {
      return NextResponse.json(
        { error: "workspaceId inválido" },
        { status: 400 }
      );
    }

    const tasks = await listTasks(workspaceId);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error listing tasks:", error);
    return NextResponse.json(
      { error: "Error al obtener las tareas" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Crear una nueva tarea
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createTaskSchema.parse(body);
    const task = await createTask(validated);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error },
        { status: 400 }
      );
    }
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Error al crear la tarea" },
      { status: 500 }
    );
  }
}
