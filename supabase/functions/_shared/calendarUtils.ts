/**
 * Google Calendar utilities for Supabase Edge Functions
 * Adapted from text-to-calendar-ai project
 */

export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
    status: string;
}

export interface CalendarListResult {
    events: CalendarEvent[];
    busySlots: Array<{ start: string; end: string }>;
}

/**
 * Fetch calendar events from Google Calendar API
 * @param accessToken - OAuth2 access token for the user
 * @param timeMin - Start time for events query (ISO 8601)
 * @param timeMax - End time for events query (ISO 8601)
 * @param calendarId - Calendar ID (default: 'primary')
 * @returns List of calendar events and busy slots
 */
export async function fetchCalendarEvents(
    accessToken: string,
    timeMin: string,
    timeMax: string,
    calendarId: string = 'primary'
): Promise<CalendarListResult> {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', timeMax);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google Calendar API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const events: CalendarEvent[] = data.items || [];

    // Extract busy slots from events
    const busySlots = events
        .filter(event => event.status !== 'cancelled' && (event.start?.dateTime || event.start?.date))
        .map(event => ({
            start: event.start.dateTime || event.start.date || '',
            end: event.end.dateTime || event.end.date || '',
        }));

    return { events, busySlots };
}

/**
 * Create a calendar event using Google Calendar API
 * @param accessToken - OAuth2 access token for the user
 * @param summary - Event title
 * @param description - Event description
 * @param startDateTime - ISO 8601 formatted start time
 * @param endDateTime - ISO 8601 formatted end time
 * @param calendarId - Calendar ID (default: 'primary')
 * @returns Created event data
 */
export async function createCalendarEvent({
    accessToken,
    summary,
    description,
    startDateTime,
    endDateTime,
    calendarId = 'primary',
}: {
    accessToken: string;
    summary: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    calendarId?: string;
}): Promise<{ success: boolean; eventId: string; eventLink: string }> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            summary,
            description: description || summary,
            start: { dateTime: startDateTime },
            end: { dateTime: endDateTime },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create calendar event: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
        success: true,
        eventId: data.id,
        eventLink: data.htmlLink,
    };
}

/**
 * Check if a user has granted calendar access
 * @param accessToken - OAuth2 access token
 * @returns true if calendar access is available
 */
export async function hasCalendarAccess(accessToken: string): Promise<boolean> {
    try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        });
        return response.ok;
    } catch {
        return false;
    }
}
