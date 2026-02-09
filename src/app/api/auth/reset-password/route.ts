import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: "Token y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  // Buscar perfil por token de reset
  console.log("[RESET-PW DEBUG] Token recibido:", token);
  const { data: profile, error: findError } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, reset_password_token, reset_password_token_expires")
    .eq("reset_password_token", token)
    .single();

  console.log("[RESET-PW DEBUG] Perfil encontrado:", profile ? `${profile.email} (id: ${profile.id})` : "NO");
  console.log("[RESET-PW DEBUG] Error búsqueda:", findError?.message || "ninguno");

  if (findError || !profile) {
    // Debug: ver qué token hay actualmente en la DB para ese email
    const { data: debugProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, reset_password_token, reset_password_token_expires")
      .not("reset_password_token", "is", null)
      .limit(5);
    console.log("[RESET-PW DEBUG] Perfiles con token activo:", JSON.stringify(debugProfile));
    
    return NextResponse.json(
      { error: "El enlace no es válido o ya ha sido utilizado." },
      { status: 400 }
    );
  }

  // Verificar expiración del token (1 hora)
  if (new Date(profile.reset_password_token_expires) < new Date()) {
    // Limpiar token expirado
    await supabaseAdmin
      .from("profiles")
      .update({
        reset_password_token: null,
        reset_password_token_expires: null,
      })
      .eq("id", profile.id);

    return NextResponse.json(
      { error: "El enlace ha expirado. Solicita uno nuevo." },
      { status: 400 }
    );
  }

  // Actualizar contraseña en Supabase Auth
  const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
    profile.id,
    { password }
  );

  if (updateAuthError) {
    console.error("Error actualizando contraseña:", updateAuthError);
    return NextResponse.json(
      { error: "Error al actualizar la contraseña. Intenta de nuevo." },
      { status: 500 }
    );
  }

  // Limpiar token de reset
  await supabaseAdmin
    .from("profiles")
    .update({
      reset_password_token: null,
      reset_password_token_expires: null,
    })
    .eq("id", profile.id);

  return NextResponse.json({
    success: true,
    message: "Contraseña actualizada correctamente.",
  });
}
