-- Schema para integración con Google Calendar
-- Este script crea las tablas necesarias para almacenar tokens OAuth y sincronización

-- Tabla para almacenar tokens de Google Calendar por usuario
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla para mapear tareas de Tarely con eventos de Google Calendar
CREATE TABLE IF NOT EXISTS task_google_calendar_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  google_calendar_id TEXT NOT NULL DEFAULT 'primary',
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_task_google_calendar_sync_task_id ON task_google_calendar_sync(task_id);
CREATE INDEX IF NOT EXISTS idx_task_google_calendar_sync_user_id ON task_google_calendar_sync(user_id);

-- RLS (Row Level Security) policies
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_google_calendar_sync ENABLE ROW LEVEL SECURITY;

-- Políticas para google_calendar_tokens
DROP POLICY IF EXISTS "Users can view their own Google Calendar tokens" ON google_calendar_tokens;
CREATE POLICY "Users can view their own Google Calendar tokens"
  ON google_calendar_tokens
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own Google Calendar tokens" ON google_calendar_tokens;
CREATE POLICY "Users can insert their own Google Calendar tokens"
  ON google_calendar_tokens
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own Google Calendar tokens" ON google_calendar_tokens;
CREATE POLICY "Users can update their own Google Calendar tokens"
  ON google_calendar_tokens
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own Google Calendar tokens" ON google_calendar_tokens;
CREATE POLICY "Users can delete their own Google Calendar tokens"
  ON google_calendar_tokens
  FOR DELETE
  USING (user_id = auth.uid());

-- Políticas para task_google_calendar_sync
DROP POLICY IF EXISTS "Users can view their own task syncs" ON task_google_calendar_sync;
CREATE POLICY "Users can view their own task syncs"
  ON task_google_calendar_sync
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own task syncs" ON task_google_calendar_sync;
CREATE POLICY "Users can insert their own task syncs"
  ON task_google_calendar_sync
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own task syncs" ON task_google_calendar_sync;
CREATE POLICY "Users can update their own task syncs"
  ON task_google_calendar_sync
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own task syncs" ON task_google_calendar_sync;
CREATE POLICY "Users can delete their own task syncs"
  ON task_google_calendar_sync
  FOR DELETE
  USING (user_id = auth.uid());

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_google_calendar_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_task_google_calendar_sync_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_google_calendar_tokens_updated_at ON google_calendar_tokens;
CREATE TRIGGER trigger_update_google_calendar_tokens_updated_at
  BEFORE UPDATE ON google_calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_google_calendar_tokens_updated_at();

DROP TRIGGER IF EXISTS trigger_update_task_google_calendar_sync_updated_at ON task_google_calendar_sync;
CREATE TRIGGER trigger_update_task_google_calendar_sync_updated_at
  BEFORE UPDATE ON task_google_calendar_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_task_google_calendar_sync_updated_at();
