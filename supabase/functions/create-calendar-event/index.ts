import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RequestSchema = z.object({
    catchupId: z.string().uuid(),
    contactName: z.string().max(200),
    scheduledTime: z.string().datetime(),
    durationMinutes: z.number().int().min(15).max(480).default(60),
    placeName: z.string().max(200).optional(),
    message: z.string().max(1000).optional(),
});

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

        // Get user's session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return new Response(
                JSON.stringify({ error: "Invalid session" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const providerToken = session.provider_token;

        if (!providerToken) {
            return new Response(
                JSON.stringify({ error: "Calendar not connected" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse and validate request
        const body = await req.json();
        const parseResult = RequestSchema.safeParse(body);

        if (!parseResult.success) {
            return new Response(
                JSON.stringify({
                    error: "Invalid input",
                    details: parseResult.error.issues
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { catchupId, contactName, scheduledTime, durationMinutes, placeName, message } = parseResult.data;

        // Calculate end time
        const startTime = new Date(scheduledTime);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        // Create Google Calendar event
        const calendarEvent = {
            summary: `Catch up with ${contactName}`,
            description: message || `Time to reconnect with ${contactName}!`,
            start: {
                dateTime: startTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            location: placeName,
            reminders: {
                useDefault: false,
                overrides: [
                    { method: "popup", minutes: 60 },
                    { method: "popup", minutes: 15 },
                ],
            },
        };

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
            const error = await calendarResponse.text();
            console.error("Google Calendar API error:", error);
            throw new Error("Failed to create calendar event");
        }

        const createdEvent = await calendarResponse.json();
        console.log(`Created calendar event ${createdEvent.id} for user ${session.user.id}`);

        // Store sync record in database
        const { error: dbError } = await supabase
            .from("calendar_events")
            .insert({
                user_id: session.user.id,
                catchup_id: catchupId,
                google_event_id: createdEvent.id,
            });

        if (dbError) {
            console.error("Failed to store calendar sync:", dbError);
            // Don't fail the request since the calendar event was created successfully
        }

        return new Response(
            JSON.stringify({
                success: true,
                eventId: createdEvent.id,
                eventLink: createdEvent.htmlLink,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error in create-calendar-event:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Internal server error"
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
