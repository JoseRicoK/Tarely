// Generación de prompts para copiar y usar en IDEs con IA
import type { Task, Workspace } from "./types";

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getImportanceLabel(importance: number): string {
  if (importance >= 9) return "CRÍTICA";
  if (importance >= 7) return "ALTA";
  if (importance >= 5) return "MEDIA";
  if (importance >= 3) return "BAJA";
  return "MUY BAJA";
}

export function generateTaskPrompt(task: Task, workspace: Workspace): string {
  const importanceLabel = getImportanceLabel(task.importance);
  const createdDate = formatDate(task.createdAt);

  return `# 🎯 TAREA A IMPLEMENTAR

## Contexto del Proyecto
**Workspace:** ${workspace.name}
**Descripción:** ${workspace.description}

### Instrucciones del Proyecto
${workspace.instructions || "_Sin instrucciones específicas_"}

---

## Detalles de la Tarea

**Título:** ${task.title}
${task.description ? `**Descripción:** ${task.description}` : ""}
**Prioridad:** ${importanceLabel} (${task.importance}/10)
**Creada:** ${createdDate}
**Origen:** ${task.source === "ai" ? "Generada por IA" : "Manual"}

---

## Output Esperado

Por favor, proporciona:

### 1. Análisis Inicial
- Comprensión de los requisitos
- Identificación de dependencias
- Posibles retos técnicos

### 2. Plan de Implementación
- Desglose en pasos secuenciales
- Estimación de complejidad por paso

### 3. Checklist de Verificación
- [ ] Paso 1 completado
- [ ] Paso 2 completado
- [ ] (continúa según necesidad)

### 4. Si involucra código:
- Proporciona el código en formato **patch/diff** cuando sea posible
- Incluye **tests unitarios** para las funcionalidades nuevas
- Documenta cualquier cambio en APIs o interfaces

### 5. Notas Adicionales
- Mejoras sugeridas
- Posibles optimizaciones futuras
- Consideraciones de mantenibilidad

---

_Prompt generado por TareAI el ${formatDate(new Date().toISOString())}_`;
}
