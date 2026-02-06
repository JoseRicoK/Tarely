import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Obtener feedback del usuario actual
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: feedback, error } = await (supabase as any)
      .from("feedback")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feedback:", error);
      return NextResponse.json({ error: "Error al cargar feedback" }, { status: 500 });
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error in GET /api/feedback:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST: Crear nuevo feedback
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { type, message } = body;

    // Validaciones
    if (!type || !["suggestion", "bug"].includes(type)) {
      return NextResponse.json(
        { error: "El tipo debe ser 'suggestion' o 'bug'" },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío" },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "El mensaje no puede exceder 1000 caracteres" },
        { status: 400 }
      );
    }

    // Obtener información del usuario desde profiles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase as any)
      .from("profiles")
      .select("email, name, avatar")
      .eq("id", user.id)
      .single();

    const userEmail = userData?.email || (user as { email?: string }).email || "";
    const userName = userData?.name || "Usuario";

    // Crear feedback - usar any para evitar errores de tipo con tabla nueva
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newFeedback, error: insertError } = await (supabase as any)
      .from("feedback")
      .insert({
        user_id: user.id,
        type,
        message: message.trim(),
        user_email: userEmail,
        user_name: userName,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating feedback:", insertError);
      return NextResponse.json({ error: "Error al crear feedback" }, { status: 500 });
    }

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/feedback:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE: Eliminar feedback del usuario
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const feedbackId = searchParams.get("id");

    if (!feedbackId) {
      return NextResponse.json({ error: "ID de feedback requerido" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("feedback")
      .delete()
      .eq("id", feedbackId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting feedback:", error);
      return NextResponse.json({ error: "Error al eliminar feedback" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/feedback:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
