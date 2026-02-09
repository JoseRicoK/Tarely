-- Añadir columnas para reset de contraseña en la tabla profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS reset_password_token TEXT,
ADD COLUMN IF NOT EXISTS reset_password_token_expires TIMESTAMPTZ;

-- Índice para búsqueda rápida por token
CREATE INDEX IF NOT EXISTS idx_profiles_reset_password_token 
ON profiles (reset_password_token) 
WHERE reset_password_token IS NOT NULL;
