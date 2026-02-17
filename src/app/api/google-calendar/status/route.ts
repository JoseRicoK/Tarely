import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('google_calendar_tokens')
      .select('id, token_expiry, created_at')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ connected: false });
    }

    const isExpired = new Date(data.token_expiry) < new Date();

    return NextResponse.json({
      connected: true,
      tokenExpiry: data.token_expiry,
      isExpired,
      connectedSince: data.created_at,
    });
  } catch (error) {
    console.error('Error checking Google Calendar status:', error);
    return NextResponse.json(
      { error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
}
