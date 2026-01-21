import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, validateAuth, callGeminiAPI, jsonResponse, errorResponse, withErrorHandling } from "../_shared/utils.ts";

serve(withErrorHandling(async (req) => {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // Validate authentication
    const { user } = await validateAuth(req);

    // Parse and validate request body
    const { calendarEvents = [], freeSlots, contact } = await req.json();

    if (!freeSlots || !contact) {
        return errorResponse("Missing required fields: freeSlots and contact", 400);
    }

    // Process calendar data
    const now = new Date();
    const upcomingEvents = calendarEvents
        .filter((e: any) => new Date(e.start) > now)
        .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Helper function to find surrounding events for a slot
    const findSurroundingEvents = (slot: any) => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);

        // Find event immediately before this slot
        const eventsBefore = upcomingEvents.filter((e: any) =>
            new Date(e.end) <= slotStart
        );
        const beforeEvent = eventsBefore.length > 0 ? eventsBefore[eventsBefore.length - 1] : null;

        // Find event immediately after this slot
        const afterEvent = upcomingEvents.find((e: any) =>
            new Date(e.start) >= slotEnd
        );

        return { beforeEvent, afterEvent };
    };

    // Enhance slots with surrounding context
    const slotsWithContext = freeSlots.map((slot: any) => {
        const { beforeEvent, afterEvent } = findSurroundingEvents(slot);
        return {
            ...slot,
            beforeEvent: beforeEvent ? {
                summary: beforeEvent.summary,
                time: new Date(beforeEvent.start).toLocaleString('en-US', {
                    weekday: 'short', hour: 'numeric', minute: '2-digit'
                })
            } : null,
            afterEvent: afterEvent ? {
                summary: afterEvent.summary,
                time: new Date(afterEvent.start).toLocaleString('en-US', {
                    weekday: 'short', hour: 'numeric', minute: '2-digit'
                })
            } : null,
        };
    });

    // Build system prompt
    const systemPrompt = `You are a friendly AI scheduling assistant helping someone plan a catchup with ${contact.name}.

Your MAIN mission: Greet the user warmly and provide rich, contextual reasoning for why each suggested time slot is great for catching up.

Key principles:
1. START with a personalized greeting: "Hey [FirstName]! 👋"
2. Give a brief, warm summary of their upcoming week (2-3 key events max)
3. For each time slot, provide RICH contextual reasoning that considers:
   - Time of day energy (morning fresh energy vs evening chill vibes)
   - Flow of their day (post-meeting relief, pre-event motivation, etc.)
   - Practical aspects (morning coffee, lunch break, after-work drinks, etc.)
   - Relationship to surrounding events
4. Be casual, friendly, and conversational
5. Think like a thoughtful friend who knows their schedule

Focus on making each time slot feel like a perfect, intentional choice - not just "you're free then."`;

    // Build user prompt
    const contactName = contact.name || "your friend";
    const userFirstName = user.email?.split('@')[0] || "there";

    const slotDescriptions = slotsWithContext.map((slot: any, i: number) => {
        const timeLabel = slot.label || new Date(slot.start).toLocaleString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        const beforeInfo = slot.beforeEvent
            ? `After: ${slot.beforeEvent.summary} (${slot.beforeEvent.time})`
            : "After: Start of day";

        const afterInfo = slot.afterEvent
            ? `Before: ${slot.afterEvent.summary} (${slot.afterEvent.time})`
            : "Before: End of day";

        return `Slot ${i + 1}: ${timeLabel}\n  ${beforeInfo}\n  ${afterInfo}`;
    }).join('\n\n');

    const userPrompt = `Context: Planning a catchup with ${contactName} (${contact.context || 'general meetup'})

Available Time Slots:
${slotDescriptions}

Please provide:
1. A warm greeting to ${userFirstName} with a summary of their week
2. For each slot, explain why it's a great time to catch up, considering:
   - The vibe/energy of that time of day
   - What they're coming from and going to
   - Practical catchup options (coffee, lunch, drinks, walk, etc.)
   - The flow and rhythm of their day

Make it feel personalized and thoughtful!`;

    // Tool definition for Gemini
    const toolDefinition = {
        name: "suggest_time_slots",
        description: "Suggest optimal time slots with rich reasoning",
        parameters: {
            type: "object",
            properties: {
                calendarSummary: {
                    type: "string",
                    description: "Start with 'Hey [FirstName]! 👋' then give a brief, warm summary highlighting customer's 2-3 most important upcoming events this week (e.g., 'Hey Alex! 👋 Looks like you've got a big presentation on Tuesday and a team offsite on Friday. Here are some great times to catch up with Sarah this week:')"
                },
                suggestions: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            slot: {
                                type: "string",
                                description: "The time slot identifier (e.g., 'Slot 1', 'Slot 2')"
                            },
                            beforeEvent: {
                                type: "string",
                                description: "What event/activity is immediately before this slot"
                            },
                            afterEvent: {
                                type: "string",
                                description: "What event/activity is immediately after this slot"
                            },
                            reasoning: {
                                type: "string",
                                description: "Rich 2-3 sentence reasoning explaining why this is a great time. Consider: time of day energy, surrounding events, catchup activity suggestions (coffee/lunch/drinks), and the natural flow of their day. Be warm and conversational."
                            },
                        },
                        required: ["slot", "beforeEvent", "afterEvent", "reasoning"],
                    },
                },
            },
            required: ["calendarSummary", "suggestions"],
        },
    };

    // Call Gemini API using shared utility
    console.log(`[suggest-slots] Calling Gemini AI for user ${user.id}`);
    console.log(`[suggest-slots] Processing ${slotsWithContext.length} slots with context`);

    const result = await callGeminiAPI(userPrompt, toolDefinition, systemPrompt);

    console.log(`[suggest-slots] Successfully generated suggestions`);

    // Return result
    return jsonResponse(result);
}));
