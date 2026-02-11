-- =============================================================
-- Esquema para tareas recurrentes
-- Modelo: Una tarea + una regla de recurrencia. 
-- Al completar, se recicla la misma tarea con nueva due_date.
-- =============================================================

-- Tipo ENUM para la frecuencia
DO $$ BEGIN
  CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Añadir columnas de recurrencia directamente en la tabla tasks
-- (modelo minimalista: no creamos tabla separada para v1)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_frequency recurrence_frequency;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1 CHECK (recurrence_interval >= 1 AND recurrence_interval <= 365);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_days_of_week INTEGER[] DEFAULT NULL; -- 0=Dom, 1=Lun, ..., 6=Sáb
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_day_of_month INTEGER DEFAULT NULL CHECK (recurrence_day_of_month IS NULL OR (recurrence_day_of_month >= 1 AND recurrence_day_of_month <= 31));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_month_of_year INTEGER DEFAULT NULL CHECK (recurrence_month_of_year IS NULL OR (recurrence_month_of_year >= 1 AND recurrence_month_of_year <= 12));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_ends_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_due_at TIMESTAMPTZ DEFAULT NULL;

-- Índice para encontrar tareas recurrentes rápidamente
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON tasks (recurrence_frequency) WHERE recurrence_frequency IS NOT NULL;

-- Índice para filtrar por next_due_at (tareas recurrentes que deben mostrarse)
CREATE INDEX IF NOT EXISTS idx_tasks_next_due_at ON tasks (next_due_at) WHERE next_due_at IS NOT NULL;

-- RLS: las políticas existentes ya cubren las tareas, 
-- las nuevas columnas se heredan automáticamente.

-- Comentarios
COMMENT ON COLUMN tasks.recurrence_frequency IS 'Frecuencia de recurrencia: daily, weekly, monthly, yearly';
COMMENT ON COLUMN tasks.recurrence_interval IS 'Cada cuántas unidades se repite (ej: cada 2 semanas)';
COMMENT ON COLUMN tasks.recurrence_days_of_week IS 'Días de la semana para weekly (0=Dom..6=Sáb)';
COMMENT ON COLUMN tasks.recurrence_day_of_month IS 'Día del mes para monthly y yearly (1-31)';
COMMENT ON COLUMN tasks.recurrence_month_of_year IS 'Mes del año para yearly (1-12)';
COMMENT ON COLUMN tasks.recurrence_ends_at IS 'Fecha límite de la recurrencia (nullable = sin fin)';
COMMENT ON COLUMN tasks.next_due_at IS 'Cuándo debe aparecer la tarea recurrente como pendiente (se avanza al completar)';
