import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "josemariark@gmail.com";

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  return profile?.email === ADMIN_EMAIL;
}

// GET: Obtener estadísticas generales (admin)
export async function GET() {
  try {
    const supabase = await createClient();

    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // Ejecutar las 3 consultas en paralelo para mayor velocidad
    const [tasksResult, usersResult, workspacesResult] = await Promise.all([
      sb.from("tasks").select("*", { count: "exact", head: true }),
      sb.from("profiles").select("*", { count: "exact", head: true }),
      sb.from("workspaces").select("*", { count: "exact", head: true }),
    ]);

    if (tasksResult.error) console.error("Error counting tasks:", tasksResult.error);
    if (usersResult.error) console.error("Error counting users:", usersResult.error);
    if (workspacesResult.error) console.error("Error counting workspaces:", workspacesResult.error);

    const totalTasks = tasksResult.count || 0;
    const users = usersResult.count || 0;
    const workspaces = workspacesResult.count || 0;
    const avgWorkspacesPerUser = users > 0 ? Math.round((workspaces / users) * 100) / 100 : 0;

    return NextResponse.json({
      totalTasks: totalTasks || 0,
      totalUsers: users,
      totalWorkspaces: workspaces,
      avgWorkspacesPerUser,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/stats:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
