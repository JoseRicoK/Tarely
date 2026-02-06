-- Agregar campo avatar_version a la tabla profiles para cache busting
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_version INTEGER DEFAULT 1;

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_version ON profiles(avatar_version);

-- Comentario para documentación
COMMENT ON COLUMN profiles.avatar_version IS 'Versión del avatar para cache busting. Se incrementa cada vez que se actualiza el avatar';

-- Actualizar avatares existentes a versión 1 si están en NULL
UPDATE profiles SET avatar_version = 1 WHERE avatar_version IS NULL;
