/**
 * Store JSON local para TareAI (backup/desarrollo offline)
 * 
 * Este archivo contiene el store original basado en archivo JSON.
 * Se mantiene como fallback y para los scripts de migración.
 */

import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type {
  TareAIData,
  Workspace,
  Task,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  CreateTaskInput,
  UpdateTaskInput,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "tareai.json");
const TEMP_FILE = path.join(DATA_DIR, "tareai.json.tmp");

// Mutex simple en memoria para evitar race conditions
let writeLock: Promise<void> = Promise.resolve();

async function acquireLock(): Promise<() => void> {
  let release: () => void;
  const currentLock = writeLock;
  writeLock = new Promise((resolve) => {
    release = resolve;
  });
  await currentLock;
  return release!;
}

// Datos iniciales
const initialData: TareAIData = {
  workspaces: [],
  tasks: [],
};

// Asegurar que el directorio existe
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Leer datos del archivo
export async function readData(): Promise<TareAIData> {
  await ensureDataDir();
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(content) as TareAIData;
  } catch {
    // Si no existe, retornar datos iniciales
    return { ...initialData };
  }
}

// Escritura atómica: escribe a .tmp y luego renombra
export async function writeDataAtomic(data: TareAIData): Promise<void> {
  const release = await acquireLock();
  try {
    await ensureDataDir();
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(TEMP_FILE, content, "utf-8");
    await fs.rename(TEMP_FILE, DATA_FILE);
  } finally {
    release();
  }
}

// ============== WORKSPACES ==============

export async function listWorkspaces(): Promise<Workspace[]> {
  const data = await readData();
  return data.workspaces.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const data = await readData();
  return data.workspaces.find((w) => w.id === id) || null;
}

export async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<Workspace> {
  const data = await readData();
  const now = new Date().toISOString();
  const maxSortOrder = data.workspaces.length > 0 
    ? Math.max(...data.workspaces.map(w => w.sortOrder))
    : -1;
  const workspace: Workspace = {
    id: uuidv4(),
    name: input.name,
    description: input.description,
    instructions: input.instructions,
    icon: input.icon || "Folder",
    color: input.color || "#6366f1",
    sortOrder: maxSortOrder + 1,
    createdAt: now,
    updatedAt: now,
  };
  data.workspaces.push(workspace);
  await writeDataAtomic(data);
  return workspace;
}

export async function updateWorkspace(
  id: string,
  input: UpdateWorkspaceInput
): Promise<Workspace | null> {
  const data = await readData();
  const index = data.workspaces.findIndex((w) => w.id === id);
  if (index === -1) return null;

  const workspace = data.workspaces[index];
  const updated: Workspace = {
    ...workspace,
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.instructions !== undefined && { instructions: input.instructions }),
    ...(input.icon !== undefined && { icon: input.icon }),
    ...(input.color !== undefined && { color: input.color }),
    updatedAt: new Date().toISOString(),
  };
  data.workspaces[index] = updated;
  await writeDataAtomic(data);
  return updated;
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  const data = await readData();
  const index = data.workspaces.findIndex((w) => w.id === id);
  if (index === -1) return false;

  data.workspaces.splice(index, 1);
  // También eliminar todas las tareas del workspace
  data.tasks = data.tasks.filter((t) => t.workspaceId !== id);
  await writeDataAtomic(data);
  return true;
}

// ============== TASKS ==============

export async function listTasks(workspaceId: string): Promise<Task[]> {
  const data = await readData();
  return data.tasks.filter((t) => t.workspaceId === workspaceId);
}

export async function listTasksLite(workspaceId: string): Promise<Task[]> {
  return listTasks(workspaceId);
}

export async function listTasksWithTags(workspaceId: string): Promise<Task[]> {
  return listTasks(workspaceId);
}

export async function getTask(id: string): Promise<Task | null> {
  const data = await readData();
  return data.tasks.find((t) => t.id === id) || null;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const data = await readData();
  const now = new Date().toISOString();
  const task: Task = {
    id: uuidv4(),
    workspaceId: input.workspaceId,
    title: input.title,
    description: input.description,
    importance: input.importance,
    completed: false,
    createdAt: now,
    updatedAt: now,
    source: input.source,
  };
  data.tasks.push(task);
  await writeDataAtomic(data);
  return task;
}

export async function createManyTasks(inputs: CreateTaskInput[]): Promise<Task[]> {
  const data = await readData();
  const now = new Date().toISOString();
  const tasks: Task[] = inputs.map((input) => ({
    id: uuidv4(),
    workspaceId: input.workspaceId,
    title: input.title,
    description: input.description,
    importance: input.importance,
    completed: false,
    createdAt: now,
    updatedAt: now,
    source: input.source,
  }));
  data.tasks.push(...tasks);
  await writeDataAtomic(data);
  return tasks;
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<Task | null> {
  const data = await readData();
  const index = data.tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const task = data.tasks[index];
  const now = new Date().toISOString();
  
  // Si se está completando la tarea, añadir completedAt
  const completedAt = input.completed === true && !task.completed 
    ? now 
    : input.completed === false 
      ? undefined 
      : task.completedAt;

  const updated: Task = {
    ...task,
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.importance !== undefined && { importance: input.importance }),
    ...(input.completed !== undefined && { completed: input.completed, completedAt }),
    updatedAt: now,
  };
  data.tasks[index] = updated;
  await writeDataAtomic(data);
  return updated;
}

export async function deleteTask(id: string): Promise<boolean> {
  const data = await readData();
  const index = data.tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;

  data.tasks.splice(index, 1);
  await writeDataAtomic(data);
  return true;
}
