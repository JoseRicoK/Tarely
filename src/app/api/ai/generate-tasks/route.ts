// API Route: /api/ai/generate-tasks
import { NextRequest, NextResponse } from "next/server";
import { getWorkspace, createManyTasks } from "@/lib/store";
import { generateTasksSchema } from "@/lib/validations";
import { generateTasksWithAI } from "@/lib/ai";

// POST /api/ai/generate-tasks - Generar tareas con IA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar input
    const validated = generateTasksSchema.parse(body);
    
    // Obtener el workspace
    const workspace = await getWorkspace(validated.workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace no encontrado" },
        { status: 404 }
      );
    }

    // Generar tareas con IA
    const generatedTasks = await generateTasksWithAI(workspace, validated.text);

    // Crear las tareas en el store
    const now = new Date().toISOString();
    const tasksToCreate = generatedTasks.map((t) => ({
      workspaceId: validated.workspaceId,
      title: t.title,
      description: t.description,
      importance: t.importance,
      dueDate: t.dueDate,
      source: "ai" as const,
      recurrence: t.recurrence || null,
      nextDueAt: t.recurrence ? now : null, // Recurrentes visibles inmediatamente
    }));

    const createdTasks = await createManyTasks(tasksToCreate);

    return NextResponse.json({
      success: true,
      tasks: createdTasks,
      count: createdTasks.length,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error },
        { status: 400 }
      );
    }

    console.error("Error generating tasks:", error);
    
    const message = error instanceof Error 
      ? error.message 
      : "Error al generar tareas con IA";
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
