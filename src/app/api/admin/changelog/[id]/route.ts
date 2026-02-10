import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "josemariark@gmail.com";

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();
  
  return profile?.email === ADMIN_EMAIL;
}

// DELETE: Eliminar entrada del changelog
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    // El CASCADE eliminará secciones e items automáticamente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("changelog")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting changelog entry:", error);
      return NextResponse.json({ error: "Error al eliminar entrada" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/changelog/[id]:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PATCH: Actualizar entrada del changelog (incluyendo secciones e items)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { version, date, sections } = body;

    // Actualizar campos principales
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (version) updates.version = version;
    if (date) updates.date = date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("changelog")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating changelog entry:", error);
      return NextResponse.json({ error: "Error al actualizar entrada" }, { status: 500 });
    }

    // Si se envían secciones, reemplazar las existentes
    if (sections && Array.isArray(sections)) {
      // Eliminar secciones e items anteriores (CASCADE eliminará items)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("changelog_sections")
        .delete()
        .eq("changelog_id", id);

      // Crear nuevas secciones e items
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: sectionData, error: sectionError } = await (supabase as any)
          .from("changelog_sections")
          .insert({
            changelog_id: id,
            title: section.title,
            sort_order: i,
            image_url: section.image_url || null,
          })
          .select()
          .single();

        if (sectionError) {
          console.error("Error creating section:", sectionError);
          continue;
        }

        if (section.items && Array.isArray(section.items)) {
          const itemsToInsert = section.items
            .filter((item: string) => item.trim())
            .map((item: string, idx: number) => ({
              section_id: sectionData.id,
              content: item,
              sort_order: idx,
            }));

          if (itemsToInsert.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from("changelog_items")
              .insert(itemsToInsert);
          }
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/admin/changelog/[id]:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
