// Tipos principales del proyecto Tarely

export interface Workspace {
  id: string;
  name: string;
  description: string;
  instructions: string; // Instrucciones largas para la IA
  icon: string; // Nombre del icono de Lucide (ej: Folder, Briefcase)
  color: string; // Color en formato hex (ej: #6366f1)
  createdAt: string;
  updatedAt: string;
  isShared?: boolean; // true si es un workspace compartido contigo
  ownerName?: string; // Nombre del dueño si es compartido
}

export interface WorkspaceSection {
  id: string;
  workspaceId: string;
  name: string;
  icon: string; // Nombre del icono de Lucide
  color: string; // Color en formato hex
  order: number;
  isSystem: boolean; // true para las 3 secciones por defecto
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignee {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  assignedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  sectionId?: string; // Sección a la que pertenece
  title: string;
  description?: string;
  importance: number; // 1-10
  completed: boolean;
  completedAt?: string;
  dueDate?: string; // Fecha límite opcional (ISO string)
  createdAt: string;
  updatedAt: string;
  source: "ai" | "manual";
  assignees?: TaskAssignee[]; // Usuarios asignados
  subtasks?: Subtask[]; // Subtareas
}

export interface TareAIData {
  workspaces: Workspace[];
  tasks: Task[];
}

// Tipos para formularios
export interface CreateWorkspaceInput {
  name: string;
  description: string;
  instructions: string;
  icon?: string;
  color?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  instructions?: string;
  icon?: string;
  color?: string;
}

export interface CreateTaskInput {
  workspaceId: string;
  sectionId?: string | null;
  title: string;
  description?: string;
  importance: number;
  dueDate?: string | null; // Fecha límite opcional
  source: "ai" | "manual";
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  importance?: number;
  completed?: boolean;
  sectionId?: string | null;
  dueDate?: string | null; // null para eliminar la fecha
}

export interface CreateSectionInput {
  workspaceId: string;
  name: string;
  icon: string;
  color: string;
}

export interface UpdateSectionInput {
  name?: string;
  icon?: string;
  color?: string;
  order?: number;
}

// Tipos para la API de IA
export interface GenerateTasksInput {
  workspaceId: string;
  text: string;
}

export interface AIGeneratedTask {
  title: string;
  description?: string;
  importance: number;
  dueDate?: string; // ISO 8601 date string opcional
}

export interface AIGenerateResponse {
  tasks: AIGeneratedTask[];
}
