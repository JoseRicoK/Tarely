import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendResetPasswordEmail } from "@/lib/email";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: "El correo es obligatorio" },
      { status: 400 }
    );
  }

  // Buscar el perfil por email
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, email_confirmed")
    .eq("email", email)
    .single();

  // Por seguridad, siempre respondemos igual aunque no exista el email
  if (!profile || !profile.email_confirmed) {
    return NextResponse.json({
      success: true,
      message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
    });
  }

  // Generar token de reset (1 hora de validez)
  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  // Guardar token en el perfil
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      reset_password_token: resetToken,
      reset_password_token_expires: tokenExpiry.toISOString(),
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Error guardando token de reset:", updateError);
    return NextResponse.json(
      { error: "Error al procesar la solicitud. Intenta de nuevo." },
      { status: 500 }
    );
  }

  // Enviar correo con enlace de reset
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
  console.log("[RESET DEBUG] Enviando email a:", email);
  console.log("[RESET DEBUG] Perfil encontrado:", profile.name, "| email_confirmed:", profile.email_confirmed);
  console.log("[RESET DEBUG] Reset URL:", resetUrl);
  console.log("[RESET DEBUG] NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
  const emailResult = await sendResetPasswordEmail({
    to: email,
    name: profile.name,
    resetUrl,
  });
  console.log("[RESET DEBUG] Resultado envío:", JSON.stringify(emailResult));

  if (!emailResult.success) {
    console.error("Error enviando email de reset:", emailResult.error);
    // Limpiar token si falla el email
    await supabaseAdmin
      .from("profiles")
      .update({
        reset_password_token: null,
        reset_password_token_expires: null,
      })
      .eq("id", profile.id);

    return NextResponse.json(
      { error: "Error al enviar el correo. Intenta de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
  });
}
