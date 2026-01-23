import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";

// GET: Obtener miembros disponibles para asignar tareas
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

  const { data: members, error } = await supabase
    .rpc("get_workspace_members_for_assignment", { p_workspace_id: workspaceId });

  if (error) {
    console.error("Error obteniendo miembros:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(members || []);
}
