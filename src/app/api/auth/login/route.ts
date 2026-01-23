import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClientWithCookies } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const cookieStore = await cookies();
  const supabase = createClientWithCookies(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }

  return NextResponse.json({ 
    user: data.user,
    session: data.session 
  });
}
