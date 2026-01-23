-- =============================================
-- SCHEMA PARA COMENTARIOS Y ARCHIVOS DE TAREAS
-- =============================================
-- Ejecutar este script en Supabase SQL Editor

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de archivos adjuntos (imágenes, documentos, etc.)
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'document', 'other'
  file_size INTEGER NOT NULL, -- en bytes
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- ruta en Supabase Storage
  thumbnail_path TEXT, -- para imágenes, una versión pequeña
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de actividad de tareas (historial de cambios)
CREATE TABLE IF NOT EXISTS task_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'completed', 'uncompleted', 'assigned', 'unassigned', 'comment_added', 'attachment_added', etc.
  field_changed TEXT, -- campo que cambió (title, description, importance, etc.)
  old_value TEXT, -- valor anterior
  new_value TEXT, -- valor nuevo
  metadata JSONB, -- información adicional (nombre de archivo, nombre de usuario asignado, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_user_id ON task_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_file_type ON task_attachments(file_type);

CREATE INDEX IF NOT EXISTS idx_task_activity_task_id ON task_activity(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_user_id ON task_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_created_at ON task_activity(created_at DESC);

-- =============================================
-- POLÍTICAS RLS
-- =============================================

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;

-- Política para comentarios: usuarios pueden ver/crear/editar/borrar comentarios de tareas en sus workspaces
CREATE POLICY "Users can view comments on accessible tasks" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspaces w ON t.workspace_id = w.id
      LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = auth.uid() AND wm.status = 'accepted'
      WHERE t.id = task_comments.task_id
      AND (w.user_id = auth.uid() OR wm.id IS NOT NULL)
    )
  );

CREATE POLICY "Users can create comments on accessible tasks" ON task_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspaces w ON t.workspace_id = w.id
      LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = auth.uid() AND wm.status = 'accepted'
      WHERE t.id = task_comments.task_id
      AND (w.user_id = auth.uid() OR wm.id IS NOT NULL)
    )
  );

CREATE POLICY "Users can update their own comments" ON task_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Política para attachments: similar a comentarios
CREATE POLICY "Users can view attachments on accessible tasks" ON task_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspaces w ON t.workspace_id = w.id
      LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = auth.uid() AND wm.status = 'accepted'
      WHERE t.id = task_attachments.task_id
      AND (w.user_id = auth.uid() OR wm.id IS NOT NULL)
    )
  );

CREATE POLICY "Users can create attachments on accessible tasks" ON task_attachments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspaces w ON t.workspace_id = w.id
      LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = auth.uid() AND wm.status = 'accepted'
      WHERE t.id = task_attachments.task_id
      AND (w.user_id = auth.uid() OR wm.id IS NOT NULL)
    )
  );

CREATE POLICY "Users can delete their own attachments" ON task_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Política para activity: solo lectura para usuarios con acceso
CREATE POLICY "Users can view activity on accessible tasks" ON task_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspaces w ON t.workspace_id = w.id
      LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = auth.uid() AND wm.status = 'accepted'
      WHERE t.id = task_activity.task_id
      AND (w.user_id = auth.uid() OR wm.id IS NOT NULL)
    )
  );

CREATE POLICY "Users can create activity on accessible tasks" ON task_activity
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN workspaces w ON t.workspace_id = w.id
      LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = auth.uid() AND wm.status = 'accepted'
      WHERE t.id = task_activity.task_id
      AND (w.user_id = auth.uid() OR wm.id IS NOT NULL)
    )
  );

-- =============================================
-- STORAGE BUCKET PARA ARCHIVOS
-- =============================================
-- Ejecutar esto en la sección de Storage de Supabase o usar la API

-- Crear bucket para archivos de tareas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  false, -- privado, requiere autenticación
  10485760, -- 10MB límite
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'task-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- FUNCIÓN PARA REGISTRAR ACTIVIDAD
-- =============================================

CREATE OR REPLACE FUNCTION log_task_activity(
  p_task_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_field_changed TEXT DEFAULT NULL,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO task_activity (task_id, user_id, action, field_changed, old_value, new_value, metadata)
  VALUES (p_task_id, p_user_id, p_action, p_field_changed, p_old_value, p_new_value, p_metadata)
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER PARA ACTUALIZAR updated_at EN COMENTARIOS
-- =============================================

CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();
