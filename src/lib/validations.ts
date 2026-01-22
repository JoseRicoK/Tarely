// Schemas de validación con Zod
import { z } from "zod";

// Workspaces
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  description: z.string().max(500).default(""),
  instructions: z.string().max(10000).default(""),
  icon: z.string().max(50).default("Folder"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").default("#6366f1"),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  instructions: z.string().max(10000).optional().nullable().transform(val => val ?? ""),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Tasks
export const createTaskSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1, "El título es obligatorio").max(1000),
  description: z.string().max(5000).optional(),
  importance: z.number().int().min(1).max(10),
  dueDate: z.string().datetime().optional().nullable(),
  source: z.enum(["ai", "manual"]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(1000).optional(),
  description: z.string().max(5000).optional(),
  importance: z.number().int().min(1).max(10).optional(),
  completed: z.boolean().optional(),
  sectionId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

// AI Generate Tasks
export const generateTasksSchema = z.object({
  workspaceId: z.string().uuid(),
  text: z.string().min(10, "El texto debe tener al menos 10 caracteres").max(10000),
});

// Types inferidos
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type GenerateTasksInput = z.infer<typeof generateTasksSchema>;
