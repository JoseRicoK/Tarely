-- ===========================================
-- AÑADIR SORT_ORDER A WORKSPACES
-- ===========================================
-- 
-- Este script añade la columna sort_order a la tabla workspaces
-- e inicializa los valores para workspaces existentes
--
-- ===========================================

-- Añadir columna sort_order
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Inicializar sort_order para workspaces existentes basándose en created_at
-- (los más antiguos primero)
WITH ranked_workspaces AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as row_num
  FROM workspaces
  WHERE sort_order = 0
)
UPDATE workspaces
SET sort_order = ranked_workspaces.row_num
FROM ranked_workspaces
WHERE workspaces.id = ranked_workspaces.id;

-- Crear índice para mejorar el rendimiento de ordenación
CREATE INDEX IF NOT EXISTS idx_workspaces_sort_order ON workspaces(sort_order ASC);

-- Comentario para documentación
COMMENT ON COLUMN workspaces.sort_order IS 'Orden de visualización del workspace (0-based)';

-- ===========================================
-- FIN DEL SCRIPT
-- ===========================================
