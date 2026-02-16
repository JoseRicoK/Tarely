// API Route: /api/tasks/[id]/subtasks
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SubtaskRow, WorkspaceRow, TaskRow } from "@/lib/supabase/types";
import OpenAI from "openai";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/tasks/[id]/subtasks - Obtener subtareas de una tarea
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: taskId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", taskId)
      .order("order", { ascending: true });

    if (error) {
      console.error("Error fetching subtasks:", error);
      return NextResponse.json(
        { error: "Error al obtener subtareas" },
        { status: 500 }
      );
    }

    // Mapear de snake_case a camelCase
    const subtasks = ((data || []) as SubtaskRow[]).map((s) => ({
      id: s.id,
      taskId: s.task_id,
      title: s.title,
      completed: s.completed,
      order: s.order,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    return NextResponse.json(subtasks);
  } catch (error) {
    console.error("Error in GET subtasks:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/subtasks - Crear subtarea o generar con IA
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Si viene generate=true, generar con IA
    if (body.generate) {
      return await generateSubtasks(taskId, body.workspaceId, supabase);
    }

    // Crear subtarea manual
    const { title } = body;
    if (!title) {
      return NextResponse.json(
        { error: "El título es obligatorio" },
        { status: 400 }
      );
    }

    // Obtener el orden máximo actual
    const { data: maxOrderData } = await supabase
      .from("subtasks")
      .select("order")
      .eq("task_id", taskId)
      .order("order", { ascending: false })
      .limit(1);

    const maxOrder = (maxOrderData as { order: number }[] | null)?.[0]?.order ?? -1;
    const nextOrder = maxOrder + 1;

    const { data, error } = await supabase
      .from("subtasks")
      .insert({
        task_id: taskId,
        title,
        completed: false,
        order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating subtask:", error);
      return NextResponse.json(
        { error: "Error al crear subtarea" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: (data as SubtaskRow).id,
      taskId: (data as SubtaskRow).task_id,
      title: (data as SubtaskRow).title,
      completed: (data as SubtaskRow).completed,
      order: (data as SubtaskRow).order,
      createdAt: (data as SubtaskRow).created_at,
      updatedAt: (data as SubtaskRow).updated_at,
    });
  } catch (error) {
    console.error("Error in POST subtasks:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id]/subtasks - Actualizar subtarea
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { subtaskId, title, completed } = body;
    const supabase = await createClient();

    if (!subtaskId) {
      return NextResponse.json(
        { error: "El ID de subtarea es obligatorio" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;

    const { data, error } = await supabase
      .from("subtasks")
      .update(updateData)
      .eq("id", subtaskId)
      .eq("task_id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Error updating subtask:", error);
      return NextResponse.json(
        { error: "Error al actualizar subtarea" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: (data as SubtaskRow).id,
      taskId: (data as SubtaskRow).task_id,
      title: (data as SubtaskRow).title,
      completed: (data as SubtaskRow).completed,
      order: (data as SubtaskRow).order,
      createdAt: (data as SubtaskRow).created_at,
      updatedAt: (data as SubtaskRow).updated_at,
    });
  } catch (error) {
    console.error("Error in PATCH subtasks:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/subtasks - Eliminar subtarea
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id: taskId } = await params;
    const { searchParams } = new URL(request.url);
    const subtaskId = searchParams.get("subtaskId");
    const supabase = await createClient();

    if (!subtaskId) {
      return NextResponse.json(
        { error: "El ID de subtarea es obligatorio" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("subtasks")
      .delete()
      .eq("id", subtaskId)
      .eq("task_id", taskId);

    if (error) {
      console.error("Error deleting subtask:", error);
      return NextResponse.json(
        { error: "Error al eliminar subtarea" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE subtasks:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Función para generar subtareas con IA
async function generateSubtasks(
  taskId: string,
  workspaceId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  try {
    // Obtener la tarea
    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskError || !taskData) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    const task = taskData as TaskRow;

    // Obtener el workspace para contexto
    const { data: workspaceData, error: wsError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();

    if (wsError || !workspaceData) {
      return NextResponse.json(
        { error: "Workspace no encontrado" },
        { status: 404 }
      );
    }

    const workspace = workspaceData as WorkspaceRow;

    // Generar subtareas con OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI no configurado" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-5-mini";

    const prompt = `Eres un asistente que desglosa tareas en subtareas concretas y accionables.

CONTEXTO DEL PROYECTO:
- Nombre: ${workspace.name}
- Descripción: ${workspace.description || "Sin descripción"}
- Instrucciones generales: ${workspace.instructions || "Sin instrucciones específicas"}

TAREA A DESGLOSAR:
- Título: ${task.title}
- Descripción: ${task.description || "Sin descripción"}

REGLAS:
1. Genera entre 2 y 5 subtareas (ideal: 3 subtareas)
2. Cada subtarea debe ser concreta, clara y accionable
3. Las subtareas deben cubrir los pasos lógicos para completar la tarea principal
4. NO incluyas subtareas como "revisar", "validar" o "documentar" a menos que sea realmente necesario
5. Ordénalas en el orden lógico en que se deberían hacer
6. Sé conciso pero descriptivo en los títulos

FORMATO DE RESPUESTA (JSON estricto, sin markdown):
{
  "subtasks": [
    "Título de la subtarea 1",
    "Título de la subtarea 2",
    "Título de la subtarea 3"
  ]
}`;

    const response = await openai.responses.create({
      model,
      input: prompt,
    });

    const content = response.output_text;
    if (!content) {
      return NextResponse.json(
        { error: "No se pudo generar subtareas" },
        { status: 500 }
      );
    }

    // Parsear respuesta
    let parsed: { subtasks: string[] };
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleanContent);
    } catch {
      console.error("Error parsing AI response:", content);
      return NextResponse.json(
        { error: "Error al procesar respuesta de IA" },
        { status: 500 }
      );
    }

    if (!parsed.subtasks || !Array.isArray(parsed.subtasks)) {
      return NextResponse.json(
        { error: "Respuesta de IA inválida" },
        { status: 500 }
      );
    }

    // Limitar a 5 subtareas máximo
    const subtaskTitles = parsed.subtasks.slice(0, 5);

    // Obtener el orden máximo actual
    const { data: maxOrderData2 } = await supabase
      .from("subtasks")
      .select("order")
      .eq("task_id", taskId)
      .order("order", { ascending: false })
      .limit(1);

    const currentMaxOrder = (maxOrderData2 as { order: number }[] | null)?.[0]?.order ?? -1;
    let nextOrder = currentMaxOrder + 1;

    // Insertar todas las subtareas
    const subtasksToInsert = subtaskTitles.map((title) => ({
      task_id: taskId,
      title,
      completed: false,
      order: nextOrder++,
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from("subtasks")
      .insert(subtasksToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting subtasks:", insertError);
      return NextResponse.json(
        { error: "Error al guardar subtareas" },
        { status: 500 }
      );
    }

    // Mapear a formato camelCase
    const subtasks = ((insertedData || []) as SubtaskRow[]).map((s) => ({
      id: s.id,
      taskId: s.task_id,
      title: s.title,
      completed: s.completed,
      order: s.order,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    return NextResponse.json({ subtasks, generated: true });
  } catch (error) {
    console.error("Error generating subtasks:", error);
    return NextResponse.json(
      { error: "Error al generar subtareas" },
      { status: 500 }
    );
  }
}
