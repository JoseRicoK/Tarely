import { NextResponse } from "next/server";
import { isPast, isToday, isValid, parseISO } from "date-fns";
import { listTasksLite, listWorkspaces } from "@/lib/store";
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

    const tasksByWorkspace = await Promise.all(
      workspaces.map(async (workspace) => ({
        workspace,
        tasks: await listTasksLite(workspace.id),
      }))
    );

    const workspacesWithCounts: Workspace[] = tasksByWorkspace.map(
      ({ workspace, tasks }) => ({
        ...workspace,
        pendingTasksCount: tasks.filter((task) => !task.completed).length,
      })
    );

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
