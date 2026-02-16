-- =============================================
-- MIGRATION: Bidirectional Notes-Tasks Linking
-- =============================================
-- This migration adds bidirectional linking between notes and tasks
-- and adds completion status to notes

-- 1) Add note_id column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS note_id UUID REFERENCES notes(id) ON DELETE SET NULL;

-- 2) Add completed and completed_at columns to notes table
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 3) Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_tasks_note ON tasks(note_id);
CREATE INDEX IF NOT EXISTS idx_notes_completed ON notes(completed);

-- 4) Add comments for documentation
COMMENT ON COLUMN tasks.note_id IS 'Reference to linked note (bidirectional with notes.task_id)';
COMMENT ON COLUMN notes.completed IS 'Whether the linked task has been completed';
COMMENT ON COLUMN notes.completed_at IS 'When the linked task was completed';

-- 5) Create trigger function for bidirectional sync on task completion
CREATE OR REPLACE FUNCTION sync_task_completion_to_note()
RETURNS TRIGGER AS $$
BEGIN
  -- When a task is marked as completed, update the linked note
  IF NEW.completed = true AND OLD.completed = false AND NEW.note_id IS NOT NULL THEN
    UPDATE notes 
    SET completed = true, completed_at = NEW.completed_at
    WHERE id = NEW.note_id;
  END IF;
  
  -- When a task is marked as not completed, update the linked note
  IF NEW.completed = false AND OLD.completed = true AND NEW.note_id IS NOT NULL THEN
    UPDATE notes 
    SET completed = false, completed_at = NULL
    WHERE id = NEW.note_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6) Create trigger function for bidirectional sync on note title change
CREATE OR REPLACE FUNCTION sync_note_title_to_task()
RETURNS TRIGGER AS $$
BEGIN
  -- When a note title changes, update the linked task
  IF NEW.title IS DISTINCT FROM OLD.title AND NEW.task_id IS NOT NULL THEN
    UPDATE tasks 
    SET title = NEW.title
    WHERE id = NEW.task_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7) Create trigger function for bidirectional sync on task title change
CREATE OR REPLACE FUNCTION sync_task_title_to_note()
RETURNS TRIGGER AS $$
BEGIN
  -- When a task title changes, update the linked note
  IF NEW.title IS DISTINCT FROM OLD.title AND NEW.note_id IS NOT NULL THEN
    UPDATE notes 
    SET title = NEW.title
    WHERE id = NEW.note_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8) Attach triggers to tasks table
DROP TRIGGER IF EXISTS trigger_sync_task_completion ON tasks;
CREATE TRIGGER trigger_sync_task_completion
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION sync_task_completion_to_note();

DROP TRIGGER IF EXISTS trigger_sync_task_title ON tasks;
CREATE TRIGGER trigger_sync_task_title
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION sync_task_title_to_note();

-- 9) Attach trigger to notes table
DROP TRIGGER IF EXISTS trigger_sync_note_title ON notes;
CREATE TRIGGER trigger_sync_note_title
  AFTER UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION sync_note_title_to_task();

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
