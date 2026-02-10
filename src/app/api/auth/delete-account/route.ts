import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE() {
  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    );
  }

  const userId = user.id;

  try {
    // 1. Eliminar avatares del storage (si hay)
    try {
      const { data: avatarFiles } = await supabaseAdmin.storage
        .from("avatars")
        .list(userId);

      if (avatarFiles && avatarFiles.length > 0) {
        const filePaths = avatarFiles.map(f => `${userId}/${f.name}`);
        await supabaseAdmin.storage.from("avatars").remove(filePaths);
      }
    } catch {
      // Continuar aunque falle la limpieza de avatares
    }

    // 2. Eliminar archivos adjuntos de tareas del storage
    try {
      // Obtener workspaces del usuario para limpiar archivos
      const { data: workspaces } = await supabaseAdmin
        .from("workspaces")
        .select("id")
        .eq("user_id", userId);

      if (workspaces) {
        for (const ws of workspaces) {
          const { data: files } = await supabaseAdmin.storage
            .from("task-attachments")
            .list(ws.id);

          if (files && files.length > 0) {
            const filePaths = files.map(f => `${ws.id}/${f.name}`);
            await supabaseAdmin.storage.from("task-attachments").remove(filePaths);
          }
        }
      }
    } catch {
      // Continuar aunque falle la limpieza de archivos
    }

    // 3. Eliminar feedback del usuario
    await supabaseAdmin
      .from("feedback")
      .delete()
      .eq("user_id", userId);

    // 4. Eliminar comentarios del usuario en tareas
    await supabaseAdmin
      .from("task_comments")
      .delete()
      .eq("user_id", userId);

    // 5. Eliminar actividad del usuario en tareas
    await supabaseAdmin
      .from("task_activity")
      .delete()
      .eq("user_id", userId);

    // 6. Eliminar adjuntos del usuario
    await supabaseAdmin
      .from("task_attachments")
      .delete()
      .eq("user_id", userId);

    // 7. Eliminar asignaciones del usuario
    await supabaseAdmin
      .from("task_assignees")
      .delete()
      .eq("user_id", userId);

    // 8. Eliminar membresías de workspaces compartidos
    await supabaseAdmin
      .from("workspace_members")
      .delete()
      .eq("user_id", userId);

    // 9. Eliminar workspaces del usuario (CASCADE eliminará tasks, subtasks, sections, etc.)
    await supabaseAdmin
      .from("workspaces")
      .delete()
      .eq("user_id", userId);

    // 10. Eliminar perfil del usuario
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    // 11. Cerrar sesión del usuario
    await supabase.auth.signOut();

    // 12. Eliminar usuario de auth usando el admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error eliminando usuario de auth:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar la cuenta. Los datos han sido eliminados pero contacta soporte si sigues teniendo problemas." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando cuenta:", error);
    return NextResponse.json(
      { error: "Error al eliminar la cuenta" },
      { status: 500 }
    );
  }
}
