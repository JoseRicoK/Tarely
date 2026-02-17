import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  refreshAccessToken,
} from '@/lib/google-calendar';
import { addHours } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { taskId, action } = await request.json();

    if (!taskId || !action) {
      return NextResponse.json(
        { error: 'taskId and action are required' },
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
    const refreshToken = tokenData.refresh_token;

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

    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (action === 'delete') {
      const { data: syncData } = await supabase
        .from('task_google_calendar_sync')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .single();

      if (syncData) {
        await deleteCalendarEvent(
          accessToken,
          refreshToken,
          syncData.google_event_id,
          syncData.google_calendar_id
        );

        await supabase
          .from('task_google_calendar_sync')
          .delete()
          .eq('task_id', taskId)
          .eq('user_id', user.id);
      }

      return NextResponse.json({ success: true });
    }

    if (!task.due_date) {
      return NextResponse.json(
        { error: 'Task must have a due date to sync' },
        { status: 400 }
      );
    }

    const startDateTime = new Date(task.due_date);
    const endDateTime = addHours(startDateTime, 1);

    const event = {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Madrid',
      },
    };

    const { data: existingSync } = await supabase
      .from('task_google_calendar_sync')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .single();

    if (existingSync && action === 'update') {
      const updatedEvent = await updateCalendarEvent(
        accessToken,
        refreshToken,
        existingSync.google_event_id,
        event,
        existingSync.google_calendar_id
      );

      await supabase
        .from('task_google_calendar_sync')
        .update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('task_id', taskId)
        .eq('user_id', user.id);

      return NextResponse.json({ event: updatedEvent });
    } else if (action === 'create' || action === 'update') {
      const createdEvent = await createCalendarEvent(
        accessToken,
        refreshToken,
        event
      );

      await supabase.from('task_google_calendar_sync').upsert(
        {
          task_id: taskId,
          user_id: user.id,
          google_event_id: createdEvent.id,
          google_calendar_id: 'primary',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'task_id,user_id',
        }
      );

      return NextResponse.json({ event: createdEvent });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error syncing task to Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to sync task' },
      { status: 500 }
    );
  }
}
