-- Tabla para almacenar sugerencias y reportes de errores
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('suggestion', 'bug')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  user_email TEXT,
  user_name TEXT
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- RLS (Row Level Security)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio feedback
CREATE POLICY "Users can view their own feedback"
  ON feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden crear feedback
CREATE POLICY "Users can create feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar su propio feedback (opcional)
CREATE POLICY "Users can update their own feedback"
  ON feedback
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar su propio feedback (opcional)
CREATE POLICY "Users can delete their own feedback"
  ON feedback
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE feedback IS 'Almacena sugerencias y reportes de errores de los usuarios';
COMMENT ON COLUMN feedback.type IS 'Tipo de feedback: suggestion (sugerencia) o bug (error)';
COMMENT ON COLUMN feedback.status IS 'Estado del feedback: pending, reviewed, resolved';
COMMENT ON COLUMN feedback.message IS 'Contenido del mensaje de feedback';
COMMENT ON COLUMN feedback.user_email IS 'Email del usuario (desnormalizado para facilitar consultas)';
COMMENT ON COLUMN feedback.user_name IS 'Nombre del usuario (desnormalizado para facilitar consultas)';
