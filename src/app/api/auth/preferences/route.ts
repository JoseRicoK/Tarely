import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";

// GET: Obtener preferencias del usuario
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("theme_mode, accent_color")
    .eq("id", user.id)
    .single();

  if (error) {
    // Si las columnas no existen aún, devolver defaults
    return NextResponse.json({ theme_mode: "dark", accent_color: "none" });
  }

  return NextResponse.json({
    theme_mode: profile.theme_mode || "dark",
    accent_color: profile.accent_color || "none",
  });
}

// PATCH: Actualizar preferencias del usuario
export async function PATCH(request: Request) {
  const body = await request.json();
  const { theme_mode, accent_color } = body;

  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Validar valores
  const validModes = ["dark", "light"];
  const validColors = ["none", "pink", "blue", "green", "orange", "cyan", "red"];

  const updates: Record<string, string> = {};

  if (theme_mode && validModes.includes(theme_mode)) {
    updates.theme_mode = theme_mode;
  }
  if (accent_color !== undefined && validColors.includes(accent_color)) {
    updates.accent_color = accent_color;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Sin cambios válidos" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Error al guardar preferencias" }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...updates });
}
