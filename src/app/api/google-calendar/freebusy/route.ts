import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getFreeBusy, refreshAccessToken } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const { timeMin, timeMax, calendarId } = await request.json();

    if (!timeMin || !timeMax) {
      return NextResponse.json(
        { error: 'timeMin and timeMax are required' },
        { status: 400 }
      );
    }

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
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 404 }
      );
    }

    let accessToken = tokenData.access_token;
    let refreshToken = tokenData.refresh_token;

    const isExpired = new Date(tokenData.token_expiry) < new Date();
    if (isExpired) {
      const newTokens = await refreshAccessToken(refreshToken);
      accessToken = newTokens.access_token!;
      
      if (newTokens.expiry_date) {
        await supabase
          .from('google_calendar_tokens')
          .update({
            access_token: accessToken,
            token_expiry: new Date(newTokens.expiry_date).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }
    }

    const freeBusyData = await getFreeBusy(
      accessToken,
      refreshToken,
      timeMin,
      timeMax,
      calendarId || 'primary'
    );

    return NextResponse.json(freeBusyData);
  } catch (error) {
    console.error('Error fetching free/busy data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch free/busy data' },
      { status: 500 }
    );
  }
}
