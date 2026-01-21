import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { handleCors, validateAuth, callGeminiAPI, jsonResponse, errorResponse, withErrorHandling } from "../_shared/utils.ts";
import { fetchCalendarEvents } from "../_shared/calendarUtils.ts";

// Input validation schema
const ContactSchema = z.object({
  name: z.string().max(100).default(""),
  context: z.string().max(500).nullable().optional(),
  daysSinceMet: z.number().int().min(0).max(36500).default(0),
  lastCatchup: z.string().max(30).nullable().optional(),
});

const RequestSchema = z.object({
  contacts: z.array(ContactSchema).max(50),
  preferences: z.array(z.string().max(50)).max(20).optional(),
  city: z.string().max(100).nullable().optional(),
  provider_token: z.string().optional().nullable(),
});

serve(withErrorHandling(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Validate authentication
  const { user } = await validateAuth(req);

  // Parse and validate request body with zod
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parseResult = RequestSchema.safeParse(body);
  if (!parseResult.success) {
    console.error("[suggest-catchup] Input validation failed:", parseResult.error.issues);
    return errorResponse(
      "Invalid input: " + parseResult.error.issues.map(i => i.message).join(", "),
      400
    );
  }

  const { contacts, preferences, city, provider_token } = parseResult.data;

  console.log(`[suggest-catchup] Generating suggestions for user: ${user.id}, contacts: ${contacts?.length || 0}`);

  // Fetch calendar events if user has connected their calendar
  let calendarContext = "";
  let busySlots: Array<{ start: string; end: string }> = [];

  if (provider_token) {
    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      console.log('[suggest-catchup] Fetching calendar events...');
      const { events, busySlots: fetchedBusySlots } = await fetchCalendarEvents(
        provider_token,
        timeMin,
        timeMax
      );

      busySlots = fetchedBusySlots;
      console.log(`[suggest-catchup] Fetched ${events.length} calendar events`);

      // Create context for AI about user's schedule
      calendarContext = `\n\nThe user's calendar for the next 7 days:\n`;
      if (events.length === 0) {
        calendarContext += "- No events scheduled (fairly open calendar)\n";
      } else {
        const eventSummaries = events
          .filter(e => e.status !== 'cancelled')
          .slice(0, 10)  // Limit to first 10 events
          .map(e => {
            const start = e.start.dateTime || e.start.date || '';
            const time = new Date(start).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            return `- ${time}: ${e.summary || 'Untitled'}`;
          });
        calendarContext += eventSummaries.join('\n') + '\n';
        calendarContext += `\nBased on this schedule, suggest times that don't conflict with existing commitments. Consider suggesting times during their free periods.`;
      }
    } catch (error) {
      console.error('[suggest-catchup] Failed to fetch calendar:', error);
      // Continue without calendar context
    }
  }

  // Contacts are already validated by zod, just map to required format
  const contactsInfo = contacts.map((c) => ({
    name: c.name,
    context: c.context || "",
    daysSinceMet: c.daysSinceMet,
    lastCatchup: c.lastCatchup || null,
  }));

  const placeTypes = preferences && preferences.length > 0
    ? preferences.join(", ")
    : "cafés, restaurants, bars, parks for walks";

  const locationContext = city ? `in ${city}` : "in the user's area";

  // System prompt
  const systemPrompt = `You are a helpful AI assistant specialized in suggesting personalized catchup activities for people based on their relationships.

Your task is to analyze each contact relationship and suggest:
1. A creative, warm reason or suggestion for catching up
2. The urgency level (how soon they should reconnect)
3. A timeframe suggestion (e.g., "this week", "next weekend")
4. A specific place name and type (${placeTypes}) ${locationContext}

Be warm, personal, and consider:
- How long it's been since they last met
- The context of their relationship
- Create real, plausible place names that sound authentic
- Provide practical details (address, description)

Make each suggestion feel thoughtful and tailored to the relationship.`;

  const contactsList = contactsInfo.map((c) =>
    `${c.name} (${c.context || 'no context'}) - met ${c.daysSinceMet} days ago, last catchup: ${c.lastCatchup || 'never'}`
  ).join('\n');

  const userPrompt = `Please suggest catchup activities for these contacts:\n\n${contactsList}\n\nUser preferences: ${placeTypes}\nLocation: ${locationContext}${calendarContext}`;

  // Tool definition for Gemini
  const toolDefinition = {
    name: "suggest_catchups",
    description: "Suggest personalized catchup activities for contacts",
    parameters: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The contact's name"
              },
              suggestion: {
                type: "string",
                description: "A warm, personal reason or suggestion for catching up (2-3 sentences)"
              },
              urgency: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "How soon they should reconnect based on relationship context"
              },
              timeframe: {
                type: "string",
                description: "Suggested timeframe (e.g., 'this week', 'next weekend', 'this month')"
              },
              placeName: {
                type: "string",
                description: "A real-sounding, specific place name (e.g., 'Café Lumière', 'The Garden Bistro')"
              },
              address: {
                type: "string",
                description: "A plausible address for the venue"
              },
              searchQuery: {
                type: "string",
                description: "Google Maps search query to find similar places"
              },
              placeType: {
                type: "string",
                enum: ["cafe", "restaurant", "bar", "walk"],
                description: "Type of venue suggested"
              },
              placeDescription: {
                type: "string",
                description: "Brief description of why this place suits the catchup (1 sentence)"
              }
            },
            required: ["name", "suggestion", "urgency", "timeframe", "placeName", "placeType"]
          }
        }
      },
      required: ["suggestions"]
    }
  };

  // Call Gemini API using shared utility
  const result = await callGeminiAPI(userPrompt, toolDefinition, systemPrompt);

  // Return suggestions
  return jsonResponse({ suggestions: result.suggestions || [] });
}));
