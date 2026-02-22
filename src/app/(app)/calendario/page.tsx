"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Task, Workspace } from "@/lib/types";
import { NotionCalendar } from "@/components/calendar/NotionCalendar";

interface CalendarTask extends Task {
  workspaceName: string;
  workspaceId: string;
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const wsRes = await fetch("/api/workspaces");
      if (!wsRes.ok) throw new Error("Error loading workspaces");
      const wsData = await wsRes.json();
      const workspacesList: Workspace[] = Array.isArray(wsData) ? wsData : (wsData.workspaces || []);
      setWorkspaces(workspacesList);

      const allTasks: CalendarTask[] = [];
      for (const ws of workspacesList) {
        const tasksRes = await fetch(`/api/tasks?workspaceId=${ws.id}`);
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const tasksList = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || []);
          const tasksWithWorkspace = tasksList.map((t: Task) => ({
            ...t,
            workspaceName: ws.name,
            workspaceId: ws.id,
          }));
          allTasks.push(...tasksWithWorkspace);
        }
      }
      setTasks(allTasks);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast.error("Error al cargar el calendario");
    } finally {
      setIsLoading(false);
    }
  }

  const tasksWithDueDate = tasks.filter((t) => t.dueDate);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-14 z-40">
      <NotionCalendar
        tasks={tasksWithDueDate}
        workspaces={workspaces}
      />
    </div>
  );
}
