-- =====================================================
-- MIGRACIÓN: Sistema de Confirmación de Email
-- =====================================================
-- Este script añade las columnas necesarias para el sistema
-- de confirmación de email y actualiza las policies de RLS

-- 1. Añadir columnas a la tabla profiles
-- =====================================================

-- Columna para saber si el email está confirmado
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false;

-- Columna para el token de confirmación
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS confirmation_token TEXT;

-- Columna para la fecha de expiración del token
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS confirmation_token_expires TIMESTAMPTZ;

-- 2. Crear índices para mejor rendimiento
-- =====================================================

-- Índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_profiles_confirmation_token 
ON profiles(confirmation_token) 
WHERE confirmation_token IS NOT NULL;

-- 3. Actualizar usuarios existentes como confirmados
-- =====================================================
-- Los usuarios que ya existen se marcan como confirmados
UPDATE profiles 
SET email_confirmed = true 
WHERE email_confirmed IS NULL OR email_confirmed = false;

-- 4. Agregar comentarios para documentación
-- =====================================================

COMMENT ON COLUMN profiles.email_confirmed IS 'Indica si el correo electrónico del usuario ha sido confirmado';
COMMENT ON COLUMN profiles.confirmation_token IS 'Token único para confirmar el correo electrónico';
COMMENT ON COLUMN profiles.confirmation_token_expires IS 'Fecha de expiración del token de confirmación';

-- 5. Políticas de Seguridad (RLS) para profiles
-- =====================================================

-- Eliminar policies antiguas si existen para recrearlas
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for registration" ON profiles;

-- Habilitar RLS en la tabla profiles (por si no está habilitado)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir que los usuarios vean todos los perfiles (para colaboración)
CREATE POLICY "Authenticated users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Policy: Permitir INSERT durante el registro (sin autenticación)
-- Esto es necesario porque durante el registro el usuario aún no tiene sesión
CREATE POLICY "Enable insert for registration"
ON profiles FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Permitir que los usuarios actualicen solo su propio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Permitir que los usuarios vean su propio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 6. Verificación
-- =====================================================

-- Verificar que las columnas se crearon correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name IN ('email_confirmed', 'confirmation_token', 'confirmation_token_expires')
  ) THEN
    RAISE NOTICE '✅ Columnas de confirmación de email creadas correctamente';
  ELSE
    RAISE WARNING '⚠️ Error: Las columnas no se crearon correctamente';
  END IF;
END $$;

-- Verificar que las policies existen
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Enable insert for registration'
  ) THEN
    RAISE NOTICE '✅ Policies de seguridad configuradas correctamente';
  ELSE
    RAISE WARNING '⚠️ Error: Las policies no se crearon correctamente';
  END IF;
END $$;
