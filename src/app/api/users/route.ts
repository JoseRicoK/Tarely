import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";

// GET: Obtener perfil del usuario actual o listar todos los usuarios (para invitaciones)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const excludeWorkspaceId = searchParams.get("excludeWorkspace");
  const profile = searchParams.get("profile"); // Nuevo: para obtener perfil propio

  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  // Verificar autenticación
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Si se solicita el perfil propio
  if (profile === "me") {
    const { data: userProfile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(userProfile);
  }

  // Obtener todos los perfiles excepto el usuario actual
  let query = supabase
    .from("profiles")
    .select("id, name, email, avatar")
    .neq("id", user.id)
    .order("name");

  // Filtrar por búsqueda si se proporciona
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: profiles, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Si se proporciona excludeWorkspaceId, excluir usuarios que ya son miembros
  if (excludeWorkspaceId && profiles) {
    const { data: members } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", excludeWorkspaceId)
      .in("status", ["pending", "accepted"]);

    const memberIds = members?.map(m => m.user_id) || [];
    const filteredProfiles = profiles.filter(p => !memberIds.includes(p.id));
    
    return NextResponse.json(filteredProfiles);
  }

  return NextResponse.json(profiles || []);
}

// PATCH: Actualizar perfil del usuario actual
export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  // Verificar autenticación
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();

  // Actualizar perfil
  const { data, error } = await supabase
    .from("profiles")
    .update(body)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
