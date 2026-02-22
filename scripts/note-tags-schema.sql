-- ============================================================
-- NOTE TAGS: Junction table linking notes to workspace_tags
-- Run this AFTER schema.sql, workspace-customization.sql (tags)
-- ============================================================

-- Junction table
CREATE TABLE IF NOT EXISTS note_tags (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id    UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES workspace_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(note_id, tag_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id  ON note_tags(tag_id);

-- Enable RLS
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;

-- SELECT: users who have access to the workspace that owns the note
CREATE POLICY "note_tags_select" ON note_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes n
      JOIN workspaces w ON w.id = n.workspace_id
      WHERE n.id = note_tags.note_id
        AND (
          w.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
          )
        )
    )
  );

-- INSERT: same membership check
CREATE POLICY "note_tags_insert" ON note_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes n
      JOIN workspaces w ON w.id = n.workspace_id
      WHERE n.id = note_tags.note_id
        AND (
          w.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
          )
        )
    )
  );

-- DELETE: same membership check
CREATE POLICY "note_tags_delete" ON note_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM notes n
      JOIN workspaces w ON w.id = n.workspace_id
      WHERE n.id = note_tags.note_id
        AND (
          w.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
          )
        )
    )
  );
