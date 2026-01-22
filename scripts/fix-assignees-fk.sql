-- Migración: Arreglar foreign key entre task_assignees y profiles
-- Este FK es necesario para que Supabase pueda hacer JOINs automáticos

-- Verificar que existe la tabla task_assignees
DO $$
BEGIN
  -- Añadir FK si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'task_assignees_user_id_fkey'
  ) THEN
    ALTER TABLE task_assignees
      ADD CONSTRAINT task_assignees_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON task_assignees(task_id);

-- Función para obtener miembros asignables SIN DUPLICADOS
CREATE OR REPLACE FUNCTION get_workspace_members_for_assignment(p_workspace_id UUID)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  avatar TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (p.id)
    p.id AS user_id,
    p.name,
    p.avatar,
    CASE 
      WHEN w.user_id = p.id THEN 'owner'::TEXT
      ELSE 'member'::TEXT
    END AS role
  FROM profiles p
  INNER JOIN workspaces w ON w.id = p_workspace_id
  LEFT JOIN workspace_members wm ON wm.workspace_id = p_workspace_id AND wm.user_id = p.id
  WHERE 
    w.user_id = p.id  -- Es el dueño
    OR wm.user_id = p.id  -- Es miembro
  ORDER BY p.id, 
    CASE WHEN w.user_id = p.id THEN 0 ELSE 1 END;  -- Priorizar owner
END;
$$;

-- Política RLS para task_assignees si no existe
DO $$
BEGIN
  -- Permitir ver assignees de tareas en workspaces propios o compartidos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'task_assignees' AND policyname = 'Users can view assignees'
  ) THEN
    CREATE POLICY "Users can view assignees" ON task_assignees
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM tasks t
          INNER JOIN workspaces w ON w.id = t.workspace_id
          LEFT JOIN workspace_members wm ON wm.workspace_id = w.id
          WHERE t.id = task_assignees.task_id
            AND (w.user_id = auth.uid() OR wm.user_id = auth.uid())
        )
      );
  END IF;
END $$;
