import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/notes/upload
 * Sube un archivo adjunto (imagen, PDF, Word, Excel) a Supabase Storage
 * y devuelve la URL pública para insertarla en el editor.
 *
 * Body: FormData con campos:
 *   - file: File (requerido)
 *   - noteId: string (requerido)
 *
 * Response: { url: string, fileName: string, fileType: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const noteId = formData.get("noteId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "El archivo es requerido" }, { status: 400 });
  }
  if (!noteId) {
    return NextResponse.json({ error: "noteId es requerido" }, { status: 400 });
  }

  // Límite de 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo supera los 10MB" }, { status: 400 });
  }

  // Construir ruta: {userId}/{noteId}/{timestamp}-{originalName}
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${user.id}/${noteId}/${timestamp}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("note-attachments")
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[notes/upload] Error al subir archivo:", uploadError);
    return NextResponse.json(
      { error: "Error al subir el archivo: " + uploadError.message },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from("note-attachments")
    .getPublicUrl(filePath);

  return NextResponse.json({
    url: publicUrlData.publicUrl,
    fileName: file.name,
    fileType: file.type,
  });
}
