// API Route: /api/notes/[id]/ai-agent
// Sistema agente de IA que puede modificar notas directamente
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { z } from "zod";

interface Params {
  params: Promise<{ id: string }>;
}

const agentSchema = z.object({
  action: z.enum([
    "summarize",      // Resumir nota
    "improve",        // Mejorar redacción
    "expand",         // Expandir contenido
    "checklist",      // Convertir a checklist
    "extract_tasks",  // Extraer tareas
    "translate",      // Traducir ES↔EN
    "format",         // Mejorar formato (h1, listas, negrita, código)
    "rewrite",        // Reescribir sección
    "add_section",    // Añadir nueva sección
    "remove_section", // Eliminar sección
    "ask"            // Preguntar sobre la nota
  ]),
  content: z.string().optional(), // Contenido actual de la nota (JSON o texto)
  query: z.string().optional(),   // Para 'ask' y modificaciones específicas
  sectionToModify: z.string().optional(), // Qué parte modificar
});

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no configurada");
  return new OpenAI({ apiKey });
}

function getModel() {
  return process.env.OPENAI_MODEL || "gpt-5-mini";
}

const AGENT_PROMPTS: Record<string, string> = {
  summarize: `Eres un asistente experto en resumir contenido.
Resume la siguiente nota de forma concisa pero completa, manteniendo los puntos clave.
Devuelve el resumen en formato JSON TipTap compatible con este esquema:
{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Resumen"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "..."}]}
  ]
}`,

  improve: `Eres un editor profesional.
Mejora la redacción de la siguiente nota, haciéndola más clara, profesional y bien estructurada.
Añade formato markdown apropiado: títulos (heading), listas (bulletList), negritas (bold), etc.
Devuelve el contenido mejorado en formato JSON TipTap.`,

  expand: `Eres un escritor experto.
Expande y desarrolla el siguiente contenido con más detalle, ejemplos y explicaciones.
Añade estructura con títulos y subtítulos apropiados.
Devuelve el contenido expandido en formato JSON TipTap.`,

  checklist: `Convierte el siguiente contenido en una checklist organizada y accionable.
Usa formato JSON TipTap con taskList y taskItem:
{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Checklist"}]},
    {"type": "taskList", "content": [
      {"type": "taskItem", "attrs": {"checked": false}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Tarea 1"}]}]}
    ]}
  ]
}`,

  format: `Eres un experto en formato de documentos.
Analiza el contenido y mejora su estructura usando:
- Títulos apropiados (heading level 1-3)
- Listas cuando sea necesario (bulletList o orderedList)
- Énfasis con negrita (bold) para conceptos clave
- Bloques de código (codeBlock) para código o comandos
- Párrafos bien separados
Devuelve el contenido formateado en JSON TipTap.`,

  rewrite: `Eres un escritor profesional.
Reescribe la sección indicada mejorando su claridad y estilo.
Mantén el significado pero hazlo más efectivo.
Devuelve solo la sección reescrita en formato JSON TipTap.`,

  add_section: `Eres un asistente de escritura.
Basándote en el contenido de la nota y la solicitud del usuario, crea una nueva sección relevante.
Devuelve la nueva sección en formato JSON TipTap.`,

  remove_section: `Identifica y elimina la sección solicitada del contenido.
Devuelve el contenido sin esa sección en formato JSON TipTap.`,

  ask: `Eres un asistente experto en análisis de contenido.
Lee cuidadosamente la nota y responde a la pregunta del usuario de forma precisa y útil.
Basa tu respuesta únicamente en el contenido de la nota.
Si la información no está en la nota, indícalo claramente.
Responde en formato markdown para facilitar la lectura.`,

  extract_tasks: `Eres un asistente experto en identificar tareas.
Analiza el siguiente contenido y extrae todas las tareas accionables.
Devuelve cada tarea como un item de taskList en formato JSON TipTap:
{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Tareas Detectadas"}]},
    {"type": "taskList", "content": [
      {"type": "taskItem", "attrs": {"checked": false}, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Tarea..."}]}]}
    ]}
  ]
}`,

  translate: `Eres un traductor profesional.
Detecta el idioma del texto (español o inglés) y tradúcelo al otro idioma.
Si está en español, tradúcelo a inglés. Si está en inglés, tradúcelo a español.
Devuelve la traducción en formato JSON TipTap manteniendo la estructura original (headings, lists, etc.):
{
  "type": "doc",
  "content": [
    {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Traducción"}]},
    {"type": "paragraph", "content": [{"type": "text", "text": "..."}]}
  ]
}`,
};

// POST /api/notes/[id]/ai-agent
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: noteId } = await params;
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que la nota existe y pertenece al usuario
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*, workspace:workspaces!inner(user_id)')
      .eq('id', noteId)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    }

    // @ts-ignore
    if (note.workspace.user_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { action, content, query, sectionToModify } = agentSchema.parse(body);

    const openai = getOpenAIClient();
    const systemPrompt = AGENT_PROMPTS[action];

    // Para 'ask', necesitamos el contenido de la nota y la pregunta
    if (action === "ask") {
      if (!query) {
        return NextResponse.json({ error: "Se requiere una pregunta" }, { status: 400 });
      }

      const response = await openai.responses.create({
        model: getModel(),
        input: `${systemPrompt}\n\nNota:\n${content}\n\nPregunta: ${query}`,
      });

      const answer = response.output_text || "";
      return NextResponse.json({ 
        type: "answer", 
        result: answer,
        action 
      });
    }

    // Para modificaciones, construir el prompt
    let userPrompt = `Contenido actual:\n${content}`;
    if (sectionToModify) {
      userPrompt += `\n\nSección a modificar: ${sectionToModify}`;
    }
    if (query) {
      userPrompt += `\n\nInstrucciones adicionales: ${query}`;
    }

    const response = await openai.responses.create({
      model: getModel(),
      input: `${systemPrompt}\n\n${userPrompt}`,
    });

    const result = response.output_text || "";

    // Intentar parsear como JSON TipTap
    try {
      // Extraer JSON del resultado (puede venir envuelto en markdown)
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const tiptapJson = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          type: "modification",
          result: tiptapJson,
          action,
          preview: true, // Indica que es una vista previa antes de aplicar
        });
      }
    } catch (e) {
      // Si no es JSON válido, devolver como texto
      console.warn("No se pudo parsear respuesta como JSON TipTap:", e);
    }

    // Si no se pudo parsear como JSON, devolver como texto
    return NextResponse.json({
      type: "text",
      result,
      action,
    });

  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos", details: error }, { status: 400 });
    }
    console.error("Error in AI agent:", error);
    return NextResponse.json({ error: "Error al procesar con IA" }, { status: 500 });
  }
}
