-- =============================================
-- FIX DEFINITIVO RLS - SIN RECURSIÓN
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- IMPORTANTE: Las políticas NO pueden referenciarse entre sí
-- workspaces NO puede consultar workspace_members
-- workspace_members NO puede consultar workspaces
-- La lógica de "compartir" se maneja en la aplicación

-- =============================================
-- 1. PROFILES - Todos pueden leer
-- =============================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read" ON public.profiles;
CREATE POLICY "profiles_read" ON public.profiles
    FOR SELECT USING (true);

-- =============================================
-- 2. WORKSPACES - Solo propios (la app añadirá compartidos)
-- =============================================
DROP POLICY IF EXISTS "View own and shared workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "ws_select" ON public.workspaces;
DROP POLICY IF EXISTS "ws_insert" ON public.workspaces;
DROP POLICY IF EXISTS "ws_update" ON public.workspaces;
DROP POLICY IF EXISTS "ws_delete" ON public.workspaces;

-- Ver: propios solamente (compartidos se manejan en app)
CREATE POLICY "ws_select" ON public.workspaces
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ws_insert" ON public.workspaces
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "ws_update" ON public.workspaces
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "ws_delete" ON public.workspaces
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- 3. WORKSPACE_MEMBERS - Solo propias membresías
-- =============================================
DROP POLICY IF EXISTS "View workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_select" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_update" ON public.workspace_members;
DROP POLICY IF EXISTS "wm_delete" ON public.workspace_members;
DROP POLICY IF EXISTS "Owner can invite" ON public.workspace_members;
DROP POLICY IF EXISTS "Update own membership" ON public.workspace_members;
DROP POLICY IF EXISTS "Delete membership" ON public.workspace_members;

-- Ver: solo donde eres el usuario invitado
CREATE POLICY "wm_select" ON public.workspace_members
    FOR SELECT USING (user_id = auth.uid());

-- Insertar: cualquier usuario autenticado puede crear (validación en app)
CREATE POLICY "wm_insert" ON public.workspace_members
    FOR INSERT WITH CHECK (invited_by = auth.uid());

-- Actualizar: solo tus propias membresías
CREATE POLICY "wm_update" ON public.workspace_members
    FOR UPDATE USING (user_id = auth.uid());

-- Eliminar: solo tus propias membresías
CREATE POLICY "wm_delete" ON public.workspace_members
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- 4. TASKS - Solo propias
-- =============================================
DROP POLICY IF EXISTS "View own and shared tasks" ON public.tasks;
DROP POLICY IF EXISTS "Update own and shared tasks" ON public.tasks;
DROP POLICY IF EXISTS "Delete own and shared tasks" ON public.tasks;
DROP POLICY IF EXISTS "Create tasks in own or shared workspaces" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;

CREATE POLICY "tasks_select" ON public.tasks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tasks_insert" ON public.tasks
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "tasks_update" ON public.tasks
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "tasks_delete" ON public.tasks
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- 5. FUNCIÓN SECURITY DEFINER para ver miembros de workspace propio
-- =============================================
CREATE OR REPLACE FUNCTION get_workspace_members(p_workspace_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    role TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    invited_by UUID
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar que el usuario actual es dueño del workspace
    IF NOT EXISTS (
        SELECT 1 FROM workspaces 
        WHERE workspaces.id = p_workspace_id 
        AND workspaces.user_id = auth.uid()
    ) THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        wm.id,
        wm.user_id,
        wm.role,
        wm.status,
        wm.created_at,
        wm.invited_by
    FROM workspace_members wm
    WHERE wm.workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. FUNCIÓN para ver workspaces compartidos
-- =============================================
DROP FUNCTION IF EXISTS get_shared_workspaces();
CREATE OR REPLACE FUNCTION get_shared_workspaces()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    instructions TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.description,
        w.instructions,
        w.user_id,
        w.created_at,
        w.updated_at
    FROM workspaces w
    INNER JOIN workspace_members wm ON wm.workspace_id = w.id
    WHERE wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
    AND w.user_id != auth.uid();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. FUNCIÓN para eliminar miembros (solo dueño puede)
-- =============================================
DROP FUNCTION IF EXISTS remove_workspace_member(UUID, UUID);
DROP FUNCTION IF EXISTS remove_workspace_member_by_id(UUID, UUID);
CREATE OR REPLACE FUNCTION remove_workspace_member_by_id(p_workspace_id UUID, p_member_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER := 0;
    v_member_user_id UUID;
BEGIN
    -- Verificar que el usuario actual es dueño del workspace
    IF NOT EXISTS (
        SELECT 1 FROM workspaces 
        WHERE id = p_workspace_id 
        AND user_id = auth.uid()
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Obtener el user_id del miembro
    SELECT user_id INTO v_member_user_id
    FROM workspace_members
    WHERE id = p_member_id AND workspace_id = p_workspace_id;
    
    -- No permitir eliminar al dueño
    IF v_member_user_id = auth.uid() THEN
        RETURN FALSE;
    END IF;
    
    -- Eliminar el miembro
    DELETE FROM workspace_members
    WHERE id = p_member_id
    AND workspace_id = p_workspace_id;
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. FUNCIÓN para obtener info de workspaces por IDs (para invitaciones)
-- =============================================
DROP FUNCTION IF EXISTS get_workspaces_by_ids(UUID[]);
CREATE OR REPLACE FUNCTION get_workspaces_by_ids(p_workspace_ids UUID[])
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.description
    FROM workspaces w
    WHERE w.id = ANY(p_workspace_ids)
    AND EXISTS (
        SELECT 1 FROM workspace_members wm 
        WHERE wm.workspace_id = w.id 
        AND wm.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 9. FUNCIÓN para invitar usuarios (solo dueño puede)
-- =============================================
DROP FUNCTION IF EXISTS invite_user_to_workspace(UUID, UUID);
CREATE OR REPLACE FUNCTION invite_user_to_workspace(p_workspace_id UUID, p_user_id UUID)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member_id UUID;
BEGIN
    -- Verificar que el usuario actual es dueño del workspace
    IF NOT EXISTS (
        SELECT 1 FROM workspaces 
        WHERE id = p_workspace_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'No tienes permisos para invitar a este workspace';
    END IF;
    
    -- Verificar que no se está invitando a sí mismo
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'No puedes invitarte a ti mismo';
    END IF;
    
    -- Insertar la invitación
    INSERT INTO workspace_members (workspace_id, user_id, role, status, invited_by)
    VALUES (p_workspace_id, p_user_id, 'member', 'pending', auth.uid())
    RETURNING id INTO v_member_id;
    
    RETURN v_member_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 10. FUNCIÓN para obtener un workspace por ID (si tienes acceso)
-- =============================================
DROP FUNCTION IF EXISTS get_workspace_by_id(UUID);
CREATE OR REPLACE FUNCTION get_workspace_by_id(p_workspace_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    instructions TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_shared BOOLEAN
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.name,
        w.description,
        w.instructions,
        w.user_id,
        w.created_at,
        w.updated_at,
        (w.user_id != auth.uid()) AS is_shared
    FROM workspaces w
    WHERE w.id = p_workspace_id
    AND (
        w.user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM workspace_members wm 
            WHERE wm.workspace_id = w.id 
            AND wm.user_id = auth.uid()
            AND wm.status = 'accepted'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 11. FUNCIÓN para obtener tareas de workspace compartido
-- =============================================
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
    source TEXT,
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

-- =============================================
-- 12. TABLA task_assignees (asignación de tareas)
-- =============================================
CREATE TABLE IF NOT EXISTS public.task_assignees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_assignees_task ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON public.task_assignees(user_id);

-- Habilitar RLS
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- Políticas simples
DROP POLICY IF EXISTS "ta_select" ON public.task_assignees;
DROP POLICY IF EXISTS "ta_insert" ON public.task_assignees;
DROP POLICY IF EXISTS "ta_delete" ON public.task_assignees;

CREATE POLICY "ta_select" ON public.task_assignees
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ta_insert" ON public.task_assignees
    FOR INSERT WITH CHECK (assigned_by = auth.uid());

CREATE POLICY "ta_delete" ON public.task_assignees
    FOR DELETE USING (assigned_by = auth.uid() OR user_id = auth.uid());

-- =============================================
-- 13. FUNCIÓN para obtener asignados de una tarea
-- =============================================
DROP FUNCTION IF EXISTS get_task_assignees(UUID);
CREATE OR REPLACE FUNCTION get_task_assignees(p_task_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    avatar TEXT,
    assigned_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_workspace_id UUID;
BEGIN
    -- Obtener workspace_id de la tarea
    SELECT workspace_id INTO v_workspace_id FROM tasks WHERE tasks.id = p_task_id;
    
    -- Verificar acceso al workspace
    IF NOT EXISTS (
        SELECT 1 FROM workspaces w
        WHERE w.id = v_workspace_id
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
        ta.id,
        ta.user_id,
        p.name,
        p.avatar,
        ta.created_at AS assigned_at
    FROM task_assignees ta
    JOIN profiles p ON p.id = ta.user_id
    WHERE ta.task_id = p_task_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 14. FUNCIÓN para asignar usuario a tarea
-- =============================================
DROP FUNCTION IF EXISTS assign_user_to_task(UUID, UUID);
CREATE OR REPLACE FUNCTION assign_user_to_task(p_task_id UUID, p_user_id UUID)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_workspace_id UUID;
    v_assignee_id UUID;
BEGIN
    -- Obtener workspace_id de la tarea
    SELECT workspace_id INTO v_workspace_id FROM tasks WHERE id = p_task_id;
    
    -- Verificar que el usuario actual tiene acceso al workspace
    IF NOT EXISTS (
        SELECT 1 FROM workspaces w
        WHERE w.id = v_workspace_id
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
        RAISE EXCEPTION 'No tienes acceso a esta tarea';
    END IF;
    
    -- Verificar que el usuario a asignar es miembro del workspace
    IF NOT EXISTS (
        SELECT 1 FROM workspaces w
        WHERE w.id = v_workspace_id
        AND (
            w.user_id = p_user_id
            OR EXISTS (
                SELECT 1 FROM workspace_members wm 
                WHERE wm.workspace_id = w.id 
                AND wm.user_id = p_user_id
                AND wm.status = 'accepted'
            )
        )
    ) THEN
        RAISE EXCEPTION 'El usuario no es miembro del workspace';
    END IF;
    
    -- Insertar asignación
    INSERT INTO task_assignees (task_id, user_id, assigned_by)
    VALUES (p_task_id, p_user_id, auth.uid())
    RETURNING id INTO v_assignee_id;
    
    RETURN v_assignee_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 15. FUNCIÓN para desasignar usuario de tarea
-- =============================================
DROP FUNCTION IF EXISTS unassign_user_from_task(UUID, UUID);
CREATE OR REPLACE FUNCTION unassign_user_from_task(p_task_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_workspace_id UUID;
    v_deleted INTEGER;
BEGIN
    -- Obtener workspace_id de la tarea
    SELECT workspace_id INTO v_workspace_id FROM tasks WHERE id = p_task_id;
    
    -- Verificar que el usuario actual tiene acceso al workspace
    IF NOT EXISTS (
        SELECT 1 FROM workspaces w
        WHERE w.id = v_workspace_id
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
        RETURN FALSE;
    END IF;
    
    -- Eliminar asignación
    DELETE FROM task_assignees
    WHERE task_id = p_task_id AND user_id = p_user_id;
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 16. FUNCIÓN para obtener miembros de un workspace (para asignar)
-- =============================================
DROP FUNCTION IF EXISTS get_workspace_members_for_assignment(UUID);
CREATE OR REPLACE FUNCTION get_workspace_members_for_assignment(p_workspace_id UUID)
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    avatar TEXT,
    role TEXT
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
    
    -- Retornar dueño y miembros aceptados (sin duplicados)
    RETURN QUERY
    -- Dueño del workspace
    SELECT 
        w.user_id,
        p.name,
        p.avatar,
        'owner'::TEXT AS role
    FROM workspaces w
    JOIN profiles p ON p.id = w.user_id
    WHERE w.id = p_workspace_id
    
    UNION
    
    -- Miembros aceptados (excluye al dueño si está en members)
    SELECT 
        wm.user_id,
        p.name,
        p.avatar,
        wm.role
    FROM workspace_members wm
    JOIN profiles p ON p.id = wm.user_id
    WHERE wm.workspace_id = p_workspace_id
    AND wm.status = 'accepted'
    AND wm.user_id NOT IN (
        SELECT w2.user_id FROM workspaces w2 WHERE w2.id = p_workspace_id
    );
END;
$$ LANGUAGE plpgsql;
