# Ecosistema de Productividad: Tarely

Tarely está diseñado como un ecosistema de productividad integral donde tareas, notas, calendario e inteligencia artificial trabajan juntos de forma interconectada. A continuación, se detallan todas las funciones y características principales que conforman esta plataforma.

## 1. Gestión de Tareas (Tasks)
El sistema de tareas va mucho más allá de una simple lista, ofreciendo un control detallado y flexible:

* **Creación Inteligente y Manual**: Las tareas pueden ser creadas manualmente o generadas automáticamente a partir de texto libre utilizando Inteligencia Artificial.
* **Priorización Avanzada**: Sistema de importancia del 1 al 10 que abarca desde tareas opcionales hasta críticas.
* **Subtareas**: Capacidad para desglosar tareas complejas en pasos más pequeños.
* **Tareas Recurrentes**: Soporte completo para rutinas (diarias, semanales, mensuales, anuales) con intervalos personalizados y días específicos.
* **Colaboración**: Asignación de tareas a múltiples usuarios y sistema de comentarios integrado.
* **Archivos Adjuntos**: Capacidad para subir imágenes, documentos y otros archivos directamente a las tareas.
* **Historial de Actividad**: Registro de auditoría completo de todos los cambios realizados en una tarea (creación, edición, cambios de estado, etc.).
* **Organización Visual**: Sistema de etiquetas (Tags) personalizables por colores y organización mediante secciones.
* **Vistas Flexibles**: Visualización de tareas mediante listas y tableros Kanban interactivos.

## 2. Gestión del Conocimiento (Notas)
El sistema de notas está diseñado para la captura y desarrollo de ideas, profundamente conectado con la ejecución (tareas):

* **Editor Enriquecido**: Editor de texto avanzado (basado en TipTap) para dar formato al contenido, insertar listas, y más.
* **Organización Jerárquica**: Sistema de carpetas anidadas para organizar el conocimiento por áreas.
* **Personalización Visual**: Notas con iconos, imágenes de portada y colores. Posibilidad de marcar notas como favoritas o fijarlas.
* **Plantillas (Templates)**: Creación y uso de plantillas reutilizables para estandarizar la captura de información (ej. actas de reuniones, diarios).
* **Vinculación Bidireccional (Notas ↔ Tareas)**: Una nota puede estar vinculada a una tarea específica. El estado de la tarea (completada/pendiente) se refleja directamente en la nota, permitiendo trabajar en la documentación y completar la tarea desde un mismo lugar.

## 3. Calendario y Planificación
La perspectiva temporal del ecosistema:

* **Vista Centralizada**: Un calendario unificado (estilo Notion) que agrega todas las tareas con fecha límite (`dueDate`) de todos los espacios de trabajo.
* **Integración con Google Calendar**: Sincronización bidireccional con Google Calendar.
* **Gestión de Eventos**: Creación, actualización y eliminación de eventos en Google Calendar directamente desde la plataforma.
* **Disponibilidad (Free/Busy)**: Capacidad para consultar la disponibilidad del usuario para una mejor planificación.

## 4. Inteligencia Artificial Integrada (El cerebro del ecosistema)
La IA actúa como un asistente transversal en toda la plataforma:

* **Extracción Estructurada (Inbox a Tareas)**: Al escribir un texto en lenguaje natural, la IA es capaz de extraer múltiples tareas estructuradas, deduciendo automáticamente el título, importancia, fechas de vencimiento (entendiendo conceptos como "el próximo viernes"), patrones de recurrencia y sugiriendo etiquetas pertinentes del espacio de trabajo.
* **Asistente en el Editor de Notas**:
  * **Resumir**: Genera un resumen conciso del contenido extenso.
  * **Extraer Tareas**: Analiza el texto de una nota (ej. un acta de reunión) y crea tareas accionables automáticamente.
  * **Mejorar y Expandir**: Optimiza la redacción del texto o desarrolla ideas con más detalle.
  * **Checklists**: Transforma párrafos o viñetas en listas de verificación interactivas.
  * **Traducción**: Traducción instantánea entre español e inglés.
* **Generador de Prompts para IDEs (Devs)**: Genera prompts cortos y altamente contextualizados para asistentes de código (como Copilot o Cursor) basados en los detalles de una tarea y las instrucciones técnicas configuradas en el espacio de trabajo.

## 5. Espacios de Trabajo (Workspaces)
El contenedor de nivel superior que da contexto a todo lo anterior:

* **Aislamiento Contextual**: Cada espacio de trabajo (ej. "Personal", "Trabajo", "Proyecto X") mantiene sus propias tareas, notas, etiquetas y secciones.
* **Instrucciones de IA por Workspace**: Posibilidad de definir instrucciones específicas o contexto general del proyecto que la IA utilizará para generar mejores tareas y prompts.
* **Colaboración**: Los espacios de trabajo pueden ser personales o compartidos con otros usuarios.

## La Sinergia del Ecosistema (El Flujo Ideal)
El verdadero poder de Tarely reside en cómo estas piezas se conectan:
1. Durante una reunión, tomas apuntes en una **Nota** dentro de tu **Workspace** de trabajo.
2. Usas la **IA de la Nota** para extraer instantáneamente los compromisos adquiridos y convertirlos en **Tareas**.
3. Esas tareas heredan el contexto (gracias a las instrucciones del Workspace), se les asigna una fecha y aparecen automáticamente en tu **Calendario**.
4. Si la tarea es de desarrollo, abres la tarjeta de la tarea y usas la **IA para generar un prompt de IDE**, copiándolo para programar la solución.
5. Al terminar, la tarea se marca como completada, actualizando tanto el **Calendario**, el **Historial de la tarea**, como el estado reflejado en la **Nota** original.
