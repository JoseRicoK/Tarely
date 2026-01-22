-- =============================================
-- SISTEMA DE COMPARTIR WORKSPACES
-- Ejecutar en Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Tabla de miembros del workspace
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_status ON public.workspace_members(status);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_workspace_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_workspace_members_updated_at ON public.workspace_members;
CREATE TRIGGER trigger_update_workspace_members_updated_at
    BEFORE UPDATE ON public.workspace_members
    FOR EACH ROW
    EXECUTE FUNCTION update_workspace_members_updated_at();

-- 4. Habilitar RLS
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS PARA workspace_members
-- (Evitando recursión infinita)
-- =============================================

DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can invite users" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can update own membership" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can be removed" ON public.workspace_members;

-- Ver miembros: si eres el usuario o eres dueño del workspace
CREATE POLICY "View workspace members" ON public.workspace_members
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- Invitar: solo el dueño del workspace puede invitar
CREATE POLICY "Owner can invite" ON public.workspace_members
    FOR INSERT
    WITH CHECK (
        invited_by = auth.uid()
        AND workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- Actualizar: el propio usuario puede aceptar/rechazar sus invitaciones
CREATE POLICY "Update own membership" ON public.workspace_members
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Eliminar: el dueño puede eliminar miembros o el usuario puede salir
CREATE POLICY "Delete membership" ON public.workspace_members
    FOR DELETE
    USING (
        user_id = auth.uid()
        OR workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- POLÍTICAS RLS PARA workspaces (ACTUALIZADAS)
-- =============================================

DROP POLICY IF EXISTS "Users can view own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view own and shared workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "View own and shared workspaces" ON public.workspaces;

-- Ver workspaces: propios, aceptados, o con invitación pendiente (para ver info)
CREATE POLICY "View own and shared workspaces" ON public.workspaces
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- POLÍTICAS RLS PARA tasks (ACTUALIZADAS)
-- =============================================

DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view own and shared tasks" ON public.tasks;
CREATE POLICY "View own and shared tasks" ON public.tasks
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND status = 'accepted'
        )
        OR workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own and shared tasks" ON public.tasks;
CREATE POLICY "Update own and shared tasks" ON public.tasks
    FOR UPDATE
    USING (
        user_id = auth.uid() 
        OR workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND status = 'accepted'
        )
        OR workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own and shared tasks" ON public.tasks;
CREATE POLICY "Delete own and shared tasks" ON public.tasks
    FOR DELETE
    USING (
        user_id = auth.uid() 
        OR workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid() AND status = 'accepted'
        )
        OR workspace_id IN (
            SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks in own or shared workspaces" ON public.tasks;
CREATE POLICY "Create tasks in own or shared workspaces" ON public.tasks
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND (
            workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid())
            OR workspace_id IN (
                SELECT workspace_id FROM public.workspace_members 
                WHERE user_id = auth.uid() AND status = 'accepted'
            )
        )
    );

-- =============================================
-- TRIGGER PARA AUTO-AGREGAR DUEÑO COMO MIEMBRO
-- =============================================

CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.workspace_members (workspace_id, user_id, role, status, invited_by)
    VALUES (NEW.id, NEW.user_id, 'owner', 'accepted', NEW.user_id)
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_add_owner_as_member ON public.workspaces;
CREATE TRIGGER trigger_add_owner_as_member
    AFTER INSERT ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION add_owner_as_member();

-- =============================================
-- CONSTRAINT UNIQUE PARA NOMBRE DE USUARIO
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_name_unique'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_name_unique UNIQUE (name);
    END IF;
END $$;

-- =============================================
-- POLÍTICA PARA VER PERFILES (para invitaciones)
-- =============================================

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT
    USING (true);

-- =============================================
-- MIGRAR WORKSPACES EXISTENTES
-- =============================================

INSERT INTO public.workspace_members (workspace_id, user_id, role, status, invited_by)
SELECT id, user_id, 'owner', 'accepted', user_id
FROM public.workspaces
WHERE user_id IS NOT NULL
ON CONFLICT (workspace_id, user_id) DO NOTHING;
