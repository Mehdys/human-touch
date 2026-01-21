import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, validateAuth, jsonResponse, errorResponse, withErrorHandling } from "../_shared/utils.ts";

interface CalendarEvent {
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  summary?: string;
}

interface FreeSlot {
  start: string;
  end: string;
  duration: number;
}

function findFreeSlots(events: CalendarEvent[], daysAhead = 7): FreeSlot[] {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + daysAhead);

  const freeSlots: FreeSlot[] = [];

  // Define working hours (9 AM to 9 PM)
  const workStart = 9;
  const workEnd = 21;

  // Iterate through each day
  for (let day = 0; day < daysAhead; day++) {
    const currentDay = new Date(startOfToday);
    currentDay.setDate(currentDay.getDate() + day);

    // Skip if it's today and we're past working hours
    if (day === 0 && now.getHours() >= workEnd) continue;

    const dayStart = new Date(currentDay);
    dayStart.setHours(day === 0 ? Math.max(now.getHours() + 1, workStart) : workStart, 0, 0, 0);

    const dayEnd = new Date(currentDay);
    dayEnd.setHours(workEnd, 0, 0, 0);

    // Get events for this day
    const dayEvents = events
      .filter((event) => {
        const eventStart = new Date(event.start.dateTime || event.start.date || "");
        return eventStart >= dayStart && eventStart < dayEnd;
      })
      .sort((a, b) => {
        const aStart = new Date(a.start.dateTime || a.start.date || "");
        const bStart = new Date(b.start.dateTime || b.start.date || "");
        return aStart.getTime() - bStart.getTime();
      });

    // Find gaps between events
    let currentTime = dayStart;

    for (const event of dayEvents) {
      const eventStart = new Date(event.start.dateTime || event.start.date || "");
      const eventEnd = new Date(event.end.dateTime || event.end.date || "");

      // If there's a gap before this event
      if (currentTime < eventStart) {
        const gapMinutes = (eventStart.getTime() - currentTime.getTime()) / 60000;

        // Only suggest slots of at least 60 minutes
        if (gapMinutes >= 60) {
          freeSlots.push({
            start: currentTime.toISOString(),
            end: eventStart.toISOString(),
            duration: gapMinutes,
          });
        }
      }

      currentTime = eventEnd > currentTime ? eventEnd : currentTime;
    }

    // Check for free time after last event
    if (currentTime < dayEnd) {
      const gapMinutes = (dayEnd.getTime() - currentTime.getTime()) / 60000;
      if (gapMinutes >= 60) {
        freeSlots.push({
          start: currentTime.toISOString(),
          end: dayEnd.toISOString(),
          duration: gapMinutes,
        });
      }
    }
  }

  return freeSlots;
}

serve(withErrorHandling(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Validate authentication
  const { user } = await validateAuth(req);

  // Parse request body
  const { provider_token } = await req.json();

  if (!provider_token) {
    console.warn("[get-availability] No provider token - calendar not connected");
    return jsonResponse({
      calendarConnected: false,
      freeSlots: [],
      calendarEvents: [],
      error: "Calendar not connected. Please connect your Google Calendar in Settings.",
    });
  }

  console.log(`[get-availability] Fetching calendar for user: ${user.id}`);

  // Fetch calendar events from Google
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  console.log(`[get-availability] Requesting events from ${timeMin} to ${timeMax}`);

  const calendarResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${provider_token}`,
      },
    }
  );

  console.log(`[get-availability] Calendar API response status: ${calendarResponse.status}`);

  if (!calendarResponse.ok) {
    const errorBody = await calendarResponse.text();
    console.error("[get-availability] Google Calendar API error:", {
      status: calendarResponse.status,
      statusText: calendarResponse.statusText,
      body: errorBody,
    });

    // Return user-friendly error based on status code
    if (calendarResponse.status === 401) {
      return errorResponse(
        "Calendar access expired. Please reconnect your Google Calendar in Settings.",
        401
      );
    } else if (calendarResponse.status === 403) {
      return errorResponse(
        "Calendar access denied. Please check permissions in Settings.",
        403
      );
    } else {
      return errorResponse(
        `Failed to fetch calendar events. Please try again later. (${calendarResponse.status})`,
        calendarResponse.status
      );
    }
  }

  const calendarData = await calendarResponse.json();
  const events: CalendarEvent[] = calendarData.items || [];

  console.log(`[get-availability] Found ${events.length} calendar events`);

  // Find free slots
  const freeSlots = findFreeSlots(events);

  console.log(`[get-availability] Found ${freeSlots.length} free slots`);

  return jsonResponse({
    calendarConnected: true,
    freeSlots,
    calendarEvents: events.map((e: CalendarEvent) => ({
      summary: e.summary || "Untitled Event",
      start: e.start.dateTime || e.start.date,
      end: e.end.dateTime || e.end.date,
    })),
  });
}));
