-- Corregir la función get_workspace_tasks para devolver el tipo correcto task_source
DROP FUNCTION IF EXISTS get_workspace_tasks(UUID);
CREATE OR REPLACE FUNCTION get_workspace_tasks(p_workspace_id UUID)
RETURNS TABLE (
    id UUID,
    workspace_id UUID,
    title TEXT,
    description TEXT,
    importance INTEGER,
    completed BOOLEAN,
    completed_at TIMESTAMPTZ,
    in_review BOOLEAN,
    reviewed_at TIMESTAMPTZ,
    source task_source,  -- Cambiado de TEXT a task_source
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar acceso al workspace
    IF NOT EXISTS (
        SELECT 1 FROM workspaces w
        WHERE w.id = p_workspace_id
        AND (
            w.user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM workspace_members wm 
                WHERE wm.workspace_id = w.id 
                AND wm.user_id = auth.uid()
                AND wm.status = 'accepted'
            )
        )
    ) THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        t.id,
        t.workspace_id,
        t.title,
        t.description,
        t.importance,
        t.completed,
        t.completed_at,
        t.in_review,
        t.reviewed_at,
        t.source,
        t.user_id,
        t.created_at,
        t.updated_at
    FROM tasks t
    WHERE t.workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql;
