-- ===========================================
-- SCHEMA PARA TAREAI
-- ===========================================
-- 
-- Ejecuta este SQL en el SQL Editor de Supabase Dashboard:
-- https://supabase.com/dashboard/project/uctozgraqjrtjldgzqgd/sql/new
--
-- ===========================================

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;

-- Eliminar tipos si existen
DROP TYPE IF EXISTS task_source CASCADE;

-- ===========================================
-- TIPOS PERSONALIZADOS
-- ===========================================

-- Tipo para el origen de la tarea
CREATE TYPE task_source AS ENUM ('ai', 'manual');

-- ===========================================
-- TABLA WORKSPACES
-- ===========================================

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para ordenar por updated_at
CREATE INDEX idx_workspaces_updated_at ON workspaces(updated_at DESC);

-- Comentarios para documentación
COMMENT ON TABLE workspaces IS 'Espacios de trabajo que agrupan tareas y contienen instrucciones para la IA';
COMMENT ON COLUMN workspaces.name IS 'Nombre del workspace';
COMMENT ON COLUMN workspaces.description IS 'Descripción breve del workspace';
COMMENT ON COLUMN workspaces.instructions IS 'Instrucciones detalladas para la IA cuando genera tareas';

-- ===========================================
-- TABLA TASKS
-- ===========================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  importance INTEGER NOT NULL DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  in_review BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  source task_source NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas comunes
CREATE INDEX idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_in_review ON tasks(in_review);
CREATE INDEX idx_tasks_importance ON tasks(importance DESC);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- Comentarios para documentación
COMMENT ON TABLE tasks IS 'Tareas asociadas a un workspace';
COMMENT ON COLUMN tasks.workspace_id IS 'Referencia al workspace que contiene la tarea';
COMMENT ON COLUMN tasks.title IS 'Título de la tarea';
COMMENT ON COLUMN tasks.description IS 'Descripción detallada de la tarea (opcional)';
COMMENT ON COLUMN tasks.importance IS 'Importancia de 1 a 10';
COMMENT ON COLUMN tasks.completed IS 'Si la tarea está completada';
COMMENT ON COLUMN tasks.completed_at IS 'Fecha de completado';
COMMENT ON COLUMN tasks.in_review IS 'Si la tarea está en revisión';
COMMENT ON COLUMN tasks.reviewed_at IS 'Fecha en que se puso en revisión';
COMMENT ON COLUMN tasks.source IS 'Origen: ai (generada por IA) o manual';

-- ===========================================
-- TRIGGERS PARA updated_at
-- ===========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para workspaces
CREATE TRIGGER trigger_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tasks
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Habilitar RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (por ahora sin auth, todo el mundo puede acceder)
-- Cuando implementes auth, cambiar estas políticas

-- Workspaces: acceso público para lectura y escritura
CREATE POLICY "Allow public read workspaces" ON workspaces
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert workspaces" ON workspaces
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update workspaces" ON workspaces
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete workspaces" ON workspaces
  FOR DELETE TO anon, authenticated
  USING (true);

-- Tasks: acceso público para lectura y escritura
CREATE POLICY "Allow public read tasks" ON tasks
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert tasks" ON tasks
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update tasks" ON tasks
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete tasks" ON tasks
  FOR DELETE TO anon, authenticated
  USING (true);

-- ===========================================
-- FIN DEL SCHEMA
-- ===========================================
