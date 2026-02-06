-- Configuración de políticas de Storage para el bucket 'avatars'
-- Ejecutar en Supabase SQL Editor

-- 1. Asegurarse de que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Eliminar políticas existentes si las hay (para empezar limpio)
DROP POLICY IF EXISTS "Avatares públicos - lectura" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su avatar" ON storage.objects;

-- 3. Política de LECTURA (SELECT): Todos pueden ver todos los avatares
CREATE POLICY "Avatares públicos - lectura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 4. Política de CREACIÓN (INSERT): Los usuarios autenticados pueden subir a su propia carpeta
CREATE POLICY "Usuarios pueden subir su avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política de ACTUALIZACIÓN (UPDATE): Los usuarios pueden actualizar sus propios avatares
CREATE POLICY "Usuarios pueden actualizar su avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Política de ELIMINACIÓN (DELETE): Los usuarios pueden eliminar sus propios avatares
CREATE POLICY "Usuarios pueden eliminar su avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Verificación: Mostrar las políticas creadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%avatar%'
ORDER BY policyname;
