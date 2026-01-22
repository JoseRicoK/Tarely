-- ===========================================
-- TABLA SUBTASKS (Subtareas)
-- ===========================================
-- Ejecuta este SQL en el SQL Editor de Supabase Dashboard
-- ===========================================

-- Crear tabla subtasks
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_order ON subtasks("order");

-- Trigger para updated_at
CREATE TRIGGER trigger_subtasks_updated_at
  BEFORE UPDATE ON subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Política: Ver subtareas de tareas que puedo ver
CREATE POLICY "Users can view subtasks of accessible tasks" ON subtasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspaces w ON t.workspace_id = w.id
      WHERE t.id = subtasks.task_id
      AND (
        w.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members wm
          WHERE wm.workspace_id = w.id
          AND wm.user_id = auth.uid()
        )
      )
    )
  );

-- Política: Insertar subtareas en tareas accesibles
CREATE POLICY "Users can insert subtasks in accessible tasks" ON subtasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspaces w ON t.workspace_id = w.id
      WHERE t.id = subtasks.task_id
      AND (
        w.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members wm
          WHERE wm.workspace_id = w.id
          AND wm.user_id = auth.uid()
        )
      )
    )
  );

-- Política: Actualizar subtareas de tareas accesibles
CREATE POLICY "Users can update subtasks of accessible tasks" ON subtasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspaces w ON t.workspace_id = w.id
      WHERE t.id = subtasks.task_id
      AND (
        w.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members wm
          WHERE wm.workspace_id = w.id
          AND wm.user_id = auth.uid()
        )
      )
    )
  );

-- Política: Eliminar subtareas de tareas accesibles
CREATE POLICY "Users can delete subtasks of accessible tasks" ON subtasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspaces w ON t.workspace_id = w.id
      WHERE t.id = subtasks.task_id
      AND (
        w.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members wm
          WHERE wm.workspace_id = w.id
          AND wm.user_id = auth.uid()
        )
      )
    )
  );

-- Comentarios
COMMENT ON TABLE subtasks IS 'Subtareas asociadas a una tarea principal';
COMMENT ON COLUMN subtasks.task_id IS 'Referencia a la tarea padre';
COMMENT ON COLUMN subtasks.title IS 'Título de la subtarea';
COMMENT ON COLUMN subtasks.completed IS 'Si la subtarea está completada';
COMMENT ON COLUMN subtasks."order" IS 'Orden de la subtarea dentro de la tarea';
