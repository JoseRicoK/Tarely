import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/confirm-error?error=token_missing", request.url)
    );
  }

  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  // Buscar el perfil con el token de confirmación
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("confirmation_token", token)
    .single();

  if (profileError || !profile) {
    return NextResponse.redirect(
      new URL("/auth/confirm-error?error=invalid_token", request.url)
    );
  }

  // Verificar si el token ha expirado
  if (!profile.confirmation_token_expires) {
    return NextResponse.redirect(
      new URL("/auth/confirm-error?error=invalid_token", request.url)
    );
  }

  const tokenExpiry = new Date(profile.confirmation_token_expires);
  if (tokenExpiry < new Date()) {
    return NextResponse.redirect(
      new URL("/auth/confirm-error?error=token_expired", request.url)
    );
  }

  // Verificar si ya está confirmado
  if (profile.email_confirmed) {
    return NextResponse.redirect(
      new URL("/auth/confirm-success?already=true", request.url)
    );
  }

  // Actualizar el perfil como confirmado
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      email_confirmed: true,
      confirmation_token: null,
      confirmation_token_expires: null,
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Error actualizando perfil:", updateError);
    return NextResponse.redirect(
      new URL("/auth/confirm-error?error=update_failed", request.url)
    );
  }

  // Enviar correo de bienvenida
  try {
    await sendWelcomeEmail({
      to: profile.email,
      name: profile.name,
    });
  } catch (emailError) {
    console.error("Error enviando email de bienvenida:", emailError);
    // No fallamos aunque falle el email de bienvenida
  }

  // Redirigir a la página de éxito
  return NextResponse.redirect(new URL("/auth/confirm-success", request.url));
}
