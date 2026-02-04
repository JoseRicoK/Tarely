import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";
import { sendConfirmationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  const { name, email, password, avatar } = await request.json();

  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  // PRIMERO: Verificar si el usuario ya existe en profiles
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("email")
    .eq("email", email)
    .single();

  if (existingUser) {
    return NextResponse.json(
      { error: "Este correo electrónico ya está registrado. Por favor, inicia sesión." },
      { status: 400 }
    );
  }

  // Generar token de confirmación
  const confirmationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  // Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        avatar,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/confirm`,
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
      email_confirmed: false,
      confirmation_token: confirmationToken,
      confirmation_token_expires: tokenExpiry.toISOString(),
    });

  if (profileError) {
    console.error("Error creando perfil:", profileError);
    
    // Si falla por RLS, retornar error
    if (profileError.code === '42501') {
      return NextResponse.json(
        { error: "Error de configuración. Por favor, ejecuta el script SQL en Supabase." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Error al crear el perfil del usuario" },
      { status: 500 }
    );
  }

  // Enviar correo de confirmación
  const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/confirm?token=${confirmationToken}`;
  const emailResult = await sendConfirmationEmail({
    to: email,
    name,
    confirmationUrl,
  });

  if (!emailResult.success) {
    console.error("Error enviando email de confirmación:", emailResult.error);
    // No fallamos el registro aunque falle el email
  }

  return NextResponse.json({
    success: true,
    user: authData.user,
    session: null, // No devolvemos sesión hasta que confirme el email
    message: "Registro exitoso. Por favor, confirma tu correo electrónico.",
  });
}
