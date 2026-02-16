# 🔗 Sistema de Vinculación Bidireccional Notas-Tareas

## ⚠️ IMPORTANTE: Ejecutar Migración SQL

**El sistema no funcionará hasta que ejecutes la migración SQL en Supabase.**

### Pasos para activar el sistema:

1. **Abre tu proyecto en Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard

2. **Navega al SQL Editor**
   - En el menú lateral: SQL Editor → New Query

3. **Copia y pega el contenido de `scripts/notes-tasks-linking.sql`**
   - Archivo completo localizado en: `/scripts/notes-tasks-linking.sql`

4. **Ejecuta el script** (botón "Run" o Ctrl/Cmd + Enter)

5. **Verifica que se ejecutó correctamente**
   - Deberías ver: "Success. No rows returned"
   - Los triggers y columnas se habrán creado automáticamente

---

## ✨ Funcionalidades Implementadas

### 1. **Vinculación Bidireccional**
- Al crear una tarea desde una nota, se vinculan automáticamente en ambas direcciones
- `nota.taskId` ↔ `task.noteId`

### 2. **Sincronización Automática de Títulos**
- Cambias el título de la nota → se actualiza en la tarea
- Cambias el título de la tarea → se actualiza en la nota
- **Automático** gracias a triggers de base de datos

### 3. **Completar desde la Nota**
- Nuevo botón ⭕/✅ en el toolbar de la nota
- Completas desde la nota → se marca la tarea como completada
- Completas desde la tarea → se marca la nota como completada
- **Bidireccional y automático**

### 4. **Diseño Especial para Tareas Vinculadas**
- Badge morado con gradiente: "Nota Vinculada"
- Título más destacado (font-semibold)
- Border lateral morado para identificación rápida
- Diseño distintivo que destaca del resto de tareas

### 5. **Sección de Notas Completadas**
- **Colapsable**: Haz clic en "Completadas (X)" para abrir/cerrar
- Muestra la **ruta de carpeta** de cada nota (📁 Carpeta / Subcarpeta)
- Estado persiste en `localStorage`
- Diseño con opacidad reducida y texto tachado
- Check verde ✓ para indicar completado

---

## 🎯 Cómo Usar el Sistema

### Vincular una Nota con una Tarea

1. Abre una nota
2. Haz clic en el botón de **enlace** 🔗 en el toolbar
3. Se crea automáticamente una tarea vinculada
4. Aparece en el Kanban con el badge morado "Nota Vinculada"

### Completar una Tarea Vinculada

**Opción 1: Desde la Nota**
- Haz clic en el botón ⭕ (aparece solo si la nota tiene tarea vinculada)
- Se marca como completada y aparece en "Completadas"

**Opción 2: Desde el Kanban**
- Arrastra la tarea a la sección de completados
- La nota se marca automáticamente como completada

### Ver Notas Completadas

1. En el sidebar de notas, busca la sección **"Completadas (X)"**
2. Haz clic para expandir/contraer
3. Cada nota muestra:
   - Título tachado
   - Check verde ✓
   - Ruta de carpeta 📁

### Desvincular

- Haz clic en el botón de **desenlace** 🔓 en el toolbar de la nota
- Se elimina la vinculación (la tarea sigue existiendo, pero ya no está conectada)

---

## 🔧 Detalles Técnicos

### Base de Datos
- **Nuevas columnas en `tasks`**: `note_id`
- **Nuevas columnas en `notes`**: `completed`, `completed_at`
- **Triggers automáticos**:
  - `sync_task_title_to_note()` 
  - `sync_note_title_to_task()`
  - `sync_task_completion_to_note()`

### Sincronización
- Los triggers se ejecutan en PostgreSQL **después de cada UPDATE**
- Garantiza consistencia de datos sin lógica adicional en frontend
- Performance optimizada (solo se sincronizan los campos que cambian)

### Persistencia
- Estado de sección colapsada: `localStorage` → `notes-completed-section-open`
- Los datos de vinculación: `Supabase` (PostgreSQL)

---

## 🐛 Troubleshooting

### "Las notas completadas no aparecen al recargar"
**Solución**: Ejecuta la migración SQL. Los campos `completed` y `completed_at` no existen todavía.

### "Los títulos no se sincronizan"
**Solución**: Verifica que los triggers se crearon correctamente. Ejecuta:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_sync%';
```
Deberías ver 3 triggers.

### "El badge morado no aparece en las tareas"
**Solución**: La tarea debe tener `note_id` no nulo. Verifica que la vinculación se creó correctamente.

---

## 📝 Notas Adicionales

- Las notas completadas **NO aparecen** en favoritas ni en carpetas normales
- Solo las notas con `taskId` y `completed=true` aparecen en "Completadas"
- El sistema funciona con workspaces compartidos
- La sincronización es instantánea (triggers a nivel de BD)

---

**¡Sistema listo para usar!** 🚀
