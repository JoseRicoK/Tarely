import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleCalendarEvents, getGoogleCalendarList } from '@/lib/google-calendar';

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
    const calendarIds = searchParams.get('calendarIds'); // comma-separated, optional

    if (!timeMin || !timeMax) {
      return NextResponse.json({ error: 'timeMin and timeMax are required' }, { status: 400 });
    }

    const { data: tokenRaw, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .single();

    const tokenData = tokenRaw as { access_token: string; refresh_token: string } | null;

    if (tokenError || !tokenData?.access_token) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 404 });
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // Fetch from requested calendars or all calendars
    let targetCalendarIds: string[];
    if (calendarIds) {
      targetCalendarIds = calendarIds.split(',');
    } else {
      // Fetch all calendars and get events from all
      const calendars = await getGoogleCalendarList(accessToken, refreshToken);
      targetCalendarIds = calendars.map(c => c.id);
    }

    // Fetch events from all calendars in parallel
    const eventsByCalendar = await Promise.allSettled(
      targetCalendarIds.map(calId =>
        getGoogleCalendarEvents(accessToken, refreshToken, new Date(timeMin), new Date(timeMax), calId)
          .then(events => events.map(e => ({ ...e, _calendarId: calId })))
      )
    );

    const events = eventsByCalendar
      .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Deduplicate by event id
    const seen = new Set<string>();
    const uniqueEvents = events.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    return NextResponse.json({ events: uniqueEvents });
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
