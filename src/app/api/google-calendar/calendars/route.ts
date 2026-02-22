import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleCalendarList } from '@/lib/google-calendar';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const calendars = await getGoogleCalendarList(
      tokenData.access_token,
      tokenData.refresh_token
    );

    return NextResponse.json({ calendars });
  } catch (error) {
    console.error('Error fetching Google Calendar list:', error);
    return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
  }
}
