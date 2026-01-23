import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { name, email, password, avatar } = await request.json();

  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

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
