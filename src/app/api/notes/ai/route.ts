// API Route: /api/notes/ai
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { z } from "zod";

const aiNoteSchema = z.object({
  noteContent: z.string().min(1).max(50000),
  action: z.enum(["summarize", "extract_tasks", "improve", "translate", "expand", "checklist"]),
  language: z.string().default("es"),
});

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no configurada");
  return new OpenAI({ apiKey });
}

function getModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

const ACTION_PROMPTS: Record<string, string> = {
  summarize: "Resume el siguiente contenido de forma concisa y clara, manteniendo los puntos clave. Responde en el mismo idioma del contenido.",
  extract_tasks: "Extrae todas las tareas accionables del siguiente contenido. Devuelve un JSON array con objetos {title, description, importance} donde importance es 1-10. Solo devuelve el JSON, sin texto adicional.",
  improve: "Mejora la redacción del siguiente contenido, haciéndolo más claro, profesional y bien estructurado. Mantén el significado original y el idioma. Devuelve solo el texto mejorado.",
  translate: "Traduce el siguiente contenido al inglés si está en español, o al español si está en inglés. Devuelve solo la traducción.",
  expand: "Expande y desarrolla el siguiente contenido con más detalle, ejemplos y explicaciones. Mantén el estilo y el idioma. Devuelve solo el contenido expandido.",
  checklist: "Convierte el siguiente contenido en una checklist organizada con tareas claras y accionables. Usa formato markdown con checkboxes (- [ ]). Devuelve solo la checklist.",
};

// POST /api/notes/ai
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { noteContent, action } = aiNoteSchema.parse(body);

    const openai = getOpenAIClient();
    const systemPrompt = ACTION_PROMPTS[action];

    const response = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: noteContent },
      ],
      temperature: action === "extract_tasks" ? 0.3 : 0.7,
      max_tokens: 2000,
    });

    const result = response.choices[0]?.message?.content || "";

    // For extract_tasks, try to parse as JSON
    if (action === "extract_tasks") {
      try {
        const tasks = JSON.parse(result);
        return NextResponse.json({ result: tasks, type: "tasks" });
      } catch {
        return NextResponse.json({ result, type: "text" });
      }
    }

    return NextResponse.json({ result, type: "text" });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error }, { status: 400 });
    }
    console.error("Error in notes AI:", error);
    return NextResponse.json({ error: "Error al procesar con IA" }, { status: 500 });
  }
}
