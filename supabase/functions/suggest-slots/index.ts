import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: "Invalid user" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { calendarEvents, freeSlots, contact } = await req.json();

        if (!calendarEvents || !freeSlots || !contact) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

        if (!LOVABLE_API_KEY) {
            throw new Error("LOVABLE_API_KEY is not configured");
        }

        const now = new Date();
        const upcomingEvents = calendarEvents
            .filter((e: any) => new Date(e.start) > now)
            .slice(0, 10);

        const eventsContext = upcomingEvents.length > 0
            ? upcomingEvents.map((e: any) =>
                `- ${new Date(e.start).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}: ${e.summary}`
            ).join('\n')
            : "No upcoming events";

        const slotsContext = freeSlots.map((slot: any) =>
            `- ${slot.label || slot.start}`
        ).join('\n');

        const systemPrompt = `You are a scheduling assistant analyzing a user's calendar to suggest optimal catchup times.

CALENDAR CONTEXT:
${eventsContext}

AVAILABLE FREE SLOTS:
${slotsContext}

TASK:
1. First, write a SHORT conversational summary (1-2 sentences) about what you see in their calendar this week. Be friendly and specific.
2. Then suggest 3-5 optimal time slots with personalized reasoning.

For the summary, examples:
- "I see you have a Team Meeting on Monday and Dinner on Tuesday. Here's when I think works best:"
- "Your week looks pretty open! Here are some great times to catch up:"
- "You've got a busy week with meetings on Monday and Wednesday. I found some perfect gaps:"

For each slot suggestion, provide:
1. The slot (must be from the available free slots)
2. Contextual reasoning (reference actual events, timing, work-life balance)

Be warm, human, and specific about actual calendar events when possible.`;

        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
            method: "POST",
            headers: {
                "x-goog-api-key": GEMINI_API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `Suggest optimal times to catch up with ${contact.name} (context: ${contact.context || 'general catchup'})`
                    },
                ],
                tools: [
                    {
                        type: "function",
                        function: {
                            name: "suggest_time_slots",
                            description: "Suggest optimal time slots with reasoning",
                            parameters: {
                                type: "object",
                                properties: {
                                    calendarSummary: {
                                        type: "string",
                                        description: "A friendly 1-2 sentence summary of what you see in their calendar this week"
                                    },
                                    suggestions: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                slot: { type: "string", description: "The suggested time slot" },
                                                reasoning: { type: "string", description: "Why this slot is optimal" },
                                            },
                                            required: ["slot", "reasoning"],
                                        },
                                    },
                                },
                                required: ["calendarSummary", "suggestions"],
                            },
                        },
                    },
                ],
                tool_choice: { type: "function", function: { name: "suggest_time_slots" } },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("AI gateway error:", response.status, errorText);
            throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

        if (toolCall?.function?.arguments) {
            const result = JSON.parse(toolCall.function.arguments);
            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ suggestions: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error in suggest-slots:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
