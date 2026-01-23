import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";

// GET: Obtener miembros de un workspace
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Obtener miembros usando función SECURITY DEFINER
  const { data: members, error } = await supabase
    .rpc("get_workspace_members", { p_workspace_id: workspaceId });

  if (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!members || members.length === 0) {
    return NextResponse.json([]);
  }

  // Obtener perfiles de los miembros
  const userIds = [...new Set(members.map((m: { user_id: string }) => m.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, avatar")
    .in("id", userIds);

  // Crear mapa para lookup rápido
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Formatear respuesta
  const formattedMembers = members.map((m: { id: string; user_id: string; role: string; status: string; created_at: string; invited_by: string }) => {
    const profile = profileMap.get(m.user_id);
    return {
      id: m.id,
      userId: m.user_id,
      role: m.role,
      status: m.status,
      createdAt: m.created_at,
      invitedBy: m.invited_by,
      name: profile?.name || "Usuario",
      email: profile?.email || "",
      avatar: profile?.avatar || "avatar1.png",
    };
  });

  return NextResponse.json(formattedMembers);
}

// POST: Invitar a un usuario al workspace
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  const { userId } = await request.json();

  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Usar función SECURITY DEFINER para invitar
  const { data: memberId, error } = await supabase
    .rpc("invite_user_to_workspace", {
      p_workspace_id: workspaceId,
      p_user_id: userId,
    });

  if (error) {
    console.error("Error invitando usuario:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "El usuario ya tiene una invitación pendiente o es miembro" },
        { status: 400 }
      );
    }
    if (error.message.includes("No tienes permisos")) {
      return NextResponse.json(
        { error: "No tienes permisos para invitar a este workspace" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: memberId, success: true });
}

// DELETE: Eliminar miembro del workspace
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json({ error: "memberId requerido" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Usar función SECURITY DEFINER para eliminar miembros
  const { data: success, error } = await supabase
    .rpc("remove_workspace_member_by_id", { 
      p_workspace_id: workspaceId, 
      p_member_id: memberId 
    });

  if (error) {
    console.error("Error eliminando miembro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!success) {
    return NextResponse.json(
      { error: "No tienes permisos para eliminar este miembro" },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true });
}
