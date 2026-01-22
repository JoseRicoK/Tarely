/**
 * Store unificado para TareAI
 * 
 * Este archivo actúa como facade que decide qué backend usar:
 * - Supabase (por defecto, datos en la nube)
 * - JSON local (fallback o desarrollo offline)
 * 
 * Para cambiar entre backends, modifica la variable USE_SUPABASE
 */

// ============== CONFIGURACIÓN ==============
// Cambiar a false para usar el store JSON local
const USE_SUPABASE = true;

// ============== RE-EXPORTAR TIPOS ==============
export type {
  TareAIData,
  Workspace,
  Task,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  CreateTaskInput,
  UpdateTaskInput,
} from "./types";

// ============== IMPORTAR STORES ==============
import * as supabaseStore from "./supabase-store";
import * as jsonStore from "./json-store";

// Seleccionar el store activo
const store = USE_SUPABASE ? supabaseStore : jsonStore;

// ============== WORKSPACES ==============
export const listWorkspaces = store.listWorkspaces;
export const getWorkspace = store.getWorkspace;
export const createWorkspace = store.createWorkspace;
export const updateWorkspace = store.updateWorkspace;
export const deleteWorkspace = store.deleteWorkspace;

// ============== TASKS ==============
export const listTasks = store.listTasks;
export const getTask = store.getTask;
export const createTask = store.createTask;
export const createManyTasks = store.createManyTasks;
export const updateTask = store.updateTask;
export const deleteTask = store.deleteTask;

// ============== FUNCIONES DEL JSON STORE (para scripts) ==============
// Estas funciones solo están disponibles cuando se usa el JSON store
export const readData = jsonStore.readData;
export const writeDataAtomic = jsonStore.writeDataAtomic;
