import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }

  // Verificar si el email está confirmado
  const { data: profile } = await supabase
    .from("profiles")
    .select("email_confirmed")
    .eq("id", data.user.id)
    .single();

  if (profile && !profile.email_confirmed) {
    // Cerrar sesión si no está confirmado
    await supabase.auth.signOut();
    
    return NextResponse.json(
      { 
        error: "Por favor, confirma tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.",
        needsConfirmation: true 
      },
      { status: 403 }
    );
  }

  return NextResponse.json({ 
    user: data.user,
    session: data.session 
  });
}
