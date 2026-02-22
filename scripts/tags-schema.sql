-- Tabla de etiquetas (tags) por workspace
-- Cada workspace tiene sus propias etiquetas personalizables

CREATE TABLE IF NOT EXISTS workspace_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación muchos-a-muchos entre tareas y tags
CREATE TABLE IF NOT EXISTS task_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES workspace_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, tag_id) -- Evitar duplicados
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workspace_tags_workspace ON workspace_tags(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag_id);

-- Trigger para updated_at en workspace_tags
CREATE OR REPLACE FUNCTION update_workspace_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_workspace_tags ON workspace_tags;
CREATE TRIGGER trigger_update_workspace_tags
  BEFORE UPDATE ON workspace_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_tags_updated_at();

-- ============== RLS Policies para workspace_tags ==============
ALTER TABLE workspace_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tags of their workspaces" ON workspace_tags;
DROP POLICY IF EXISTS "Workspace owners can create tags" ON workspace_tags;
DROP POLICY IF EXISTS "Workspace owners can update tags" ON workspace_tags;
DROP POLICY IF EXISTS "Workspace owners can delete tags" ON workspace_tags;

-- Los usuarios pueden ver tags de sus workspaces o compartidos
CREATE POLICY "Users can view tags of their workspaces" ON workspace_tags
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

-- Solo el dueño puede crear tags
CREATE POLICY "Workspace owners can create tags" ON workspace_tags
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
    OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Solo el dueño puede actualizar tags
CREATE POLICY "Workspace owners can update tags" ON workspace_tags
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- Solo el dueño puede eliminar tags
CREATE POLICY "Workspace owners can delete tags" ON workspace_tags
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- ============== RLS Policies para task_tags ==============
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view task tags" ON task_tags;
DROP POLICY IF EXISTS "Users can add task tags" ON task_tags;
DROP POLICY IF EXISTS "Users can remove task tags" ON task_tags;

-- Los usuarios pueden ver tags de tareas de sus workspaces
CREATE POLICY "Users can view task tags" ON task_tags
  FOR SELECT
  USING (
    task_id IN (
      SELECT t.id FROM tasks t 
      JOIN workspaces w ON t.workspace_id = w.id 
      WHERE w.user_id = auth.uid()
    )
    OR
    task_id IN (
      SELECT t.id FROM tasks t 
      JOIN workspace_members wm ON t.workspace_id = wm.workspace_id 
      WHERE wm.user_id = auth.uid()
    )
  );

-- Los usuarios pueden añadir tags a tareas de sus workspaces
CREATE POLICY "Users can add task tags" ON task_tags
  FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT t.id FROM tasks t 
      JOIN workspaces w ON t.workspace_id = w.id 
      WHERE w.user_id = auth.uid()
    )
    OR
    task_id IN (
      SELECT t.id FROM tasks t 
      JOIN workspace_members wm ON t.workspace_id = wm.workspace_id 
      WHERE wm.user_id = auth.uid()
    )
  );

-- Los usuarios pueden quitar tags de tareas de sus workspaces
CREATE POLICY "Users can remove task tags" ON task_tags
  FOR DELETE
  USING (
    task_id IN (
      SELECT t.id FROM tasks t 
      JOIN workspaces w ON t.workspace_id = w.id 
      WHERE w.user_id = auth.uid()
    )
    OR
    task_id IN (
      SELECT t.id FROM tasks t 
      JOIN workspace_members wm ON t.workspace_id = wm.workspace_id 
      WHERE wm.user_id = auth.uid()
    )
  );
