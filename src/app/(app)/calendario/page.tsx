"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Calendar as CalendarIcon, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import type { Task, Workspace } from "@/lib/types";
import { NotionCalendar } from "@/components/calendar/NotionCalendar";
import { GoogleCalendarSettings } from "@/components/calendar/GoogleCalendarSettings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CalendarTask extends Task {
  workspaceName: string;
  workspaceId: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all");
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
      const workspacesList = Array.isArray(wsData) ? wsData : (wsData.workspaces || []);
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

  const filteredTasks = selectedWorkspace === "all"
    ? tasks
    : tasks.filter((t) => t.workspaceId === selectedWorkspace);

  const tasksWithDueDate = filteredTasks.filter((t) => t.dueDate);

  const stats = {
    total: tasksWithDueDate.length,
    pending: tasksWithDueDate.filter((t) => !t.completed).length,
    completed: tasksWithDueDate.filter((t) => t.completed).length,
    overdue: tasksWithDueDate.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    }).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-14 z-40">
      <NotionCalendar
        tasks={tasksWithDueDate}
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
      />
    </div>
  );
}
