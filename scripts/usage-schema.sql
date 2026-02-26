-- =============================================
-- Esquema de uso y planes de usuario
-- Ejecutar en Supabase Dashboard > SQL Editor
-- =============================================

-- 1) Añadir columna 'plan' a profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'pro'));

-- Poner todos los usuarios actuales como 'pro'
UPDATE profiles SET plan = 'pro';

-- 2) Tabla de eventos de uso de IA (histórico)
CREATE TABLE IF NOT EXISTS ai_usage_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('tasks', 'notes')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_id ON ai_usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_created_at ON ai_usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_kind ON ai_usage_events(user_id, kind);

-- 3) Tabla de resumen mensual de uso de IA
CREATE TABLE IF NOT EXISTS ai_usage_monthly (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month        DATE NOT NULL,  -- primer día del mes, ej: 2026-02-01
  tasks_uses   INTEGER NOT NULL DEFAULT 0,
  notes_uses   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_monthly_user_id ON ai_usage_monthly(user_id);

-- 4) RLS para ai_usage_events
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo ven sus propios eventos
CREATE POLICY "Users can view own ai_usage_events" ON ai_usage_events
  FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propios eventos
CREATE POLICY "Users can insert own ai_usage_events" ON ai_usage_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Acceso de servicio (para API routes con service_role o SECURITY DEFINER)
-- Si usas service role en las API routes, no necesitas estas políticas adicionales.
-- Si usas el client normal con el usuario autenticado, las políticas de arriba son suficientes.

-- 5) RLS para ai_usage_monthly
ALTER TABLE ai_usage_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_usage_monthly" ON ai_usage_monthly
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_usage_monthly" ON ai_usage_monthly
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_usage_monthly" ON ai_usage_monthly
  FOR UPDATE USING (auth.uid() = user_id);

-- 6) Actualizar el trigger de nuevo usuario para que incluya plan = 'free'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar',
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) Función RPC para incrementar uso mensual de IA de forma atómica
-- Uso: SELECT increment_ai_usage('user-uuid', '2026-02-01', 'tasks');
CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  p_user_id UUID,
  p_month   DATE,
  p_kind    TEXT  -- 'tasks' o 'notes'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_usage_monthly (user_id, month, tasks_uses, notes_uses)
  VALUES (
    p_user_id,
    p_month,
    CASE WHEN p_kind = 'tasks' THEN 1 ELSE 0 END,
    CASE WHEN p_kind = 'notes' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, month) DO UPDATE SET
    tasks_uses = ai_usage_monthly.tasks_uses + CASE WHEN p_kind = 'tasks' THEN 1 ELSE 0 END,
    notes_uses = ai_usage_monthly.notes_uses + CASE WHEN p_kind = 'notes' THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
