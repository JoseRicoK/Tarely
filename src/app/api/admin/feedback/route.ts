import { NextResponse } from "next/server";
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

// GET: Obtener todo el feedback (admin)
export async function GET() {
  try {
    const supabase = await createClient();
    
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: feedback, error } = await (supabase as any)
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all feedback:", error);
      return NextResponse.json({ error: "Error al cargar feedback" }, { status: 500 });
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error in GET /api/admin/feedback:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
