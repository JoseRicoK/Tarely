// API Route: /api/tasks/[id]/attachments
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClientWithCookies } from "@/lib/supabase/server";
import type { AttachmentType } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface AttachmentRow {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  thumbnail_path: string | null;
  created_at: string;
  profiles: { name: string; avatar: string } | null;
}

// Determinar tipo de archivo
function getFileType(mimeType: string): AttachmentType {
  if (mimeType.startsWith("image/")) return "image";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("sheet") ||
    mimeType.includes("text/")
  ) return "document";
  return "other";
}

// GET /api/tasks/[id]/attachments - Obtener archivos adjuntos
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    const cookieStore = await cookies();
    const supabase = createClientWithCookies(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener attachments con información del usuario
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attachments, error } = await (supabase as any)
      .from("task_attachments")
      .select(`
        id,
        task_id,
        user_id,
        file_name,
        file_type,
        file_size,
        mime_type,
        storage_path,
        thumbnail_path,
        created_at,
        profiles:user_id (
          name,
          avatar
        )
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching attachments:", error);
      return NextResponse.json({ error: "Error al obtener archivos" }, { status: 500 });
    }

    // Generar URLs firmadas para cada archivo
    const formattedAttachments = await Promise.all(
      ((attachments || []) as unknown as AttachmentRow[]).map(async (a) => {
        // Generar URL firmada (válida por 1 hora)
        const { data: signedUrlData } = await supabase.storage
          .from("task-attachments")
          .createSignedUrl(a.storage_path, 3600);

        return {
          id: a.id,
          taskId: a.task_id,
          userId: a.user_id,
          fileName: a.file_name,
          fileType: a.file_type as AttachmentType,
          fileSize: a.file_size,
          mimeType: a.mime_type,
          storagePath: a.storage_path,
          thumbnailPath: a.thumbnail_path,
          createdAt: a.created_at,
          userName: a.profiles?.name || "Usuario",
          userAvatar: a.profiles?.avatar || "",
          url: signedUrlData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json(formattedAttachments);
  } catch (error) {
    console.error("Error getting attachments:", error);
    return NextResponse.json({ error: "Error al obtener archivos" }, { status: 500 });
  }
}

// POST /api/tasks/[id]/attachments - Subir archivo
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    const cookieStore = await cookies();
    const supabase = createClientWithCookies(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener archivo del FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo es demasiado grande (máximo 10MB)" }, { status: 400 });
    }

    // Generar path único
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${user.id}/${taskId}/${timestamp}_${sanitizedName}`;

    // Subir archivo a Storage
    const { error: uploadError } = await supabase.storage
      .from("task-attachments")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
    }

    // Crear registro en la base de datos
    const fileType = getFileType(file.type);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attachment, error: dbError } = await (supabase as any)
      .from("task_attachments")
      .insert({
        task_id: taskId,
        user_id: user.id,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating attachment record:", dbError);
      // Intentar eliminar el archivo subido
      await supabase.storage.from("task-attachments").remove([storagePath]);
      return NextResponse.json({ error: "Error al registrar archivo" }, { status: 500 });
    }

    // Obtener info del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar")
      .eq("id", user.id)
      .single();

    // Generar URL firmada
    const { data: signedUrlData } = await supabase.storage
      .from("task-attachments")
      .createSignedUrl(storagePath, 3600);

    // Registrar actividad
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("log_task_activity", {
      p_task_id: taskId,
      p_user_id: user.id,
      p_action: "attachment_added",
      p_metadata: { 
        attachmentId: attachment.id, 
        fileName: file.name,
        fileType,
      },
    });

    return NextResponse.json({
      id: attachment.id,
      taskId: attachment.task_id,
      userId: attachment.user_id,
      fileName: attachment.file_name,
      fileType: attachment.file_type as AttachmentType,
      fileSize: attachment.file_size,
      mimeType: attachment.mime_type,
      storagePath: attachment.storage_path,
      thumbnailPath: attachment.thumbnail_path,
      createdAt: attachment.created_at,
      userName: profile?.name || "Usuario",
      userAvatar: profile?.avatar || "",
      url: signedUrlData?.signedUrl || null,
    });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]/attachments - Eliminar archivo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    const cookieStore = await cookies();
    const supabase = createClientWithCookies(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json({ error: "ID de archivo requerido" }, { status: 400 });
    }

    // Obtener el attachment para borrar el archivo de storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attachment } = await (supabase as any)
      .from("task_attachments")
      .select("storage_path, file_name")
      .eq("id", attachmentId)
      .eq("user_id", user.id)
      .eq("task_id", taskId)
      .single();

    if (!attachment) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    // Eliminar de storage
    const { error: storageError } = await supabase.storage
      .from("task-attachments")
      .remove([attachment.storage_path]);

    if (storageError) {
      console.error("Error deleting from storage:", storageError);
    }

    // Eliminar registro de la base de datos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (supabase as any)
      .from("task_attachments")
      .delete()
      .eq("id", attachmentId)
      .eq("user_id", user.id)
      .eq("task_id", taskId);

    if (dbError) {
      console.error("Error deleting attachment record:", dbError);
      return NextResponse.json({ error: "Error al eliminar archivo" }, { status: 500 });
    }

    // Registrar actividad
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("log_task_activity", {
      p_task_id: taskId,
      p_user_id: user.id,
      p_action: "attachment_deleted",
      p_metadata: { 
        attachmentId,
        fileName: attachment.file_name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json({ error: "Error al eliminar archivo" }, { status: 500 });
  }
}
