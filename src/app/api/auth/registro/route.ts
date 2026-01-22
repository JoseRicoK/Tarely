import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { name, email, password, avatar } = await request.json();

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

  // Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        avatar,
      },
    },
  });

  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: 400 }
    );
  }

  if (!authData.user) {
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 400 }
    );
  }

  // Crear perfil en la tabla profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: authData.user.id,
      name,
      email,
      avatar,
    });

  if (profileError) {
    console.error("Error creando perfil:", profileError);
    // No fallamos porque el usuario ya está creado
  }

  return NextResponse.json({
    user: authData.user,
    session: authData.session,
  });
}
