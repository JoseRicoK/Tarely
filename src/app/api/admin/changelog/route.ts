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

// GET: Obtener todo el changelog
export async function GET() {
  try {
    const supabase = await createClient();
    
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entries, error } = await (supabase as any)
      .from("changelog")
      .select(`
        *,
        changelog_sections (
          *,
          changelog_items (*)
        )
      `)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching changelog:", error);
      return NextResponse.json({ error: "Error al cargar changelog" }, { status: 500 });
    }

    // Ordenar secciones e items por sort_order
    const sorted = (entries || []).map((entry: Record<string, unknown>) => ({
      ...entry,
      changelog_sections: ((entry.changelog_sections as Array<Record<string, unknown>>) || [])
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.sort_order as number) - (b.sort_order as number))
        .map((section: Record<string, unknown>) => ({
          ...section,
          changelog_items: ((section.changelog_items as Array<Record<string, unknown>>) || [])
            .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.sort_order as number) - (b.sort_order as number)),
        })),
    }));

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Error in GET /api/admin/changelog:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST: Crear nueva entrada del changelog
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { version, date, sections } = body;

    if (!version || !date) {
      return NextResponse.json(
        { error: "Versión y fecha son obligatorios" },
        { status: 400 }
      );
    }

    // Crear la entrada principal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entry, error: entryError } = await (supabase as any)
      .from("changelog")
      .insert({ version, date })
      .select()
      .single();

    if (entryError) {
      console.error("Error creating changelog entry:", entryError);
      return NextResponse.json({ error: "Error al crear entrada" }, { status: 500 });
    }

    // Crear secciones e items
    if (sections && Array.isArray(sections)) {
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: sectionData, error: sectionError } = await (supabase as any)
          .from("changelog_sections")
          .insert({
            changelog_id: entry.id,
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
          const itemsToInsert = section.items.map((item: string, idx: number) => ({
            section_id: sectionData.id,
            content: item,
            sort_order: idx,
          }));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("changelog_items")
            .insert(itemsToInsert);
        }
      }
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/changelog:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
