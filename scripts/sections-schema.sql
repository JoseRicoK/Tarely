-- Tabla de secciones del workspace
-- Cada workspace tiene sus propias secciones personalizables

CREATE TABLE IF NOT EXISTS workspace_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'list-todo',
  color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false, -- Las 3 secciones por defecto son del sistema
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workspace_sections_workspace ON workspace_sections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_sections_order ON workspace_sections(workspace_id, "order");

-- Añadir columna section_id a tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES workspace_sections(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_section ON tasks(section_id);

-- Políticas RLS para workspace_sections
ALTER TABLE workspace_sections ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view sections of their workspaces" ON workspace_sections;
DROP POLICY IF EXISTS "Workspace owners can create sections" ON workspace_sections;
DROP POLICY IF EXISTS "Workspace owners can update sections" ON workspace_sections;
DROP POLICY IF EXISTS "Workspace owners can delete non-system sections" ON workspace_sections;

-- Los usuarios pueden ver secciones de sus workspaces o compartidos
CREATE POLICY "Users can view sections of their workspaces" ON workspace_sections
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Solo el dueño puede crear secciones
CREATE POLICY "Workspace owners can create sections" ON workspace_sections
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- Solo el dueño puede actualizar secciones
CREATE POLICY "Workspace owners can update sections" ON workspace_sections
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- Solo el dueño puede eliminar secciones (no del sistema)
CREATE POLICY "Workspace owners can delete non-system sections" ON workspace_sections
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
    AND is_system = false
  );

-- Función para crear secciones por defecto al crear un workspace
CREATE OR REPLACE FUNCTION create_default_sections()
RETURNS TRIGGER AS $$
BEGIN
  -- Sección Pendientes
  INSERT INTO workspace_sections (workspace_id, name, icon, color, "order", is_system)
  VALUES (NEW.id, 'Pendientes', 'list-todo', '#3b82f6', 0, true);
  
  -- Sección Completadas
  INSERT INTO workspace_sections (workspace_id, name, icon, color, "order", is_system)
  VALUES (NEW.id, 'Completadas', 'check-circle-2', '#22c55e', 1, true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear secciones automáticamente
DROP TRIGGER IF EXISTS trigger_create_default_sections ON workspaces;
CREATE TRIGGER trigger_create_default_sections
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION create_default_sections();

-- Migración: Crear secciones para workspaces existentes que no las tengan
DO $$
DECLARE
  ws RECORD;
BEGIN
  FOR ws IN SELECT id FROM workspaces WHERE id NOT IN (SELECT DISTINCT workspace_id FROM workspace_sections)
  LOOP
    INSERT INTO workspace_sections (workspace_id, name, icon, color, "order", is_system)
    VALUES 
      (ws.id, 'Pendientes', 'list-todo', '#3b82f6', 0, true),
      (ws.id, 'Completadas', 'check-circle-2', '#22c55e', 1, true);
  END LOOP;
END $$;

-- Migración: Asignar section_id a tareas existentes basándose en su estado
DO $$
DECLARE
  ws RECORD;
  pending_section_id UUID;
  completed_section_id UUID;
BEGIN
  FOR ws IN SELECT DISTINCT workspace_id FROM workspace_sections
  LOOP
    -- Obtener IDs de las secciones
    SELECT id INTO pending_section_id FROM workspace_sections 
      WHERE workspace_id = ws.workspace_id AND name = 'Pendientes' LIMIT 1;
    SELECT id INTO completed_section_id FROM workspace_sections 
      WHERE workspace_id = ws.workspace_id AND name = 'Completadas' LIMIT 1;
    
    -- Asignar tareas completadas
    UPDATE tasks SET section_id = completed_section_id 
      WHERE workspace_id = ws.workspace_id AND completed = true AND section_id IS NULL;
    
    -- Asignar tareas pendientes (todas las no completadas)
    UPDATE tasks SET section_id = pending_section_id 
      WHERE workspace_id = ws.workspace_id AND completed = false AND section_id IS NULL;
  END LOOP;
END $$;
