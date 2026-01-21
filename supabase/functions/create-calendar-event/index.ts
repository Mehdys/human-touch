import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { handleCors, validateAuth, jsonResponse, errorResponse, withErrorHandling } from "../_shared/utils.ts";

const RequestSchema = z.object({
    catchupId: z.string().uuid(),
    contactName: z.string().max(200),
    scheduledTime: z.string().datetime(),
    durationMinutes: z.number().int().min(15).max(480).default(60),
    placeName: z.string().max(200).optional(),
    message: z.string().max(1000).optional(),
});

serve(withErrorHandling(async (req) => {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Validate authentication
    const { user, supabase } = await validateAuth(req);

    // Get provider token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        return errorResponse("Invalid session", 401);
    }

    const providerToken = session.provider_token;

    if (!providerToken) {
        return errorResponse("Calendar not connected. Please connect your Google Calendar first.", 400);
    }

    // Parse and validate request
    const body = await req.json();
    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
        console.error("[create-calendar-event] Validation failed:", parseResult.error.issues);
        return errorResponse(
            "Invalid input: " + parseResult.error.issues.map(i => i.message).join(", "),
            400
        );
    }

    const { catchupId, contactName, scheduledTime, durationMinutes, placeName, message } = parseResult.data;

    console.log(`[create-calendar-event] Creating event for user ${user.id}: ${contactName} at ${scheduledTime}`);

    // Calculate end time
    const startTime = new Date(scheduledTime);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    // Create Google Calendar event
    const calendarEvent = {
        summary: `Catch up with ${contactName}`,
        description: message || `Catching up with ${contactName}`,
        start: {
            dateTime: startTime.toISOString(),
            timeZone: "UTC",
        },

        end: {
            dateTime: endTime.toISOString(),
            timeZone: "UTC",
        },
        ...(placeName && {
            location: placeName,
        }),
    };

    // Create event in Google Calendar
    const calendarResponse = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${providerToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(calendarEvent),
        }
    );

    if (!calendarResponse.ok) {
        const errorText = await calendarResponse.text();
        console.error("[create-calendar-event] Google Calendar API error:", errorText);
        throw new Error(`Failed to create calendar event: ${calendarResponse.status}`);
    }

    const createdEvent = await calendarResponse.json();

    console.log(`[create-calendar-event] Successfully created event: ${createdEvent.id}`);

    // Store event in database
    const { error: dbError } = await supabase
        .from("calendar_events")
        .insert({
            user_id: user.id,
            catchup_id: catchupId,
            google_event_id: createdEvent.id,
            event_link: createdEvent.htmlLink,
        });

    if (dbError) {
        console.error("[create-calendar-event] Failed to store event in DB:", dbError);
        // Don't throw - calendar event was created successfully
    }

    return jsonResponse({
        eventId: createdEvent.id,
        eventLink: createdEvent.htmlLink,
        success: true,
    });
}));
