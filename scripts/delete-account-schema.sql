-- =============================================
-- FUNCIÓN PARA ELIMINAR CUENTA DE USUARIO
-- =============================================
-- Ejecutar en Supabase Dashboard > SQL Editor
-- Esta función elimina todos los datos asociados a un usuario
-- Se usa como respaldo; la API route hace la eliminación principal
-- =============================================

-- Función para eliminar todos los datos de un usuario
CREATE OR REPLACE FUNCTION delete_user_data(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Eliminar feedback
  DELETE FROM feedback WHERE user_id = target_user_id;
  
  -- Eliminar comentarios en tareas
  DELETE FROM task_comments WHERE user_id = target_user_id;
  
  -- Eliminar actividad en tareas
  DELETE FROM task_activity WHERE user_id = target_user_id;
  
  -- Eliminar adjuntos del usuario
  DELETE FROM task_attachments WHERE user_id = target_user_id;
  
  -- Eliminar asignaciones
  DELETE FROM task_assignees WHERE user_id = target_user_id;
  
  -- Eliminar membresías de workspaces
  DELETE FROM workspace_members WHERE user_id = target_user_id;
  
  -- Eliminar workspaces del usuario (CASCADE eliminará tasks, subtasks, sections)
  DELETE FROM workspaces WHERE user_id = target_user_id;
  
  -- Eliminar perfil
  DELETE FROM profiles WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solo admins pueden ejecutar esta función
REVOKE ALL ON FUNCTION delete_user_data FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_data TO service_role;
