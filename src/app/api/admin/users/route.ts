// API Route: /api/admin/users
// Returns all users with their usage data for the admin dashboard
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

// GET /api/admin/users
// Query params:
//   ?view=monthly&month=2026-02-01  → uso mensual del mes indicado
//   ?view=historical                → total histórico de eventos IA
//   ?view=current (default)         → conteos actuales
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "monthly";
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7) + "-01";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabaseAdmin as any;

    // 1) Fetch all profiles
    const { data: profiles, error: profilesError } = await sb
      .from("profiles")
      .select("id, name, email, plan, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const userIds: string[] = profiles.map((p: { id: string }) => p.id);

    // 2) Tasks count per user
    const { data: tasksCounts } = await sb
      .from("tasks")
      .select("user_id")
      .in("user_id", userIds);

    const tasksMap: Record<string, number> = {};
    for (const row of tasksCounts || []) {
      tasksMap[row.user_id] = (tasksMap[row.user_id] || 0) + 1;
    }

    // 3) Workspaces count per user
    const { data: workspacesCounts } = await sb
      .from("workspaces")
      .select("user_id")
      .in("user_id", userIds);

    const workspacesMap: Record<string, number> = {};
    for (const row of workspacesCounts || []) {
      workspacesMap[row.user_id] = (workspacesMap[row.user_id] || 0) + 1;
    }

    // 4) Notes count per user
    const { data: notesCounts } = await sb
      .from("notes")
      .select("user_id")
      .in("user_id", userIds);

    const notesMap: Record<string, number> = {};
    for (const row of notesCounts || []) {
      notesMap[row.user_id] = (notesMap[row.user_id] || 0) + 1;
    }

    // 5) AI usage — always from ai_usage_events (monthly filtered by date range, or all-time)
    const aiTasksMap: Record<string, number> = {};
    const aiNotesMap: Record<string, number> = {};

    if (view === "monthly") {
      // Filter events within the requested month
      const [y, m] = month.split("-").map(Number);
      const monthStart = `${y}-${String(m).padStart(2, "0")}-01`;
      const nextMonth = m === 12
        ? `${y + 1}-01-01`
        : `${y}-${String(m + 1).padStart(2, "0")}-01`;

      const { data: eventsData } = await sb
        .from("ai_usage_events")
        .select("user_id, kind")
        .in("user_id", userIds)
        .gte("created_at", monthStart)
        .lt("created_at", nextMonth);

      for (const row of eventsData || []) {
        if (row.kind === "tasks") {
          aiTasksMap[row.user_id] = (aiTasksMap[row.user_id] || 0) + 1;
        } else if (row.kind === "notes") {
          aiNotesMap[row.user_id] = (aiNotesMap[row.user_id] || 0) + 1;
        }
      }
    } else {
      // Historical: sum all events
      const { data: eventsData } = await sb
        .from("ai_usage_events")
        .select("user_id, kind")
        .in("user_id", userIds);

      for (const row of eventsData || []) {
        if (row.kind === "tasks") {
          aiTasksMap[row.user_id] = (aiTasksMap[row.user_id] || 0) + 1;
        } else if (row.kind === "notes") {
          aiNotesMap[row.user_id] = (aiNotesMap[row.user_id] || 0) + 1;
        }
      }
    }

    // 6) Build response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = profiles.map((p: any) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      plan: p.plan || "free",
      createdAt: p.created_at,
      tasksCount: tasksMap[p.id] || 0,
      workspacesCount: workspacesMap[p.id] || 0,
      notesCount: notesMap[p.id] || 0,
      aiTasksUses: aiTasksMap[p.id] || 0,
      aiNotesUses: aiNotesMap[p.id] || 0,
    }));

    return NextResponse.json({ users, view, month });
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
