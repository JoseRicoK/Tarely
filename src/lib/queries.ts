/**
 * Hooks de TanStack Query centralizados.
 * Cada hook cachea sus datos en memoria; al mutar se invalida la query correspondiente
 * para que la siguiente visita muestre datos frescos al instante.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { Workspace, Task, WorkspaceSection, WorkspaceTag } from "@/lib/types";

// ─────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────
export const queryKeys = {
  workspacesOverview: ["workspaces", "overview"] as const,
  workspaces: ["workspaces"] as const,
  workspaceOverview: (id: string) => ["workspaces", id, "overview"] as const,
  tasks: (workspaceId: string) => ["tasks", workspaceId] as const,
  calendarData: ["calendar"] as const,
  tags: (workspaceId: string) => ["tags", workspaceId] as const,
  notes: (workspaceId: string) => ["notes", workspaceId] as const,
  folders: (workspaceId: string) => ["folders", workspaceId] as const,
  templates: (workspaceId: string) => ["templates", workspaceId] as const,
  noteDetail: (id: string) => ["note", id] as const,
  profile: ["profile"] as const,
};

// ─────────────────────────────────────────────
// Tipos auxiliares
// ─────────────────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatar_version?: number;
}

interface OverdueTask extends Task {
  workspaceName: string;
  workspaceId: string;
}

interface WorkspacesOverviewData {
  workspaces: Workspace[];
  overdueTasks: OverdueTask[];
}

interface WorkspaceOverviewData {
  workspace: Workspace;
  tasks: Task[];
  sections: WorkspaceSection[];
}

interface CalendarTask extends Task {
  workspaceName: string;
  workspaceId: string;
}

// ─────────────────────────────────────────────
// Fetchers
// ─────────────────────────────────────────────
async function fetchWorkspacesOverview(): Promise<WorkspacesOverviewData> {
  const res = await fetch("/api/workspaces/overview");
  if (!res.ok) {
    if (res.status === 404) return { workspaces: [], overdueTasks: [] };
    throw new Error("Error al cargar workspaces");
  }
  const data = await res.json();
  return {
    workspaces: Array.isArray(data.workspaces) ? data.workspaces : [],
    overdueTasks: Array.isArray(data.overdueTasks) ? data.overdueTasks : [],
  };
}

async function fetchWorkspaceOverview(workspaceId: string): Promise<WorkspaceOverviewData> {
  const res = await fetch(`/api/workspaces/${workspaceId}/overview`);
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return {
    workspace: data.workspace,
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    sections: Array.isArray(data.sections) ? data.sections : [],
  };
}

async function fetchTasks(workspaceId: string): Promise<Task[]> {
  const res = await fetch(`/api/tasks?workspaceId=${workspaceId}`);
  if (!res.ok) throw new Error("Error al cargar tareas");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await fetch("/api/workspaces");
  if (!res.ok) throw new Error("Error al cargar workspaces");
  const data = await res.json();
  return Array.isArray(data) ? data : data.workspaces ?? [];
}

async function fetchTags(workspaceId: string): Promise<WorkspaceTag[]> {
  const res = await fetch(`/api/tags?workspaceId=${workspaceId}`);
  if (!res.ok) throw new Error("Error al cargar etiquetas");
  return res.json();
}

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch("/api/auth/perfil");
  if (!res.ok) throw new Error("Error al cargar perfil");
  return res.json();
}

async function fetchCalendarData(): Promise<CalendarTask[]> {
  const wsRes = await fetch("/api/workspaces");
  if (!wsRes.ok) throw new Error("Error al cargar workspaces");
  const wsData = await wsRes.json();
  const workspacesList: Workspace[] = Array.isArray(wsData) ? wsData : wsData.workspaces ?? [];

  const allTasks: CalendarTask[] = [];
  await Promise.all(
    workspacesList.map(async (ws) => {
      const tasksRes = await fetch(`/api/tasks?workspaceId=${ws.id}`);
      if (!tasksRes.ok) return;
      const tasksData = await tasksRes.json();
      const tasksList: Task[] = Array.isArray(tasksData) ? tasksData : tasksData.tasks ?? [];
      tasksList.forEach((t) =>
        allTasks.push({ ...t, workspaceName: ws.name, workspaceId: ws.id })
      );
    })
  );
  return allTasks;
}

// ─────────────────────────────────────────────
// Hooks de lectura
// ─────────────────────────────────────────────

/** Lista de workspaces + tareas vencidas para /app */
export function useWorkspacesOverview(options?: Partial<UseQueryOptions<WorkspacesOverviewData>>) {
  return useQuery<WorkspacesOverviewData>({
    queryKey: queryKeys.workspacesOverview,
    queryFn: fetchWorkspacesOverview,
    staleTime: 30_000,
    ...options,
  });
}

/** Datos completos de un workspace (workspace + tasks ligeras + sections) */
export function useWorkspaceOverview(
  workspaceId: string,
  options?: Partial<UseQueryOptions<WorkspaceOverviewData>>
) {
  return useQuery<WorkspaceOverviewData>({
    queryKey: queryKeys.workspaceOverview(workspaceId),
    queryFn: () => fetchWorkspaceOverview(workspaceId),
    enabled: !!workspaceId,
    ...options,
  });
}

/** Tareas completas (con assignees/subtasks/tags) de un workspace */
export function useTasks(
  workspaceId: string,
  options?: Partial<UseQueryOptions<Task[]>>
) {
  return useQuery<Task[]>({
    queryKey: queryKeys.tasks(workspaceId),
    queryFn: () => fetchTasks(workspaceId),
    enabled: !!workspaceId,
    ...options,
  });
}

/** Lista plana de workspaces (para calendario, notas, etc.) */
export function useWorkspaces(options?: Partial<UseQueryOptions<Workspace[]>>) {
  return useQuery<Workspace[]>({
    queryKey: queryKeys.workspaces,
    queryFn: fetchWorkspaces,
    staleTime: 15 * 60_000, // los workspaces cambian poco
    ...options,
  });
}

/** Todas las tareas de todos los workspaces para el calendario */
export function useCalendarData(options?: Partial<UseQueryOptions<CalendarTask[]>>) {
  return useQuery<CalendarTask[]>({
    queryKey: queryKeys.calendarData,
    queryFn: fetchCalendarData,
    ...options,
  });
}

/** Etiquetas del workspace (para TagSelector, NoteTagSelector) */
export function useTags(
  workspaceId: string,
  options?: Partial<UseQueryOptions<WorkspaceTag[]>>
) {
  return useQuery<WorkspaceTag[]>({
    queryKey: queryKeys.tags(workspaceId),
    queryFn: () => fetchTags(workspaceId),
    staleTime: 10 * 60_000,
    enabled: !!workspaceId,
    ...options,
  });
}

/** Perfil del usuario autenticado */
export function useProfile(options?: Partial<UseQueryOptions<UserProfile>>) {
  return useQuery<UserProfile>({
    queryKey: queryKeys.profile,
    queryFn: fetchProfile,
    staleTime: 10 * 60_000,
    ...options,
  });
}

// ─────────────────────────────────────────────
// Hooks de invalidación (usar tras mutar)
// ─────────────────────────────────────────────

/** Devuelve helpers para invalidar queries tras mutaciones */
export function useInvalidators() {
  const qc = useQueryClient();

  return {
    /** Invalida workspaces overview (/app) */
    invalidateWorkspacesOverview: () =>
      qc.invalidateQueries({ queryKey: queryKeys.workspacesOverview }),

    /** Invalida lista plana de workspaces */
    invalidateWorkspaces: () =>
      qc.invalidateQueries({ queryKey: queryKeys.workspaces }),

    /** Invalida el overview de un workspace concreto */
    invalidateWorkspaceOverview: (workspaceId: string) =>
      qc.invalidateQueries({ queryKey: queryKeys.workspaceOverview(workspaceId) }),

    /** Invalida las tareas completas de un workspace */
    invalidateTasks: (workspaceId: string) =>
      qc.invalidateQueries({ queryKey: queryKeys.tasks(workspaceId) }),

    /** Invalida todo lo relacionado con un workspace */
    invalidateAll: (workspaceId: string) => {
      void qc.invalidateQueries({ queryKey: queryKeys.workspaceOverview(workspaceId) });
      void qc.invalidateQueries({ queryKey: queryKeys.tasks(workspaceId) });
      void qc.invalidateQueries({ queryKey: queryKeys.workspacesOverview });
      void qc.invalidateQueries({ queryKey: queryKeys.calendarData });
    },

    /** Invalida todo el calendario */
    invalidateCalendar: () =>
      qc.invalidateQueries({ queryKey: queryKeys.calendarData }),

    /** Invalida etiquetas de un workspace */
    invalidateTags: (workspaceId: string) =>
      qc.invalidateQueries({ queryKey: queryKeys.tags(workspaceId) }),

    /** Invalida perfil del usuario */
    invalidateProfile: () =>
      qc.invalidateQueries({ queryKey: queryKeys.profile }),

    /** Actualiza optimistamente el cache de tasks sin ir a la red */
    setTasksData: (workspaceId: string, updater: (prev: Task[]) => Task[]) =>
      qc.setQueryData<Task[]>(queryKeys.tasks(workspaceId), (prev) =>
        updater(prev ?? [])
      ),

    /** Actualiza optimistamente el cache de overview sin ir a la red */
    setWorkspaceOverviewData: (
      workspaceId: string,
      updater: (prev: WorkspaceOverviewData) => WorkspaceOverviewData
    ) =>
      qc.setQueryData<WorkspaceOverviewData>(
        queryKeys.workspaceOverview(workspaceId),
        (prev) => (prev ? updater(prev) : prev)
      ),
  };
}

// Re-export useMutation for convenience
export { useMutation, useQueryClient };
