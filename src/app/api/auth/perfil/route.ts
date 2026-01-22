import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored for Server Components
          }
        },
      },
    }
  );

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    );
  }

  // Obtener perfil de la tabla profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // Si no existe perfil, usar datos del user metadata
    return NextResponse.json({
      id: user.id,
      name: user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
      email: user.email,
      avatar: user.user_metadata?.avatar || "avatar1.png",
    });
  }

  return NextResponse.json({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar,
  });
}

export async function PATCH(request: Request) {
  const { name, avatar } = await request.json();

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored for Server Components
          }
        },
      },
    }
  );

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    );
  }

  // Actualizar metadata del usuario en auth
  await supabase.auth.updateUser({
    data: { name, avatar },
  });

  // Actualizar perfil en la tabla profiles
  const { error: updateError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      name,
      avatar,
      email: user.email,
      updated_at: new Date().toISOString(),
    });

  if (updateError) {
    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
