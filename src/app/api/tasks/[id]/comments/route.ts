// API Route: /api/tasks/[id]/comments
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClientWithCookies } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface CommentRow {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: { name: string; avatar: string } | null;
}

// GET /api/tasks/[id]/comments - Obtener comentarios de una tarea
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    const cookieStore = await cookies();
    const supabase = createClientWithCookies(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener comentarios con información del usuario
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: comments, error } = await (supabase as any)
      .from("task_comments")
      .select(`
        id,
        task_id,
        user_id,
        content,
        created_at,
        updated_at,
        profiles:user_id (
          name,
          avatar
        )
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json({ error: "Error al obtener comentarios" }, { status: 500 });
    }

    // Transformar datos
    const formattedComments = (comments as CommentRow[])?.map((c) => ({
      id: c.id,
      taskId: c.task_id,
      userId: c.user_id,
      content: c.content,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      userName: c.profiles?.name || "Usuario",
      userAvatar: c.profiles?.avatar || "",
    })) || [];

    return NextResponse.json(formattedComments);
  } catch (error) {
    console.error("Error getting comments:", error);
    return NextResponse.json({ error: "Error al obtener comentarios" }, { status: 500 });
  }
}

// POST /api/tasks/[id]/comments - Crear comentario
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    const cookieStore = await cookies();
    const supabase = createClientWithCookies(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "El contenido es requerido" }, { status: 400 });
    }

    // Crear comentario
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: comment, error } = await (supabase as any)
      .from("task_comments")
      .insert({
        task_id: taskId,
        user_id: user.id,
        content: content.trim(),
      })
      .select(`
        id,
        task_id,
        user_id,
        content,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json({ error: "Error al crear comentario" }, { status: 500 });
    }

    // Obtener info del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar")
      .eq("id", user.id)
      .single();

    // Registrar actividad
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("log_task_activity", {
      p_task_id: taskId,
      p_user_id: user.id,
      p_action: "comment_added",
      p_metadata: { commentId: comment.id },
    });

    return NextResponse.json({
      id: comment.id,
      taskId: comment.task_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      userName: profile?.name || "Usuario",
      userAvatar: profile?.avatar || "",
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Error al crear comentario" }, { status: 500 });
  }
}

// PATCH /api/tasks/[id]/comments - Editar comentario
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    const cookieStore = await cookies();
    const supabase = createClientWithCookies(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { commentId, content } = body;

    if (!commentId || !content || !content.trim()) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Actualizar comentario (solo el propietario puede editar)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: comment, error } = await (supabase as any)
      .from("task_comments")
      .update({ content: content.trim() })
      .eq("id", commentId)
      .eq("user_id", user.id)
      .eq("task_id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Error updating comment:", error);
      return NextResponse.json({ error: "Error al actualizar comentario" }, { status: 500 });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Error al actualizar comentario" }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]/comments - Eliminar comentario
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
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "ID de comentario requerido" }, { status: 400 });
    }

    // Eliminar comentario (solo el propietario puede eliminar)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("task_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id)
      .eq("task_id", taskId);

    if (error) {
      console.error("Error deleting comment:", error);
      return NextResponse.json({ error: "Error al eliminar comentario" }, { status: 500 });
    }

    // Registrar actividad
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("log_task_activity", {
      p_task_id: taskId,
      p_user_id: user.id,
      p_action: "comment_deleted",
      p_metadata: { commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Error al eliminar comentario" }, { status: 500 });
  }
}
