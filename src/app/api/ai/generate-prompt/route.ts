// API Route: /api/ai/generate-prompt
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTask, getWorkspace } from "@/lib/store";
import { generateIDEPromptWithAI } from "@/lib/ai";

const generatePromptSchema = z.object({
  taskId: z.string().uuid(),
});

// POST /api/ai/generate-prompt - Generar prompt para IDE con IA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId } = generatePromptSchema.parse(body);

    // Obtener la tarea
    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Obtener el workspace
    const workspace = await getWorkspace(task.workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace no encontrado" },
        { status: 404 }
      );
    }

    // Generar el prompt con IA
    const prompt = await generateIDEPromptWithAI(task, workspace);

    return NextResponse.json({ prompt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error generating prompt:", error);
    const message = error instanceof Error ? error.message : "Error al generar el prompt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
