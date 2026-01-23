// API Route: /api/tasks/[id]/activity
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClientWithCookies } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ActivityRow {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles: { name: string; avatar: string } | null;
}

// GET /api/tasks/[id]/activity - Obtener actividad de una tarea
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    const cookieStore = await cookies();
    const supabase = createClientWithCookies(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener actividad con información del usuario
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activities, error } = await (supabase as any)
      .from("task_activity")
      .select(`
        id,
        task_id,
        user_id,
        action,
        field_changed,
        old_value,
        new_value,
        metadata,
        created_at,
        profiles:user_id (
          name,
          avatar
        )
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching activity:", error);
      return NextResponse.json({ error: "Error al obtener actividad" }, { status: 500 });
    }

    // Transformar datos
    const formattedActivities = (activities as unknown as ActivityRow[])?.map((a) => ({
      id: a.id,
      taskId: a.task_id,
      userId: a.user_id,
      action: a.action,
      fieldChanged: a.field_changed,
      oldValue: a.old_value,
      newValue: a.new_value,
      metadata: a.metadata,
      createdAt: a.created_at,
      userName: a.profiles?.name || "Usuario",
      userAvatar: a.profiles?.avatar || "",
    })) || [];

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error("Error getting activity:", error);
    return NextResponse.json({ error: "Error al obtener actividad" }, { status: 500 });
  }
}
