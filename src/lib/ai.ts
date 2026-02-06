// Cliente de OpenAI y funciones de generación de tareas (GPT-5.2 Responses API)
import OpenAI from "openai";
import { z } from "zod";
import type { AIGeneratedTask, Workspace, Task } from "./types";

// Schema de validación para la respuesta de la IA
const AITaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  importance: z.number().int().min(1).max(10),
  dueDate: z.string().optional(), // ISO 8601 date string
});

const AIResponseSchema = z.object({
  tasks: z.array(AITaskSchema).min(1).max(20),
});

// Crear cliente de OpenAI (solo en servidor)
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no está configurada en las variables de entorno");
  }
  return new OpenAI({ apiKey });
}

function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-5.2";
}

// Obtener fecha actual en zona horaria de España
function getSpainDate(): { date: string; dayOfWeek: string } {
  const now = new Date();
  // Formatear con zona horaria de España
  const formatter = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  });
  const parts = formatter.formatToParts(now);
  
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const weekday = parts.find(p => p.type === 'weekday')?.value || '';
  
  return {
    date: `${year}-${month}-${day}`,
    dayOfWeek: weekday.charAt(0).toUpperCase() + weekday.slice(1),
  };
}

// Prompt para generación de tareas (GPT-5.2)
function buildPrompt(workspace: Workspace, userText: string): string {
  const { date: today, dayOfWeek } = getSpainDate();
  
  return `Eres un asistente que extrae y estructura tareas a partir de lo que describe el usuario.

FECHA ACTUAL: ${today} (${dayOfWeek})
ZONA HORARIA: Europe/Madrid (España)

CONTEXTO DEL PROYECTO:
- Nombre: ${workspace.name}
- Descripción: ${workspace.description}
- Instrucciones del proyecto: ${workspace.instructions || "Sin instrucciones adicionales"}

REGLAS:
1. NUNCA desgloses una tarea en subtareas. Si el usuario menciona 1 problema = 1 tarea.
2. Solo crea múltiples tareas si el usuario EXPLÍCITAMENTE menciona varias cosas distintas.
3. NO añadas tareas extra como "documentar", "hacer pruebas", "validar" a menos que el usuario lo pida.
4. El TÍTULO puede ser reformulado para ser más claro y profesional, pero mantén la esencia de lo que pidió el usuario.
5. La descripción es opcional - añádela solo si hay contexto útil que aclarar.

FECHAS:
- Si el usuario menciona una fecha o plazo (ej: "para el viernes", "antes del 15", "mañana", "la próxima semana"), conviértelo a formato ISO 8601 (YYYY-MM-DDTHH:mm:ssZ).
- Si menciona hora, inclúyela. Si no, usa las 23:59:00 del día indicado.
- Si NO hay fecha mencionada, NO incluyas el campo dueDate.
- Ejemplos: "mañana" → fecha de mañana, "el viernes" → próximo viernes, "15 de enero" → 2026-01-15

IMPORTANCIA (usa TODO el rango 1-10 según corresponda):
- 1-2: Tareas de baja prioridad, mejoras opcionales, ideas futuras, nice-to-have
- 3-4: Tareas normales, trabajo regular sin urgencia específica
- 5-6: Tareas importantes que conviene hacer pronto
- 7-8: Tareas urgentes o que bloquean otras cosas
- 9-10: SOLO para emergencias críticas, bugs graves, o deadlines inmediatos

SÉ REALISTA con la importancia. No todas las tareas son urgentes. Usa 1-2 sin miedo para cosas que son deseables pero no esenciales. Distribuye naturalmente las prioridades según lo que el usuario describe.

TEXTO DEL USUARIO:
${userText}

FORMATO DE RESPUESTA (JSON estricto, sin markdown):
{
  "tasks": [
    {
      "title": "Título claro y profesional de la tarea",
      "description": "Contexto adicional si es útil",
      "importance": 4,
      "dueDate": "2026-01-25T23:59:00Z"
    }
  ]
}

NOTA: El campo "dueDate" es OPCIONAL. Solo inclúyelo si el usuario menciona una fecha.`;
}

// Función principal para generar tareas con IA (GPT-5.2 Responses API)
export async function generateTasksWithAI(
  workspace: Workspace,
  userText: string
): Promise<AIGeneratedTask[]> {
  const client = getOpenAIClient();
  const model = getModel();

  const prompt = buildPrompt(workspace, userText);

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      // GPT-5.2 Responses API
      const response = await client.responses.create({
        model,
        input: prompt,
        text: { format: { type: "json_object" } },
        max_output_tokens: 1500,
      });

      // Extraer el contenido de la respuesta usando output_text (SDK convenience property)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const content = (response as any).output_text || 
        // Fallback: buscar manualmente en output
        (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const msg = response.output?.find((item: any) => item.type === "message") as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const textContent = msg?.content?.find((c: any) => c.type === "output_text");
          return textContent?.text;
        })();
      
      if (!content) {
        throw new Error("La IA no devolvió contenido");
      }

      // Intentar parsear el JSON
      let parsed: unknown;
      try {
        // Limpiar posibles markdown code blocks
        const cleanContent = content
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        parsed = JSON.parse(cleanContent);
      } catch {
        if (attempts < maxAttempts) {
          continue;
        }
        throw new Error("La IA no devolvió un JSON válido");
      }

      // Validar con Zod
      const validated = AIResponseSchema.parse(parsed);
      return validated.tasks;
    } catch (error) {
      if (attempts >= maxAttempts) {
        if (error instanceof z.ZodError) {
          throw new Error(
            `Formato de respuesta inválido: ${error.issues.map((issue) => issue.message).join(", ")}`
          );
        }
        throw error;
      }
    }
  }

  throw new Error("No se pudieron generar las tareas después de varios intentos");
}

// Función para generar prompt para IDE con IA
export async function generateIDEPromptWithAI(
  task: Task,
  workspace: Workspace
): Promise<string> {
  const client = getOpenAIClient();
  const model = getModel();

  const systemPrompt = `Genera un prompt CORTO y DIRECTO para un asistente de código (Copilot, Cursor, etc).

${workspace.instructions ? `CONTEXTO DEL PROYECTO:\n${workspace.instructions}\n` : ""}
TAREA: ${task.title}${task.description ? `\nDETALLE: ${task.description}` : ""}

REGLAS:
- Máximo 3-5 líneas
- Ve directo al grano: qué hacer y dónde
- Si hay info del proyecto arriba, menciona el stack/convención relevante en 1 línea
- NO expliques cómo hacerlo paso a paso
- NO pidas tests, documentación ni validaciones extra
- NO uses bullets ni listas largas
- Empieza directamente con la acción

Ejemplo bueno: "En el componente OfertasTable (Livewire/PowerGrid), añade un filtro por fecha y un botón para exportar a PDF las ofertas filtradas. Usa DomPDF como el resto del proyecto."

Genera SOLO el prompt, nada más.`;

  try {
    const response = await client.responses.create({
      model,
      input: systemPrompt,
      max_output_tokens: 300,
    });

    // Extraer el contenido de la respuesta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = (response as any).output_text || 
      (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = response.output?.find((item: any) => item.type === "message") as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const textContent = msg?.content?.find((c: any) => c.type === "output_text");
        return textContent?.text;
      })();
    
    if (!content) {
      throw new Error("La IA no generó el prompt");
    }

    return content.trim();
  } catch (error) {
    console.error("Error generating IDE prompt:", error);
    throw new Error("Error al generar el prompt con IA");
  }
}
