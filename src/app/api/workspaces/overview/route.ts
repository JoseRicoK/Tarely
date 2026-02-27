import { NextResponse } from "next/server";
import { isPast, isToday, isValid, parseISO } from "date-fns";
import { listTasksLite, listWorkspaces } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";
import type { Task, Workspace } from "@/lib/types";

interface OverdueTask extends Task {
  workspaceName: string;
  workspaceId: string;
}

interface WorkspacesOverviewResponse {
  workspaces: Workspace[];
  overdueTasks: OverdueTask[];
}

export async function GET() {
  try {
    const workspaces = await listWorkspaces();

    if (workspaces.length === 0) {
      const emptyResponse: WorkspacesOverviewResponse = {
        workspaces: [],
        overdueTasks: [],
      };
      return NextResponse.json(emptyResponse);
    }

    const supabase = await createClient();
    const workspaceIds = workspaces.map((w) => w.id);

    // Fetch sections + tasks in parallel
    const [sectionsResult, tasksByWorkspace] = await Promise.all([
      supabase
        .from("workspace_sections")
        .select("id, workspace_id, order")
        .in("workspace_id", workspaceIds)
        .order("order", { ascending: true }),
      Promise.all(
        workspaces.map(async (workspace) => ({
          workspace,
          tasks: await listTasksLite(workspace.id),
        }))
      ),
    ]);

    // Pick first section (lowest order) per workspace
    const firstSectionByWorkspace = new Map<string, string>();
    for (const s of (sectionsResult.data ?? []) as { id: string; workspace_id: string; order: number }[]) {
      if (!firstSectionByWorkspace.has(s.workspace_id)) {
        firstSectionByWorkspace.set(s.workspace_id, s.id);
      }
    }

    const workspacesWithCounts: Workspace[] = tasksByWorkspace.map(({ workspace, tasks }) => {
      const firstSectionId = firstSectionByWorkspace.get(workspace.id);
      // Mirror KanbanBoard logic: task belongs to first section if:
      //   - explicitly assigned to it (task.sectionId === firstSectionId)
      //   - OR has no sectionId and is not completed (legacy fallback → Pendientes)
      const pendingTasksCount = tasks.filter(
        (task) =>
          task.sectionId === firstSectionId ||
          (!task.sectionId && !task.completed)
      ).length;
      return { ...workspace, pendingTasksCount };
    });

    const overdueTasks: OverdueTask[] = tasksByWorkspace
      .flatMap(({ workspace, tasks }) =>
        tasks
          .filter((task) => {
            if (!task.dueDate || task.completed) return false;
            const dueDate = parseISO(task.dueDate);
            return isValid(dueDate) && isPast(dueDate) && !isToday(dueDate);
          })
          .map((task) => ({
            ...task,
            workspaceName: workspace.name,
            workspaceId: workspace.id,
          }))
      )
      .sort((a, b) => {
        const dateA = a.dueDate ? parseISO(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? parseISO(b.dueDate).getTime() : 0;
        return dateA - dateB;
      });

    const response: WorkspacesOverviewResponse = {
      workspaces: workspacesWithCounts,
      overdueTasks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error loading workspaces overview:", error);
    return NextResponse.json(
      { error: "Error al obtener el resumen de workspaces" },
      { status: 500 }
    );
  }
}
