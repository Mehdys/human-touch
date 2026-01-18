import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarEvent {
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
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

    // Add remaining time in the day if available
    if (currentTime < dayEnd) {
      const remainingMinutes = (dayEnd.getTime() - currentTime.getTime()) / 60000;
      if (remainingMinutes >= 60) {
        freeSlots.push({
          start: currentTime.toISOString(),
          end: dayEnd.toISOString(),
          duration: remainingMinutes,
        });
      }
    }
  }

  // Return top 5 slots
  return freeSlots.slice(0, 5);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from Auth header to verify identity
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get provider_token from request body
    const { provider_token } = await req.json();

    if (!provider_token) {
      return new Response(
        JSON.stringify({
          error: "Calendar not connected (no token provided)",
          calendarConnected: false
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /*
    const providerToken = session.provider_token;

    if (!providerToken) {
      return new Response(
        JSON.stringify({ 
          error: "Calendar not connected",
          calendarConnected: false 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    */

    // Fetch calendar events from Google
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${now.toISOString()}&` +
      `timeMax=${weekFromNow.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${provider_token}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      const error = await calendarResponse.text();
      console.error("Google Calendar API error:", error);

      return new Response(
        JSON.stringify({
          error: "Failed to fetch calendar",
          calendarConnected: false
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calendarData = await calendarResponse.json();
    const events = calendarData.items || [];

    console.log(`Found ${events.length} events for user ${user.id}`);

    // Format events for AI analysis
    const formattedEvents = events.map((event: any) => ({
      summary: event.summary || "Busy",
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      description: event.description || null
    }));

    // Find free slots
    const freeSlots = findFreeSlots(events);

    return new Response(
      JSON.stringify({
        freeSlots,
        calendarConnected: true,
        eventsCount: events.length,
        calendarEvents: formattedEvents
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in get-availability:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
