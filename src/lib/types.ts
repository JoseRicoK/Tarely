// Tipos principales del proyecto Tarely

// Tipos de recurrencia
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // cada cuántas unidades (ej: cada 2 semanas)
  daysOfWeek?: number[]; // 0=Dom, 1=Lun, ..., 6=Sáb (para weekly)
  dayOfMonth?: number; // 1-31 (para monthly y yearly)
  monthOfYear?: number; // 1-12 (para yearly)
  endsAt?: string | null; // ISO date, nullable = sin fin
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  instructions: string; // Instrucciones largas para la IA
  icon: string; // Nombre del icono de Lucide (ej: Folder, Briefcase)
  color: string; // Color en formato hex (ej: #6366f1)
  sortOrder: number; // Orden de visualización (0-based)
  createdAt: string;
  updatedAt: string;
  isShared?: boolean; // true si es un workspace compartido contigo
  ownerName?: string; // Nombre del dueño si es compartido
  pendingTasksCount?: number; // Número de tareas pendientes (no completadas)
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

export interface WorkspaceTag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTag {
  id: string;
  tagId: string;
  name: string;
  color: string;
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
  noteId?: string | null; // Vinculación bidireccional con Note
  title: string;
  description?: string;
  importance: number; // 1-10
  completed: boolean;
  completedAt?: string;
  dueDate?: string; // Fecha límite opcional (ISO string)
  createdAt: string;
  updatedAt: string;
  source: "ai" | "manual";
  isNew?: boolean; // Marca visual para tareas recién creadas por IA
  assignees?: TaskAssignee[]; // Usuarios asignados
  subtasks?: Subtask[]; // Subtareas
  recurrence?: RecurrenceRule; // Regla de recurrencia (null = tarea normal)
  nextDueAt?: string; // Cuándo aparece como pendiente (solo recurrentes)
  tags?: TaskTag[]; // Etiquetas asignadas
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
  noteId?: string | null; // Para vincular con una nota
  title: string;
  description?: string;
  importance: number;
  dueDate?: string | null; // Fecha límite opcional
  source: "ai" | "manual";
  recurrence?: RecurrenceRule | null;
  nextDueAt?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  importance?: number;
  completed?: boolean;
  sectionId?: string | null;
  noteId?: string | null; // Para vincular/desvincular nota
  dueDate?: string | null; // null para eliminar la fecha
  recurrence?: RecurrenceRule | null; // null para eliminar la recurrencia
  nextDueAt?: string | null;
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

export interface CreateTagInput {
  workspaceId: string;
  name: string;
  color: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
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
  recurrence?: RecurrenceRule; // Regla de recurrencia detectada por la IA
  tagIds?: string[]; // IDs de etiquetas a aplicar (opcionales)
}

export interface AIGenerateResponse {
  tasks: AIGeneratedTask[];
}

// Tipos para comentarios de tareas
export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userAvatar: string;
}

// Tipos para archivos adjuntos
export type AttachmentType = 'image' | 'document' | 'other';

export interface TaskAttachment {
  id: string;
  taskId: string;
  userId: string;
  fileName: string;
  fileType: AttachmentType;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  thumbnailPath?: string;
  createdAt: string;
  userName: string;
  userAvatar: string;
  url?: string; // URL firmada para acceder al archivo
}

// Tipos para actividad de tareas
export type TaskActivityAction = 
  | 'created'
  | 'updated'
  | 'completed'
  | 'uncompleted'
  | 'assigned'
  | 'unassigned'
  | 'comment_added'
  | 'comment_deleted'
  | 'attachment_added'
  | 'attachment_deleted'
  | 'subtask_added'
  | 'subtask_completed'
  | 'subtask_deleted';

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  action: TaskActivityAction;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  userName: string;
  userAvatar: string;
}

// Input para crear comentario
export interface CreateCommentInput {
  taskId: string;
  content: string;
}

// Input para subir archivo
export interface UploadAttachmentInput {
  taskId: string;
  file: File;
}

// ============== NOTES ==============

export interface NoteFolder {
  id: string;
  workspaceId: string;
  parentFolderId: string | null;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  children?: NoteFolder[];
  noteCount?: number;
}

export interface Note {
  id: string;
  workspaceId: string;
  folderId: string | null;
  title: string;
  contentJson: Record<string, unknown>;
  contentText: string;
  isPinned: boolean;
  isFavorite: boolean;
  taskId: string | null;
  completed: boolean; // Si la tarea vinculada está completada
  completedAt: string | null; // Cuándo se completó la tarea vinculada
  coverImage: string | null;
  icon: string;
  sortOrder: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  folderPath?: string;
  workspaceName?: string;
  workspaceColor?: string;
  workspaceIcon?: string;
  tags?: TaskTag[];
}

export interface NoteTemplate {
  id: string;
  userId: string | null;
  name: string;
  description: string;
  contentJson: Record<string, unknown>;
  icon: string;
  isGlobal: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteFolderInput {
  workspaceId: string;
  parentFolderId?: string | null;
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateNoteFolderInput {
  name?: string;
  icon?: string;
  color?: string;
  parentFolderId?: string | null;
  sortOrder?: number;
}

export interface CreateNoteInput {
  workspaceId: string;
  folderId?: string | null;
  title?: string;
  contentJson?: Record<string, unknown>;
  contentText?: string;
  icon?: string;
  templateId?: string;
}

export interface UpdateNoteInput {
  title?: string;
  folderId?: string | null;
  contentJson?: Record<string, unknown>;
  contentText?: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  taskId?: string | null;
  completed?: boolean; // Para marcar como completada desde la nota
  completedAt?: string | null;
  coverImage?: string | null;
  icon?: string;
  sortOrder?: number;
  wordCount?: number;
}

export interface CreateNoteTemplateInput {
  name: string;
  description?: string;
  contentJson: Record<string, unknown>;
  icon?: string;
  category?: string;
}

export interface UpdateNoteTemplateInput {
  name?: string;
  description?: string;
  contentJson?: Record<string, unknown>;
  icon?: string;
  category?: string;
}
