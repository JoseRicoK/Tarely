// Cliente de OpenAI y funciones de generación de tareas (GPT-5.2 Responses API)
import OpenAI from "openai";
import { z } from "zod";
import type { AIGeneratedTask, Workspace, WorkspaceTag, Task } from "./types";

// Schema de validación para la respuesta de la IA
const AIRecurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1).max(365).default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
});

const AITaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  importance: z.number().int().min(1).max(10),
  dueDate: z.string().optional(), // ISO 8601 date string
  recurrence: AIRecurrenceSchema.optional(),
  tagIds: z.array(z.string()).optional(), // IDs de etiquetas a aplicar
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
function buildPrompt(workspace: Workspace, userText: string, tags: WorkspaceTag[] = []): string {
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

IMPORTANCIA (1-10) — debe funcionar para trabajo, estudios y vida personal:
- 1-2: Opcional / “nice to have”. Si no se hace, no pasa nada relevante.
- 3-4: Normal. Importa, pero puede esperar sin consecuencias.
- 5-6: Importante. Conviene hacerlo pronto; si se retrasa, molesta o genera estrés/coste pequeño.
- 7-8: Alta prioridad. Tiene fecha cercana (≤7 días) O impacto claro (dinero, salud, relación, examen) O desbloquea otras tareas. No hace falta “emergencia técnica”.
- 9-10: Crítica. Fecha inminente (≤48h) O penalización fuerte (pérdida de dinero/nota, corte de servicio, riesgo, compromiso importante) O bloquea totalmente lo demás.

REGLAS PRÁCTICAS:
- Usa 7-8 sin miedo cuando haya deadline próximo, consecuencias reales o sea “imprescindible”.
- Si hay dueDate y está a ≤7 días, rara vez será <6.
- Si hay dueDate a ≤48h, normalmente 8-10 (según impacto).
- “Pagar alquiler / impuestos / reservar viaje / trámites con fecha / estudiar para examen cercano” suelen ser 7-9.
- “Sacar al perro” es 7-9 si es HOY; si es rutina sin urgencia, 4-6.


SÉ REALISTA con la importancia. No todas las tareas son urgentes. Usa 1-2 sin miedo para cosas que son deseables pero no esenciales. Distribuye naturalmente las prioridades según lo que el usuario describe.

TAREAS RECURRENTES:
- Si el usuario indica que algo se repite (ej: "todos los lunes", "cada mes", "semanalmente", "diaria", "cada 2 semanas", "pagar alquiler el día 1", "sacar la basura lunes y jueves"), incluye el campo "recurrence".
- frequency: "daily" (cada día), "weekly" (cada semana), "monthly" (cada mes), "yearly" (cada año)
- interval: cada cuántas unidades se repite (por defecto 1). Ej: "cada 2 semanas" → interval: 2, frequency: "weekly"
- daysOfWeek: array de días para "weekly". 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado. Ej: "lunes y jueves" → [1, 4]
- dayOfMonth: día del mes para "monthly". Ej: "el día 1 de cada mes" → dayOfMonth: 1
- Si hay recurrence, SIEMPRE incluye dueDate con la primera ocurrencia (la próxima fecha que toque).
- Si NO hay patrón de repetición, NO incluyas el campo recurrence.

${tags.length > 0 ? `
ETIQUETAS DISPONIBLES EN ESTE WORKSPACE:
${tags.map(t => `- ID: "${t.id}" | Nombre: "${t.name}"`).join('\n')}

ETIQUETAS - REGLAS:
- El campo "tagIds" es OPCIONAL. Solo inclúyelo si estás MUY SEGURO de que la etiqueta aplica.
- Si tienes dudas, NO incluyas etiquetas.
- Puedes asignar 0, 1 o varias etiquetas por tarea.
- Usa únicamente los IDs de la lista anterior. NUNCA inventes IDs.
` : ''}
TEXTO DEL USUARIO:
${userText}

FORMATO DE RESPUESTA (JSON estricto, sin markdown):
{
  "tasks": [
    {
      "title": "Título claro y profesional de la tarea",
      "description": "Contexto adicional si es útil",
      "importance": 4,
      "dueDate": "2026-01-25T23:59:00Z",
      "recurrence": {
        "frequency": "weekly",
        "interval": 1,
        "daysOfWeek": [1, 4]
      },
      "tagIds": ["id-de-etiqueta-1"]
    }
  ]
}

NOTA: El campo "dueDate" es OPCIONAL. Solo inclúyelo si el usuario menciona una fecha.
NOTA: El campo "recurrence" es OPCIONAL. Solo inclúyelo si el usuario indica que la tarea se repite.
NOTA: El campo "tagIds" es OPCIONAL. Solo inclúyelo si estás muy seguro de qué etiqueta aplica.`;
}

// Función principal para generar tareas con IA (GPT-5.2 Responses API)
export async function generateTasksWithAI(
  workspace: Workspace,
  userText: string,
  tags: WorkspaceTag[] = []
): Promise<AIGeneratedTask[]> {
  const client = getOpenAIClient();
  const model = getModel();

  const prompt = buildPrompt(workspace, userText, tags);

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
