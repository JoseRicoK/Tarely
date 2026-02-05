import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendConfirmationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  const { name, email, password, avatar } = await request.json();

  // Verificar si el email ya existe (en profiles o pendiente)
  const [{ data: existingUser }, { data: pendingUser }] = await Promise.all([
    supabaseAdmin.from("profiles").select("email").eq("email", email).single(),
    supabaseAdmin.from("pending_registrations").select("email").eq("email", email).single()
  ]);

  if (existingUser || pendingUser) {
    return NextResponse.json(
      { error: "Este correo ya está registrado. Revisa tu email o inicia sesión." },
      { status: 400 }
    );
  }

  // Generar token de confirmación (24h)
  const confirmationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Guardar registro PENDIENTE (password en texto plano porque Supabase Auth lo hasheará)
  const { error: pendingError } = await supabaseAdmin
    .from("pending_registrations")
    .insert({
      email,
      name,
      password_hash: password, // Guardamos el password original, no hasheado
      avatar,
      confirmation_token: confirmationToken,
      confirmation_token_expires: tokenExpiry.toISOString(),
    });

  if (pendingError) {

    return NextResponse.json(
      { error: "Error al procesar el registro. Intenta de nuevo." },
      { status: 500 }
    );
  }

  // Enviar correo de confirmación
  const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/confirm?token=${confirmationToken}`;
  const emailResult = await sendConfirmationEmail({
    to: email,
    name,
    confirmationUrl,
  });

  if (!emailResult.success) {
    console.error("Error enviando email:", emailResult.error);
    // Si falla el email, eliminar el registro pendiente
    await supabaseAdmin
      .from("pending_registrations")
      .delete()
      .eq("confirmation_token", confirmationToken);
    
    return NextResponse.json(
      { error: "Error al enviar el correo. Intenta de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Revisa tu correo para confirmar tu cuenta.",
  });
}
