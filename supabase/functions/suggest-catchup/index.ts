import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("Auth validation failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    // Parse and validate request body with zod
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("Input validation failed:", parseResult.error.issues);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parseResult.error.issues.map(i => i.message) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { contacts, preferences, city } = parseResult.data;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    console.log("Generating suggestions for user:", userId, "contacts:", contacts?.length || 0);
    console.log("User preferences:", preferences);
    console.log("User city:", city);

    // Contacts are already validated by zod, just map to required format
    const contactsInfo = contacts.map((c) => ({
      name: c.name,
      context: c.context || "",
      daysSinceMet: c.daysSinceMet,
      lastCatchup: c.lastCatchup || null,
    }));

    const placeTypes = preferences && preferences.length > 0
      ? preferences.join(", ")
      : "coffee shops, bars, restaurants";

    const sanitizedCity = city || "not specified";

    const systemPrompt = `You are a friendly assistant helping someone stay connected with people they've met. 
Your job is to suggest when and why they should catch up, AND recommend a SPECIFIC, REAL place to meet in their city.

User's preferred hangout spots: ${placeTypes}
User's city/area: ${sanitizedCity}

For each contact, generate:
1. A short, warm suggestion (e.g., "Coffee to discuss the startup idea")
2. An urgency level (high/medium/low)
3. A friendly time suggestion
4. A SPECIFIC, REAL place recommendation.
   - Do NOT say "A coffee shop".
   - Say "Starbucks on Main St" or "The Grind Cafe".
   - It must be a real business name that can be found on Google Maps.
   - If you don't know the specific city, pick a famous chain or a generic name that sounds real, but prioritize real places if the city is known.

For the \`placeName\` field, provide the actual name of the business.
For the \`address\` field, provide the street name or neighborhood if known.
For the \`searchQuery\` field, provide a string to search in Google Maps (e.g., "The Grind Cafe London").`;

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
            content: `Here are the contacts I need suggestions for:\n${JSON.stringify(contactsInfo, null, 2)}\n\nPlease provide personalized catch-up suggestions with REAL place recommendations.`
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_suggestions",
              description: "Provide catch-up suggestions for each contact with real place recommendations",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Contact name" },
                        suggestion: { type: "string", description: "Short, warm catch-up suggestion under 60 chars" },
                        urgency: { type: "string", enum: ["high", "medium", "low"] },
                        timeframe: { type: "string", description: "Suggested timeframe" },
                        placeName: { type: "string", description: "Name of the specific place (e.g. 'Joe's Coffee')" },
                        address: { type: "string", description: "Address or neighborhood of the place" },
                        searchQuery: { type: "string", description: "Query to search this place on Google Maps" },
                        placeType: { type: "string", description: "Type of place (coffee, bar, etc.)" },
                        placeDescription: { type: "string", description: "Why this place is good" },
                      },
                      required: ["name", "suggestion", "urgency", "timeframe", "placeName", "searchQuery", "placeType"],
                    },
                  },
                },
                required: ["suggestions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_suggestions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received for user:", userId);

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const suggestions = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(suggestions), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback if no tool call
    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in suggest-catchup:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
