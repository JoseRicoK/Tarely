-- =============================================
-- Migración de avatares predefinidos a DiceBear
-- 
-- Limpia los avatares predefinidos (avatar1.png..avatar20.png) 
-- y deja NULL para que el frontend use DiceBear automáticamente.
-- Los avatares personalizados (subidos por el usuario) se mantienen.
-- =============================================

-- 1. Limpiar avatares predefinidos en profiles (dejar NULL)
UPDATE profiles 
SET avatar = NULL 
WHERE avatar ~ '^avatar\d+\.png$';

-- 2. Actualizar el DEFAULT de la columna
ALTER TABLE profiles ALTER COLUMN avatar SET DEFAULT NULL;

-- 3. Actualizar la función handle_new_user para no usar avatar predefinido
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

-- 4. (Opcional) Después de migrar, puedes eliminar los avatares predefinidos
-- del bucket 'avatars' en Supabase Storage manualmente:
-- avatar1.png, avatar2.png, ..., avatar20.png
