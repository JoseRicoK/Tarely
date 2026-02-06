import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener el archivo del FormData
    const formData = await req.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Use JPG, PNG o WebP" },
        { status: 400 }
      );
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 5MB" },
        { status: 400 }
      );
    }

    // Convertir a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determinar extensión
    const extension = file.type === "image/webp" ? "webp" : 
                     file.type === "image/png" ? "png" : "jpg";

    // Path en storage: {user_id}/avatar.{ext}
    const filePath = `${user.id}/avatar.${extension}`;

    // Subir a Supabase Storage (sobrescribe si existe)
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Sobrescribe si ya existe
      });

    if (uploadError) {
      console.error("Error uploading to storage:", uploadError);
      return NextResponse.json(
        { error: "Error al subir la imagen" },
        { status: 500 }
      );
    }

    // Obtener versión actual del avatar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileData } = await (supabase as any)
      .from("profiles")
      .select("avatar_version")
      .eq("id", user.id)
      .single();

    const newVersion = (profileData?.avatar_version || 0) + 1;

    // Actualizar profile con el nuevo path y versión
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("profiles")
      .update({
        avatar: filePath,
        avatar_version: newVersion,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar perfil" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatar: filePath,
      version: newVersion,
    });
  } catch (error) {
    console.error("Error in POST /api/auth/upload-avatar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
