-- Configuración de políticas de Storage para el bucket 'note-attachments'
-- Ejecutar en Supabase SQL Editor

-- 1. Crear el bucket si no existe (público para que las URLs funcionen directamente)
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-attachments', 'note-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Eliminar políticas existentes si las hay (para empezar limpio)
DROP POLICY IF EXISTS "Adjuntos de notas - lectura pública" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir adjuntos a sus notas" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus adjuntos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus adjuntos" ON storage.objects;

-- 3. Política de LECTURA (SELECT): Todos pueden leer (bucket público)
CREATE POLICY "Adjuntos de notas - lectura pública"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'note-attachments');

-- 4. Política de CREACIÓN (INSERT): Usuarios autenticados pueden subir a su propia carpeta
--    Estructura de ruta: {userId}/{noteId}/{timestamp}-{filename}
CREATE POLICY "Usuarios pueden subir adjuntos a sus notas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'note-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política de ACTUALIZACIÓN (UPDATE): Solo el propietario puede actualizar
CREATE POLICY "Usuarios pueden actualizar sus adjuntos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'note-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Política de ELIMINACIÓN (DELETE): Solo el propietario puede eliminar
CREATE POLICY "Usuarios pueden eliminar sus adjuntos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'note-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
