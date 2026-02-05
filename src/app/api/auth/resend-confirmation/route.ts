import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";
import { sendConfirmationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: "Email es requerido" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  // Buscar el perfil por email
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (profileError || !profile) {
    // No revelamos si el email existe por seguridad
    return NextResponse.json(
      { message: "Si el correo existe, recibirás un nuevo enlace de confirmación." },
      { status: 200 }
    );
  }

  // Si ya está confirmado, no enviamos otro correo
  if (profile.email_confirmed) {
    return NextResponse.json(
      { error: "Este correo ya está confirmado. Puedes iniciar sesión." },
      { status: 400 }
    );
  }

  // Generar nuevo token de confirmación
  const confirmationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  // Actualizar el token
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      confirmation_token: confirmationToken,
      confirmation_token_expires: tokenExpiry.toISOString(),
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Error actualizando token:", updateError);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }

  // Enviar correo de confirmación
  try {
    const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/confirm?token=${confirmationToken}`;
    await sendConfirmationEmail({
      to: email,
      name: profile.name,
      confirmationUrl,
    });

    return NextResponse.json({
      message: "Se ha enviado un nuevo correo de confirmación.",
    });
  } catch (emailError) {
    console.error("Error enviando email:", emailError);
    return NextResponse.json(
      { error: "Error al enviar el correo. Inténtalo de nuevo más tarde." },
      { status: 500 }
    );
  }
}
