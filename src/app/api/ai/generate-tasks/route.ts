// API Route: /api/ai/generate-tasks
import { NextRequest, NextResponse } from "next/server";
import { getWorkspace, createManyTasks } from "@/lib/store";
import { generateTasksSchema } from "@/lib/validations";
import { generateTasksWithAI } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceTag } from "@/lib/types";

interface WorkspaceTagRow {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

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

    // Obtener las etiquetas del workspace para pasárselas a la IA
    const supabase = await createClient();
    let workspaceTags: WorkspaceTag[] = [];
    try {
      const { data: tagsData } = await supabase
        .from("workspace_tags")
        .select("*")
        .eq("workspace_id", validated.workspaceId)
        .order("name", { ascending: true });

      if (tagsData) {
        workspaceTags = (tagsData as unknown as WorkspaceTagRow[]).map((t) => ({
          id: t.id,
          workspaceId: t.workspace_id,
          name: t.name,
          color: t.color,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));
      }
    } catch {
      // Si falla la carga de tags, continuamos sin ellas
    }

    // Generar tareas con IA (incluye info de etiquetas disponibles)
    const generatedTasks = await generateTasksWithAI(workspace, validated.text, workspaceTags);

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

    // Aplicar etiquetas sugeridas por la IA a las tareas recién creadas
    if (workspaceTags.length > 0) {
      const validTagIds = new Set(workspaceTags.map((t) => t.id));
      const tagInserts: { task_id: string; tag_id: string; workspace_id: string }[] = [];

      for (let i = 0; i < createdTasks.length; i++) {
        const aiTask = generatedTasks[i];
        const createdTask = createdTasks[i];
        if (aiTask?.tagIds && aiTask.tagIds.length > 0) {
          for (const tagId of aiTask.tagIds) {
            if (validTagIds.has(tagId)) {
              tagInserts.push({
                task_id: createdTask.id,
                tag_id: tagId,
                workspace_id: validated.workspaceId,
              });
            }
          }
        }
      }

      if (tagInserts.length > 0) {
        try {
          await (supabase as any).from("task_tags").insert(tagInserts);
        } catch {
          // Si falla la asignación de tags, no bloqueamos la respuesta
          console.error("Error asignando etiquetas a las tareas generadas por IA");
        }
      }
    }

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
