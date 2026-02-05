import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  console.log("=== LOGIN ATTEMPT ===");
  console.log("Email:", email);
  console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log("ANON_KEY length:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);

  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  console.log("Attempting signInWithPassword...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("Login result:", { 
    success: !!data.user, 
    error: error?.message,
    errorCode: error?.status,
    errorDetails: error
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }

  // Verificar si el email está confirmado
  console.log("Checking email confirmation for user:", data.user.id);
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email_confirmed")
    .eq("id", data.user.id)
    .single();

  console.log("Profile check:", { profile, profileError });

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

  console.log("Login successful!");
  return NextResponse.json({ 
    user: data.user,
    session: data.session 
  });
}
