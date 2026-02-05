import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/confirm-error?error=token_missing", request.url)
    );
  }

  // Buscar el registro pendiente
  const { data: pendingReg, error: findError } = await supabaseAdmin
    .from("pending_registrations")
    .select("*")
    .eq("confirmation_token", token)
    .single();

  if (findError || !pendingReg) {
    return NextResponse.redirect(
      new URL("/auth/confirm-error?error=invalid_token", request.url)
    );
  }

  // Verificar expiración
  if (new Date(pendingReg.confirmation_token_expires) < new Date()) {
    return NextResponse.redirect(
      new URL("/auth/confirm-error?error=token_expired", request.url)
    );
  }

  // Intentar crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: pendingReg.email,
    password: pendingReg.password_hash,
    email_confirm: true,
    user_metadata: {
      name: pendingReg.name,
      avatar: pendingReg.avatar,
    }
  });

  // Si hay error y NO es porque el usuario ya existe, fallar
  if (authError && !authError.message?.includes('already')) {
    console.error("Error creando usuario:", authError);
    return NextResponse.redirect(
      new URL("/auth/confirm-error?error=creation_failed", request.url)
    );
  }

  // Obtener el ID del usuario (ya sea recién creado o existente)
  const userId = authData?.user?.id;
  
  if (!userId) {
    console.error("No se pudo obtener el ID del usuario");
    return NextResponse.redirect(
      new URL("/auth/confirm-error?error=creation_failed", request.url)
    );
  }

  // Verificar si el perfil ya existe
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  // Crear o actualizar perfil
  if (!existingProfile) {
    // Crear nuevo perfil
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        email: pendingReg.email,
        name: pendingReg.name,
        avatar: pendingReg.avatar,
        email_confirmed: true,
      });

    if (profileError) {
      console.error("Error creando perfil:", profileError);
      return NextResponse.redirect(
        new URL("/auth/confirm-error?error=profile_failed", request.url)
      );
    }
  } else {
    // Actualizar perfil existente para marcar email como confirmado
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ email_confirmed: true })
      .eq("id", userId);

    if (updateError) {
      console.error("Error actualizando perfil:", updateError);
      return NextResponse.redirect(
        new URL("/auth/confirm-error?error=profile_failed", request.url)
      );
    }
  }

  // Eliminar registro pendiente
  await supabaseAdmin
    .from("pending_registrations")
    .delete()
    .eq("id", pendingReg.id);

  // Email de bienvenida
  try {
    await sendWelcomeEmail({
      to: pendingReg.email,
      name: pendingReg.name,
    });
  } catch (error) {
    console.error("Error enviando bienvenida:", error);
  }

  // Redirigir a la página de éxito
  return NextResponse.redirect(new URL("/auth/confirm-success", request.url));
}
