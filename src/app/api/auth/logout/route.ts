import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
