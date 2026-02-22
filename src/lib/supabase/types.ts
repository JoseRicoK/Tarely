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
export type RecurrenceFrequencyDB = 'daily' | 'weekly' | 'monthly' | 'yearly';

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
          sort_order: number;
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
          sort_order?: number;
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
          sort_order?: number;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: string;
          status: string;
          invited_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: string;
          status?: string;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: string;
          status?: string;
          invited_by?: string | null;
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
          email_confirmed: boolean;
          confirmation_token: string | null;
          confirmation_token_expires: string | null;
          theme_mode: string;
          accent_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          avatar: string;
          email_confirmed?: boolean;
          confirmation_token?: string | null;
          confirmation_token_expires?: string | null;
          theme_mode?: string;
          accent_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar?: string;
          email_confirmed?: boolean;
          confirmation_token?: string | null;
          confirmation_token_expires?: string | null;
          theme_mode?: string;
          accent_color?: string;
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
          note_id: string | null;
          user_id: string | null;
          title: string;
          description: string | null;
          importance: number;
          completed: boolean;
          completed_at: string | null;
          due_date: string | null;
          source: TaskSource;
          recurrence_frequency: RecurrenceFrequencyDB | null;
          recurrence_interval: number | null;
          recurrence_days_of_week: number[] | null;
          recurrence_day_of_month: number | null;
          recurrence_month_of_year: number | null;
          recurrence_ends_at: string | null;
          next_due_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          section_id?: string | null;
          note_id?: string | null;
          user_id?: string;
          title: string;
          description?: string | null;
          importance?: number;
          completed?: boolean;
          completed_at?: string | null;
          due_date?: string | null;
          source?: TaskSource;
          recurrence_frequency?: RecurrenceFrequencyDB | null;
          recurrence_interval?: number | null;
          recurrence_days_of_week?: number[] | null;
          recurrence_day_of_month?: number | null;
          recurrence_month_of_year?: number | null;
          recurrence_ends_at?: string | null;
          next_due_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          section_id?: string | null;
          note_id?: string | null;
          user_id?: string;
          title?: string;
          description?: string | null;
          importance?: number;
          completed?: boolean;
          completed_at?: string | null;
          due_date?: string | null;
          source?: TaskSource;
          recurrence_frequency?: RecurrenceFrequencyDB | null;
          recurrence_interval?: number | null;
          recurrence_days_of_week?: number[] | null;
          recurrence_day_of_month?: number | null;
          recurrence_month_of_year?: number | null;
          recurrence_ends_at?: string | null;
          next_due_at?: string | null;
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
    Functions: {
      get_workspaces_by_ids: {
        Args: { p_workspace_ids: string[] };
        Returns: { id: string; name: string; color: string }[];
      };
      get_workspace_members: {
        Args: { p_workspace_id: string };
        Returns: { id: string; user_id: string; role: string; status: string; created_at: string; invited_by: string }[];
      };
      get_workspace_members_for_assignment: {
        Args: { p_workspace_id: string };
        Returns: { id: string; name: string; email: string; avatar: string }[];
      };
      invite_user_to_workspace: {
        Args: { p_workspace_id: string; p_user_id: string };
        Returns: string;
      };
      remove_workspace_member_by_id: {
        Args: { p_workspace_id: string; p_member_id: string };
        Returns: boolean;
      };
      get_task_assignees: {
        Args: { p_task_id: string };
        Returns: { id: string; name: string; email: string; avatar: string }[];
      };
      assign_user_to_task: {
        Args: { p_task_id: string; p_user_id: string };
        Returns: string;
      };
      unassign_user_from_task: {
        Args: { p_task_id: string; p_user_id: string };
        Returns: boolean;
      };
      get_shared_workspaces: {
        Args: Record<string, never>;
        Returns: { id: string; name: string; description: string; instructions: string; icon: string; color: string; user_id: string; created_at: string; updated_at: string }[];
      };
      get_workspace_by_id: {
        Args: { p_workspace_id: string };
        Returns: { id: string; name: string; description: string; instructions: string; icon: string; color: string; user_id: string; created_at: string; updated_at: string; is_shared: boolean }[];
      };
      get_workspace_tasks: {
        Args: { p_workspace_id: string };
        Returns: { id: string; workspace_id: string; section_id: string | null; user_id: string | null; title: string; description: string | null; importance: number; completed: boolean; completed_at: string | null; due_date: string | null; source: string; created_at: string; updated_at: string }[];
      };
    };
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
export type ProfileRow = Tables<'profiles'>;
export type WorkspaceInsert = InsertTables<'workspaces'>;
export type TaskInsert = InsertTables<'tasks'>;
export type SubtaskInsert = InsertTables<'subtasks'>;
export type WorkspaceUpdate = UpdateTables<'workspaces'>;
export type TaskUpdate = UpdateTables<'tasks'>;
export type SubtaskUpdate = UpdateTables<'subtasks'>;
