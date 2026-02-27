// POST /api/tasks/[id]/generate-description
// Generates a 1-line AI description from note content and updates the task.
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { updateTask } from "@/lib/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-5-mini";
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { noteContent, noteTitle } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    const content = [noteTitle, noteContent].filter(Boolean).join("\n\n");
    if (!content.trim()) {
      return NextResponse.json({ skipped: true });
    }

    const response = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente que genera descripciones concisas para tareas. Responde SOLO con una frase corta (máximo 120 caracteres) que resuma el propósito de la tarea basándote en el contenido de la nota. Sin puntuación final. Sin comillas.",
        },
        {
          role: "user",
          content: `Genera una descripción de una línea para esta tarea basándote en el siguiente contenido de nota:\n\n${content.slice(0, 3000)}`,
        },
      ],
      max_completion_tokens: 60,
      temperature: 0.3,
    });

    const description = response.choices[0]?.message?.content?.trim();
    if (!description) {
      return NextResponse.json({ skipped: true });
    }

    await updateTask(id, { description });
    return NextResponse.json({ description });
  } catch (error) {
    console.error("Error generating task description:", error);
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 });
  }
}
