/**
 * Notes Store - Supabase operations for the Notes system
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Note,
  NoteFolder,
  NoteTemplate,
  CreateNoteInput,
  UpdateNoteInput,
  CreateNoteFolderInput,
  UpdateNoteFolderInput,
  CreateNoteTemplateInput,
  UpdateNoteTemplateInput,
} from './types';

// ============== HELPERS ==============

interface NoteFolderRow {
  id: string;
  workspace_id: string;
  user_id: string;
  parent_folder_id: string | null;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface NoteRow {
  id: string;
  workspace_id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  content_json: Record<string, unknown>;
  content_text: string;
  is_pinned: boolean;
  is_favorite: boolean;
  task_id: string | null;
  cover_image: string | null;
  icon: string;
  sort_order: number;
  word_count: number;
  created_at: string;
  updated_at: string;
}

interface NoteTemplateRow {
  id: string;
  user_id: string | null;
  name: string;
  description: string;
  content_json: Record<string, unknown>;
  icon: string;
  is_global: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

function mapFolderFromDB(row: NoteFolderRow): NoteFolder {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    parentFolderId: row.parent_folder_id,
    name: row.name,
    icon: row.icon || 'Folder',
    color: row.color || '#6366f1',
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNoteFromDB(row: NoteRow): Note {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    folderId: row.folder_id,
    title: row.title,
    contentJson: row.content_json ?? {},
    contentText: row.content_text ?? '',
    isPinned: row.is_pinned,
    isFavorite: row.is_favorite,
    taskId: row.task_id,
    coverImage: row.cover_image,
    icon: row.icon || '📝',
    sortOrder: row.sort_order,
    wordCount: row.word_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTemplateFromDB(row: NoteTemplateRow): NoteTemplate {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || '',
    contentJson: row.content_json ?? {},
    icon: row.icon || '📋',
    isGlobal: row.is_global,
    category: row.category || 'general',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============== FOLDERS ==============

export async function listFolders(workspaceId: string): Promise<NoteFolder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('note_folders')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error listing folders:', error);
    throw new Error(`Error listing folders: ${error.message}`);
  }

  return ((data ?? []) as unknown as NoteFolderRow[]).map(mapFolderFromDB);
}

export async function getFolder(id: string): Promise<NoteFolder | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('note_folders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error getting folder: ${error.message}`);
  }

  return mapFolderFromDB(data as unknown as NoteFolderRow);
}

export async function createFolder(input: CreateNoteFolderInput): Promise<NoteFolder> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const { data, error } = await supabase
    .from('note_folders')
    .insert({
      workspace_id: input.workspaceId,
      user_id: user.id,
      parent_folder_id: input.parentFolderId || null,
      name: input.name.trim(),
      icon: input.icon || 'Folder',
      color: input.color || '#6366f1',
    } as never)
    .select()
    .single();

  if (error) throw new Error(`Error creating folder: ${error.message}`);
  return mapFolderFromDB(data as unknown as NoteFolderRow);
}

export async function updateFolder(id: string, input: UpdateNoteFolderInput): Promise<NoteFolder | null> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.icon !== undefined) updates.icon = input.icon;
  if (input.color !== undefined) updates.color = input.color;
  if (input.parentFolderId !== undefined) updates.parent_folder_id = input.parentFolderId;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from('note_folders')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error updating folder: ${error.message}`);
  }

  return mapFolderFromDB(data as unknown as NoteFolderRow);
}

export async function deleteFolder(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('note_folders')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error deleting folder: ${error.message}`);
  return true;
}

// ============== NOTES ==============

export async function listNotes(workspaceId: string, folderId?: string | null): Promise<Note[]> {
  const supabase = await createClient();
  let query = supabase
    .from('notes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (folderId === null) {
    query = query.is('folder_id', null);
  } else if (folderId) {
    query = query.eq('folder_id', folderId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Error listing notes: ${error.message}`);
  return ((data ?? []) as unknown as NoteRow[]).map(mapNoteFromDB);
}

export async function listAllNotes(workspaceId: string): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Error listing all notes: ${error.message}`);
  return ((data ?? []) as unknown as NoteRow[]).map(mapNoteFromDB);
}

export async function searchNotes(workspaceId: string, query: string): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .or(`title.ilike.%${query}%,content_text.ilike.%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(`Error searching notes: ${error.message}`);
  return ((data ?? []) as unknown as NoteRow[]).map(mapNoteFromDB);
}

export async function getNote(id: string): Promise<Note | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error getting note: ${error.message}`);
  }

  return mapNoteFromDB(data as unknown as NoteRow);
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  // If templateId provided, get template content
  let contentJson = input.contentJson || {};
  let contentText = input.contentText || '';

  if (input.templateId) {
    const template = await getTemplate(input.templateId);
    if (template) {
      contentJson = template.contentJson;
    }
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      workspace_id: input.workspaceId,
      user_id: user.id,
      folder_id: input.folderId || null,
      title: input.title || 'Sin título',
      content_json: contentJson,
      content_text: contentText,
      icon: input.icon || '📝',
    } as never)
    .select()
    .single();

  if (error) throw new Error(`Error creating note: ${error.message}`);
  return mapNoteFromDB(data as unknown as NoteRow);
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note | null> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = {};

  if (input.title !== undefined) updates.title = input.title;
  if (input.folderId !== undefined) updates.folder_id = input.folderId;
  if (input.contentJson !== undefined) updates.content_json = input.contentJson;
  if (input.contentText !== undefined) updates.content_text = input.contentText;
  if (input.isPinned !== undefined) updates.is_pinned = input.isPinned;
  if (input.isFavorite !== undefined) updates.is_favorite = input.isFavorite;
  if (input.taskId !== undefined) updates.task_id = input.taskId;
  if (input.coverImage !== undefined) updates.cover_image = input.coverImage;
  if (input.icon !== undefined) updates.icon = input.icon;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;
  if (input.wordCount !== undefined) updates.word_count = input.wordCount;

  const { data, error } = await supabase
    .from('notes')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error updating note: ${error.message}`);
  }

  return mapNoteFromDB(data as unknown as NoteRow);
}

export async function deleteNote(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error deleting note: ${error.message}`);
  return true;
}

// ============== TEMPLATES ==============

export async function listTemplates(): Promise<NoteTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('note_templates')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(`Error listing templates: ${error.message}`);
  return ((data ?? []) as unknown as NoteTemplateRow[]).map(mapTemplateFromDB);
}

export async function getTemplate(id: string): Promise<NoteTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('note_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error getting template: ${error.message}`);
  }

  return mapTemplateFromDB(data as unknown as NoteTemplateRow);
}

export async function createTemplate(input: CreateNoteTemplateInput): Promise<NoteTemplate> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const { data, error } = await supabase
    .from('note_templates')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      description: input.description || '',
      content_json: input.contentJson,
      icon: input.icon || '📋',
      category: input.category || 'general',
      is_global: false,
    } as never)
    .select()
    .single();

  if (error) throw new Error(`Error creating template: ${error.message}`);
  return mapTemplateFromDB(data as unknown as NoteTemplateRow);
}

export async function updateTemplate(id: string, input: UpdateNoteTemplateInput): Promise<NoteTemplate | null> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.description !== undefined) updates.description = input.description;
  if (input.contentJson !== undefined) updates.content_json = input.contentJson;
  if (input.icon !== undefined) updates.icon = input.icon;
  if (input.category !== undefined) updates.category = input.category;

  const { data, error } = await supabase
    .from('note_templates')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error updating template: ${error.message}`);
  }

  return mapTemplateFromDB(data as unknown as NoteTemplateRow);
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('note_templates')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error deleting template: ${error.message}`);
  return true;
}
