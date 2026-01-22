-- ===========================================
-- AÑADIR PERSONALIZACIÓN A WORKSPACES
-- ===========================================
-- Ejecuta este SQL en el SQL Editor de Supabase Dashboard
-- ===========================================

-- Añadir columnas de icono y color a workspaces
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT 'Folder',
ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#6366f1';

-- Comentarios
COMMENT ON COLUMN workspaces.icon IS 'Nombre del icono de Lucide (ej: Folder, Briefcase, Code)';
COMMENT ON COLUMN workspaces.color IS 'Color del workspace en formato hex (ej: #6366f1)';
