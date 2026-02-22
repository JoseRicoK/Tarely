import { google } from 'googleapis';
import type { GoogleCalendarEvent, GoogleFreeBusyResponse } from './types';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.readonly',
];

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export async function getCalendarClient(accessToken: string, refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function getFreeBusy(
  accessToken: string,
  refreshToken: string,
  timeMin: string,
  timeMax: string,
  calendarId = 'primary'
): Promise<GoogleFreeBusyResponse> {
  const calendar = await getCalendarClient(accessToken, refreshToken);
  
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: calendarId }],
    },
  });

  return response.data as GoogleFreeBusyResponse;
}

export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
  },
  calendarId = 'primary'
): Promise<GoogleCalendarEvent> {
  const calendar = await getCalendarClient(accessToken, refreshToken);
  
  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return response.data as GoogleCalendarEvent;
}

export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    start?: { dateTime: string; timeZone?: string };
    end?: { dateTime: string; timeZone?: string };
  },
  calendarId = 'primary'
): Promise<GoogleCalendarEvent> {
  const calendar = await getCalendarClient(accessToken, refreshToken);
  
  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: event,
  });

  return response.data as GoogleCalendarEvent;
}

export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  calendarId = 'primary'
): Promise<void> {
  const calendar = await getCalendarClient(accessToken, refreshToken);
  
  await calendar.events.delete({
    calendarId,
    eventId,
  });
}

export async function listCalendarEvents(
  accessToken: string,
  refreshToken: string,
  timeMin: string,
  timeMax: string,
  calendarId = 'primary'
): Promise<GoogleCalendarEvent[]> {
  const calendar = await getCalendarClient(accessToken, refreshToken);
  
  const response = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (response.data.items || []) as GoogleCalendarEvent[];
}

export async function getGoogleCalendarList(
  accessToken: string,
  refreshToken: string
): Promise<{ id: string; summary: string; backgroundColor: string; primary: boolean }[]> {
  const calendar = await getCalendarClient(accessToken, refreshToken);
  const response = await calendar.calendarList.list({ minAccessRole: 'reader' });
  return (response.data.items || []).map(cal => ({
    id: cal.id || 'primary',
    summary: cal.summary || 'Sin nombre',
    backgroundColor: cal.backgroundColor || '#4285f4',
    primary: !!cal.primary,
  }));
}

export async function getGoogleCalendarEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
  calendarId = 'primary'
): Promise<GoogleCalendarEvent[]> {
  const calendar = await getCalendarClient(accessToken, '');
  
  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (response.data.items || []) as GoogleCalendarEvent[];
}
