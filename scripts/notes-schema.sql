-- =============================================
-- SCHEMA: Notes System for Tarely
-- =============================================

-- 1) Folders (carpetas jerárquicas dentro de workspaces)
CREATE TABLE IF NOT EXISTS note_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES note_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Folder',
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2) Notes (notas con contenido rico)
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES note_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Sin título',
  content_json JSONB DEFAULT '{}',
  content_text TEXT DEFAULT '',
  is_pinned BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  cover_image TEXT,
  icon TEXT DEFAULT '📝',
  sort_order INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3) Note Templates (plantillas de notas)
CREATE TABLE IF NOT EXISTS note_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  content_json JSONB DEFAULT '{}',
  icon TEXT DEFAULT '📋',
  is_global BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_note_folders_workspace ON note_folders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_note_folders_parent ON note_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_note_folders_user ON note_folders(user_id);

CREATE INDEX IF NOT EXISTS idx_notes_workspace ON notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_task ON notes(task_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_note_templates_user ON note_templates(user_id);

-- =============================================
-- TRIGGERS: auto-update updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();

CREATE TRIGGER trigger_note_folders_updated_at
  BEFORE UPDATE ON note_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;

-- Folders: usuarios solo ven sus propias carpetas
CREATE POLICY "Users can view own folders" ON note_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders" ON note_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON note_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON note_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Notes: usuarios solo ven sus propias notas
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- Templates: ver propias + globales, crear/editar propias
CREATE POLICY "Users can view own and global templates" ON note_templates
  FOR SELECT USING (auth.uid() = user_id OR is_global = true);

CREATE POLICY "Users can create own templates" ON note_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON note_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON note_templates
  FOR DELETE USING (auth.uid() = user_id);
