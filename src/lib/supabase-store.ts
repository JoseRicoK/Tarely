/**
 * Store con Supabase para persistencia en la nube
 * 
 * Este archivo proporciona las mismas funciones que store.ts pero usando Supabase.
 * Mantiene la misma API para facilitar la migración.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Workspace,
  Task,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  CreateTaskInput,
  UpdateTaskInput,
  RecurrenceRule,
} from './types';
import type { WorkspaceRow, TaskRow } from './supabase/types';

// ============== HELPERS PARA MAPEAR DATOS ==============

/**
 * Convierte un workspace de la BD (snake_case) al formato de la app (camelCase)
 */
function mapWorkspaceFromDB(row: WorkspaceRow, isShared = false, ownerName?: string): Workspace {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    instructions: row.instructions,
    icon: row.icon || 'Folder',
    color: row.color || '#6366f1',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isShared,
    ownerName,
  };
}

/**
 * Convierte una task de la BD (snake_case) al formato de la app (camelCase)
 */
function mapTaskFromDB(row: TaskRow): Task {
  // Construir recurrence rule si existe
  let recurrence: RecurrenceRule | undefined;
  if (row.recurrence_frequency) {
    recurrence = {
      frequency: row.recurrence_frequency,
      interval: row.recurrence_interval ?? 1,
      daysOfWeek: row.recurrence_days_of_week ?? undefined,
      dayOfMonth: row.recurrence_day_of_month ?? undefined,
      monthOfYear: row.recurrence_month_of_year ?? undefined,
      endsAt: row.recurrence_ends_at ?? undefined,
    };
  }

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    sectionId: row.section_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    importance: row.importance,
    completed: row.completed,
    completedAt: row.completed_at ?? undefined,
    dueDate: row.due_date ?? undefined,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recurrence,
    nextDueAt: row.next_due_at ?? undefined,
  };
}

// ============== WORKSPACES ==============

export async function listWorkspaces(): Promise<Workspace[]> {
  const supabase = await createClient();
  
  // Obtener workspaces propios
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error listando workspaces:', error);
    throw new Error(`Error listando workspaces: ${error.message}`);
  }

  const ownWorkspaces = ((data ?? []) as WorkspaceRow[]).map(row => mapWorkspaceFromDB(row, false));

  // Obtener workspaces compartidos usando función SECURITY DEFINER
  const { data: sharedData, error: sharedError } = await supabase
    .rpc('get_shared_workspaces') as { data: (WorkspaceRow & { user_id: string })[] | null; error: unknown };

  if (sharedError) {
    console.error('Error listando workspaces compartidos:', sharedError);
    // No fallar, solo retornar los propios
    return ownWorkspaces;
  }

  // Obtener nombres de los dueños de workspaces compartidos
  const sharedList = sharedData ?? [];
  const ownerIds = [...new Set(sharedList.map(w => w.user_id))];
  let ownerMap = new Map<string, string>();
  
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', ownerIds);
    
    ownerMap = new Map((profiles ?? []).map(p => [p.id, p.name]));
  }

  const sharedWorkspaces = sharedList.map(row => 
    mapWorkspaceFromDB(row, true, ownerMap.get(row.user_id) || 'Usuario')
  );

  // Combinar: primero propios, luego compartidos
  return [...ownWorkspaces, ...sharedWorkspaces];
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const supabase = await createClient();
  
  // Usar función SECURITY DEFINER para obtener workspace (propio o compartido)
  const { data, error } = await supabase
    .rpc('get_workspace_by_id', { p_workspace_id: id } as never) as { data: (WorkspaceRow & { is_shared: boolean })[] | null; error: { message: string } | null };

  if (error) {
    console.error('Error obteniendo workspace:', error);
    throw new Error(`Error obteniendo workspace: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return null;
  }

  const row = data[0];
  
  // Si es compartido, obtener el nombre del dueño
  let ownerName: string | undefined;
  if (row.is_shared && row.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', row.user_id)
      .single();
    ownerName = profile?.name || 'Usuario';
  }

  return mapWorkspaceFromDB(row as WorkspaceRow, row.is_shared, ownerName);
}

export async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<Workspace> {
  const supabase = await createClient();
  
  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      name: input.name,
      description: input.description,
      instructions: input.instructions,
      icon: input.icon || 'Folder',
      color: input.color || '#6366f1',
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando workspace:', error);
    throw new Error(`Error creando workspace: ${error.message}`);
  }

  return mapWorkspaceFromDB(data as WorkspaceRow);
}

export async function updateWorkspace(
  id: string,
  input: UpdateWorkspaceInput
): Promise<Workspace | null> {
  const supabase = await createClient();
  
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.instructions !== undefined) updateData.instructions = input.instructions;
  if (input.icon !== undefined) updateData.icon = input.icon;
  if (input.color !== undefined) updateData.color = input.color;

  if (Object.keys(updateData).length === 0) {
    // No hay nada que actualizar, retornar el workspace actual
    return getWorkspace(id);
  }

  const { data, error } = await supabase
    .from('workspaces')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error actualizando workspace:', error);
    throw new Error(`Error actualizando workspace: ${error.message}`);
  }

  return data ? mapWorkspaceFromDB(data as WorkspaceRow) : null;
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Las tareas se eliminan automáticamente por ON DELETE CASCADE
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando workspace:', error);
    throw new Error(`Error eliminando workspace: ${error.message}`);
  }

  return true;
}

// ============== TASKS ==============

/**
 * Carga los assignees para un conjunto de tareas
 */
async function loadTaskAssignees(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskIds: string[]
): Promise<Map<string, Task['assignees']>> {
  if (taskIds.length === 0) return new Map();

  // Tipo para las filas de task_assignees
  interface AssigneeRow {
    id: string;
    task_id: string;
    user_id: string;
    created_at: string;
  }

  // Obtener assignees - la tabla tiene created_at, no assigned_at
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: assigneesData, error: assigneesError } = await (supabase as any)
    .from('task_assignees')
    .select('id, task_id, user_id, created_at')
    .in('task_id', taskIds) as { data: AssigneeRow[] | null; error: { message: string } | null };

  if (assigneesError) {
    console.error('Error cargando assignees:', assigneesError);
    return new Map();
  }

  if (!assigneesData || assigneesData.length === 0) {
    return new Map();
  }

  // Obtener perfiles de los usuarios asignados
  const userIds = [...new Set(assigneesData.map(a => a.user_id))];
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, name, avatar')
    .in('id', userIds);

  const profilesMap = new Map(
    (profilesData || []).map(p => [p.id, { name: p.name, avatar: p.avatar }])
  );

  const assigneesMap = new Map<string, Task['assignees']>();

  for (const row of assigneesData) {
    const taskId = row.task_id;
    if (!assigneesMap.has(taskId)) {
      assigneesMap.set(taskId, []);
    }
    
    const profile = profilesMap.get(row.user_id);
    if (profile) {
      assigneesMap.get(taskId)!.push({
        id: row.id,
        userId: row.user_id,
        name: profile.name,
        avatar: profile.avatar,
        assignedAt: row.created_at,
      });
    }
  }

  return assigneesMap;
}

export async function listTasks(workspaceId: string): Promise<Task[]> {
  const supabase = await createClient();
  
  // Primero intentar con query directa (workspaces propios)
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  let tasks: Task[] = [];

  // Si hay tareas, mapearlas
  if (data && data.length > 0) {
    tasks = ((data ?? []) as TaskRow[]).map(mapTaskFromDB);
  } else if (error && error.code !== 'PGRST116') {
    // Si es un error de RLS, intentar con la función
    const { data: sharedTasks, error: sharedError } = await supabase
      .rpc('get_workspace_tasks', { p_workspace_id: workspaceId } as never) as { data: TaskRow[] | null; error: { message: string } | null };
    
    if (sharedError) {
      console.error('Error listando tareas:', sharedError);
      throw new Error(`Error listando tareas: ${sharedError.message}`);
    }
    
    tasks = ((sharedTasks ?? []) as TaskRow[]).map(mapTaskFromDB);
  } else {
    // Si no hay error pero tampoco datos, intentar con función por si es compartido
    const { data: sharedTasks, error: sharedError } = await supabase
      .rpc('get_workspace_tasks', { p_workspace_id: workspaceId } as never) as { data: TaskRow[] | null; error: { message: string } | null };
    
    if (sharedError) {
      console.error('Error listando tareas compartidas:', sharedError);
      return [];
    }
    
    tasks = ((sharedTasks ?? []) as TaskRow[]).map(mapTaskFromDB);
  }

  // Cargar assignees para todas las tareas
  if (tasks.length > 0) {
    const taskIds = tasks.map(t => t.id);
    const assigneesMap = await loadTaskAssignees(supabase, taskIds);
    
    tasks = tasks.map(task => ({
      ...task,
      assignees: assigneesMap.get(task.id) || [],
    }));
  }

  return tasks;
}

export async function getTask(id: string): Promise<Task | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error obteniendo tarea:', error);
    throw new Error(`Error obteniendo tarea: ${error.message}`);
  }

  return data ? mapTaskFromDB(data as TaskRow) : null;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const supabase = await createClient();
  
  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id: input.workspaceId,
      title: input.title,
      description: input.description || null,
      importance: input.importance,
      due_date: input.dueDate || null,
      source: input.source,
      completed: false,
      user_id: user.id,
      recurrence_frequency: input.recurrence?.frequency ?? null,
      recurrence_interval: input.recurrence?.interval ?? null,
      recurrence_days_of_week: input.recurrence?.daysOfWeek ?? null,
      recurrence_day_of_month: input.recurrence?.dayOfMonth ?? null,
      recurrence_month_of_year: input.recurrence?.monthOfYear ?? null,
      recurrence_ends_at: input.recurrence?.endsAt ?? null,
      next_due_at: input.nextDueAt ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando tarea:', error);
    throw new Error(`Error creando tarea: ${error.message}`);
  }

  return mapTaskFromDB(data as TaskRow);
}

export async function createManyTasks(inputs: CreateTaskInput[]): Promise<Task[]> {
  if (inputs.length === 0) return [];

  const supabase = await createClient();
  
  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  
  const insertData = inputs.map(input => ({
    workspace_id: input.workspaceId,
    title: input.title,
    description: input.description || null,
    importance: input.importance,
    due_date: input.dueDate || null,
    source: input.source,
    completed: false,
    user_id: user.id,
    recurrence_frequency: input.recurrence?.frequency ?? null,
    recurrence_interval: input.recurrence?.interval ?? null,
    recurrence_days_of_week: input.recurrence?.daysOfWeek ?? null,
    recurrence_day_of_month: input.recurrence?.dayOfMonth ?? null,
    recurrence_month_of_year: input.recurrence?.monthOfYear ?? null,
    recurrence_ends_at: input.recurrence?.endsAt ?? null,
    next_due_at: input.nextDueAt ?? null,
  }));

  const { data, error } = await supabase
    .from('tasks')
    .insert(insertData)
    .select();

  if (error) {
    console.error('Error creando tareas:', error);
    throw new Error(`Error creando tareas: ${error.message}`);
  }

  return ((data ?? []) as TaskRow[]).map(mapTaskFromDB);
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<Task | null> {
  const supabase = await createClient();
  
  // Primero obtenemos la tarea actual para manejar la lógica de completado
  const currentTask = await getTask(id);
  if (!currentTask) return null;

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {};

  // Campos básicos
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.importance !== undefined) updateData.importance = input.importance;
  if (input.sectionId !== undefined) updateData.section_id = input.sectionId;
  if (input.dueDate !== undefined) updateData.due_date = input.dueDate;

  // Campos de recurrencia
  if (input.recurrence !== undefined) {
    if (input.recurrence === null) {
      // Eliminar recurrencia
      updateData.recurrence_frequency = null;
      updateData.recurrence_interval = null;
      updateData.recurrence_days_of_week = null;
      updateData.recurrence_day_of_month = null;
      updateData.recurrence_month_of_year = null;
      updateData.recurrence_ends_at = null;
      updateData.next_due_at = null;
    } else {
      updateData.recurrence_frequency = input.recurrence.frequency;
      updateData.recurrence_interval = input.recurrence.interval;
      updateData.recurrence_days_of_week = input.recurrence.daysOfWeek ?? null;
      updateData.recurrence_day_of_month = input.recurrence.dayOfMonth ?? null;
      updateData.recurrence_month_of_year = input.recurrence.monthOfYear ?? null;
      updateData.recurrence_ends_at = input.recurrence.endsAt ?? null;
    }
  }

  // next_due_at
  if (input.nextDueAt !== undefined) {
    updateData.next_due_at = input.nextDueAt;
  }

  // Lógica de completed
  if (input.completed !== undefined) {
    updateData.completed = input.completed;
    if (input.completed && !currentTask.completed) {
      updateData.completed_at = now;
    } else if (!input.completed) {
      updateData.completed_at = null;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return currentTask;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando tarea:', error);
    throw new Error(`Error actualizando tarea: ${error.message}`);
  }

  return data ? mapTaskFromDB(data as TaskRow) : null;
}

export async function deleteTask(id: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando tarea:', error);
    throw new Error(`Error eliminando tarea: ${error.message}`);
  }

  return true;
}
