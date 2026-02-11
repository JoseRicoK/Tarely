-- =============================================
-- SQL para crear la tabla de perfiles de usuario
-- Ejecutar en Supabase Dashboard > SQL Editor
-- =============================================

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver solo su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Política: Los usuarios pueden actualizar solo su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =============================================
-- Actualizar las tablas de workspaces y tasks
-- para que estén asociadas al usuario
-- =============================================

-- Añadir columna user_id a workspaces si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workspaces' AND column_name = 'user_id') THEN
        ALTER TABLE workspaces ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Añadir columna user_id a tasks si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'user_id') THEN
        ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Crear índices para user_id
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- =============================================
-- Actualizar políticas RLS para workspaces
-- =============================================

-- Eliminar políticas anteriores
DROP POLICY IF EXISTS "Allow anonymous select workspaces" ON workspaces;
DROP POLICY IF EXISTS "Allow anonymous insert workspaces" ON workspaces;
DROP POLICY IF EXISTS "Allow anonymous update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Allow anonymous delete workspaces" ON workspaces;
DROP POLICY IF EXISTS "Allow authenticated select workspaces" ON workspaces;
DROP POLICY IF EXISTS "Allow authenticated insert workspaces" ON workspaces;
DROP POLICY IF EXISTS "Allow authenticated update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Allow authenticated delete workspaces" ON workspaces;

-- Nuevas políticas: solo el propietario puede acceder
CREATE POLICY "Users can view own workspaces" ON workspaces
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workspaces" ON workspaces
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces" ON workspaces
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces" ON workspaces
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- Actualizar políticas RLS para tasks
-- =============================================

-- Eliminar políticas anteriores
DROP POLICY IF EXISTS "Allow anonymous select tasks" ON tasks;
DROP POLICY IF EXISTS "Allow anonymous insert tasks" ON tasks;
DROP POLICY IF EXISTS "Allow anonymous update tasks" ON tasks;
DROP POLICY IF EXISTS "Allow anonymous delete tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated select tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated insert tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated update tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated delete tasks" ON tasks;

-- Nuevas políticas: solo el propietario puede acceder
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- Función para crear perfil automáticamente
-- cuando se registra un usuario
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, avatar)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
