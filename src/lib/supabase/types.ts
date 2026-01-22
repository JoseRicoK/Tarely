/**
 * Tipos TypeScript para la base de datos de Supabase
 * 
 * Estos tipos mapean exactamente la estructura de las tablas en PostgreSQL.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskSource = 'ai' | 'manual';

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          description: string;
          instructions: string;
          icon: string;
          color: string;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          instructions?: string;
          icon?: string;
          color?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          instructions?: string;
          icon?: string;
          color?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          avatar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          workspace_id: string;
          section_id: string | null;
          user_id: string | null;
          title: string;
          description: string | null;
          importance: number;
          completed: boolean;
          completed_at: string | null;
          due_date: string | null;
          source: TaskSource;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          section_id?: string | null;
          user_id?: string;
          title: string;
          description?: string | null;
          importance?: number;
          completed?: boolean;
          completed_at?: string | null;
          due_date?: string | null;
          source?: TaskSource;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          section_id?: string | null;
          user_id?: string;
          title?: string;
          description?: string | null;
          importance?: number;
          completed?: boolean;
          completed_at?: string | null;
          due_date?: string | null;
          source?: TaskSource;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          }
        ];
      };
      subtasks: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          completed: boolean;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          completed?: boolean;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          title?: string;
          completed?: boolean;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subtasks_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      task_source: TaskSource;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Tipos helper para facilitar el uso
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Alias para uso más fácil
export type WorkspaceRow = Tables<'workspaces'>;
export type TaskRow = Tables<'tasks'>;
export type SubtaskRow = Tables<'subtasks'>;
export type WorkspaceInsert = InsertTables<'workspaces'>;
export type TaskInsert = InsertTables<'tasks'>;
export type SubtaskInsert = InsertTables<'subtasks'>;
export type WorkspaceUpdate = UpdateTables<'workspaces'>;
export type TaskUpdate = UpdateTables<'tasks'>;
export type SubtaskUpdate = UpdateTables<'subtasks'>;
