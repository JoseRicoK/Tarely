import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleCalendarEvents } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');

    if (!timeMin || !timeMax) {
      return NextResponse.json({ error: 'timeMin and timeMax are required' }, { status: 400 });
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData || !tokenData.access_token) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 404 });
    }

    const events = await getGoogleCalendarEvents(
      tokenData.access_token,
      new Date(timeMin),
      new Date(timeMax)
    );

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
