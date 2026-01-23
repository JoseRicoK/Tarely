import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";

// GET: Obtener invitaciones pendientes del usuario actual
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Obtener invitaciones pendientes
  const { data: invitations, error } = await supabase
    .from("workspace_members")
    .select("id, workspace_id, status, created_at, invited_by")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!invitations || invitations.length === 0) {
    return NextResponse.json([]);
  }

  // Obtener workspaces usando función SECURITY DEFINER
  const workspaceIds = [...new Set(invitations.map(i => i.workspace_id))];
  const { data: workspaces } = await supabase
    .rpc("get_workspaces_by_ids", { p_workspace_ids: workspaceIds });

  // Obtener perfiles de quienes invitaron
  const inviterIds = [...new Set(invitations.map(i => i.invited_by).filter((id): id is string => id !== null))];
  const { data: inviters } = await supabase
    .from("profiles")
    .select("id, name, avatar")
    .in("id", inviterIds);

  // Crear mapas para lookup rápido
  type WorkspaceInfo = { id: string; name?: string; color?: string };
  type InviterInfo = { id: string; name?: string; avatar?: string };
  
  const workspaceMap = new Map<string, WorkspaceInfo>(
    (workspaces ?? []).map((w: WorkspaceInfo) => [w.id, w])
  );
  const inviterMap = new Map<string, InviterInfo>(
    (inviters ?? []).map((p: InviterInfo) => [p.id, p])
  );

  // Formatear respuesta
  const formattedInvitations = invitations.map(inv => {
    const workspace = workspaceMap.get(inv.workspace_id);
    const inviter = inv.invited_by ? inviterMap.get(inv.invited_by) : undefined;
    return {
      id: inv.id,
      workspaceId: inv.workspace_id,
      workspaceName: workspace?.name || "Workspace",
      workspaceColor: workspace?.color || "#8b5cf6",
      invitedBy: {
        name: inviter?.name || "Usuario",
        avatar: inviter?.avatar || "avatar1.png",
      },
      createdAt: inv.created_at,
    };
  });

  return NextResponse.json(formattedInvitations);
}

// PATCH: Aceptar o rechazar invitación
export async function PATCH(request: Request) {
  const body = await request.json();
  const { invitationId } = body;
  
  // Soportar ambos formatos: action="accept"/"reject" o accept=true/false
  let shouldAccept: boolean;
  if (typeof body.accept === "boolean") {
    shouldAccept = body.accept;
  } else if (body.action === "accept" || body.action === "reject") {
    shouldAccept = body.action === "accept";
  } else {
    return NextResponse.json(
      { error: "invitationId y accept (boolean) o action (accept/reject) requeridos" },
      { status: 400 }
    );
  }

  if (!invitationId) {
    return NextResponse.json(
      { error: "invitationId requerido" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const newStatus = shouldAccept ? "accepted" : "rejected";

  const { error } = await supabase
    .from("workspace_members")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: newStatus });
}
