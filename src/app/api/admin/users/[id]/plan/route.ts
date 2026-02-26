// API Route: /api/admin/users/[id]/plan
// Updates the plan of a specific user
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/users/[id]/plan
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!(await isAdmin(supabase))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { plan } = await request.json();
    if (!plan || !["free", "pro"].includes(plan)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any)
      .from("profiles")
      .update({ plan })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user plan:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
