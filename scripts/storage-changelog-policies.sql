-- Configuración de políticas de Storage para el bucket 'changelog'
-- Ejecutar en Supabase SQL Editor

-- 1. Asegurarse de que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public)
VALUES ('changelog', 'changelog', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Changelog imágenes públicas - lectura" ON storage.objects;
DROP POLICY IF EXISTS "Admin puede subir imágenes changelog" ON storage.objects;
DROP POLICY IF EXISTS "Admin puede actualizar imágenes changelog" ON storage.objects;
DROP POLICY IF EXISTS "Admin puede eliminar imágenes changelog" ON storage.objects;

-- 3. Política de LECTURA (SELECT): Todos pueden ver las imágenes del changelog
CREATE POLICY "Changelog imágenes públicas - lectura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'changelog');

-- 4. Política de CREACIÓN (INSERT): Solo admin puede subir
CREATE POLICY "Admin puede subir imágenes changelog"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'changelog'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = 'josemariark@gmail.com'
  )
);

-- 5. Política de ACTUALIZACIÓN (UPDATE): Solo admin puede actualizar
CREATE POLICY "Admin puede actualizar imágenes changelog"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'changelog'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = 'josemariark@gmail.com'
  )
)
WITH CHECK (
  bucket_id = 'changelog'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = 'josemariark@gmail.com'
  )
);

-- 6. Política de ELIMINACIÓN (DELETE): Solo admin puede eliminar
CREATE POLICY "Admin puede eliminar imágenes changelog"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'changelog'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = 'josemariark@gmail.com'
  )
);
