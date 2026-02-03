-- =============================================
-- FIX: Relación entre task_comments y profiles
-- Y agregar soporte para imágenes en comentarios
-- =============================================
-- Este script corrige la relación de clave foránea para que
-- task_comments pueda hacer JOIN con profiles en lugar de auth.users
-- Y agrega campos para soportar imágenes embebidas en comentarios

-- Primero, eliminar la foreign key existente a auth.users
ALTER TABLE task_comments 
DROP CONSTRAINT IF EXISTS task_comments_user_id_fkey;

-- Agregar foreign key a profiles
ALTER TABLE task_comments
ADD CONSTRAINT task_comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Agregar columnas para soportar imágenes en comentarios (si no existen)
ALTER TABLE task_comments
ADD COLUMN IF NOT EXISTS images TEXT[];  -- Array de URLs de imágenes embebidas

-- Lo mismo para task_attachments
ALTER TABLE task_attachments 
DROP CONSTRAINT IF EXISTS task_attachments_user_id_fkey;

ALTER TABLE task_attachments
ADD CONSTRAINT task_attachments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Lo mismo para task_activity
ALTER TABLE task_activity 
DROP CONSTRAINT IF EXISTS task_activity_user_id_fkey;

ALTER TABLE task_activity
ADD CONSTRAINT task_activity_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Verificar que las relaciones se crearon correctamente
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('task_comments', 'task_attachments', 'task_activity')
    AND kcu.column_name = 'user_id'
ORDER BY tc.table_name;
