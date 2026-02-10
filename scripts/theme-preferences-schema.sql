-- Esquema para preferencias de tema del usuario
-- Añade columnas theme_mode y accent_color a la tabla profiles

-- Añadir columna para el modo de tema (oscuro/claro)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_mode text NOT NULL DEFAULT 'dark'
CHECK (theme_mode IN ('dark', 'light'));

-- Añadir columna para el color de acento
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT 'none'
CHECK (accent_color IN ('none', 'pink', 'blue', 'green', 'orange', 'cyan', 'red'));

-- Comentarios
COMMENT ON COLUMN profiles.theme_mode IS 'Modo visual: dark o light';
COMMENT ON COLUMN profiles.accent_color IS 'Color de acento: none (por defecto), pink, blue, green, orange, cyan, red';
