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

    // Validate request body
    const body = await req.json();
    const { contacts, preferences, city } = body;

    // Input validation
    if (!Array.isArray(contacts)) {
      return new Response(
        JSON.stringify({ error: "Invalid input: contacts must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit number of contacts to prevent abuse
    const MAX_CONTACTS = 50;
    if (contacts.length > MAX_CONTACTS) {
      return new Response(
        JSON.stringify({ error: `Too many contacts. Maximum ${MAX_CONTACTS} allowed.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating suggestions for user:", userId, "contacts:", contacts?.length || 0);
    console.log("User preferences:", preferences);
    console.log("User city:", city);

    const contactsInfo = contacts?.map((c: any) => ({
      name: String(c.name || "").slice(0, 100),
      context: String(c.context || "").slice(0, 200),
      daysSinceMet: Number(c.daysSinceMet) || 0,
      lastCatchup: c.lastCatchup ? String(c.lastCatchup).slice(0, 30) : null,
    })) || [];

    const placeTypes = Array.isArray(preferences) && preferences.length > 0 
      ? preferences.map(p => String(p).slice(0, 50)).join(", ") 
      : "coffee shops, bars, restaurants";

    const sanitizedCity = city ? String(city).slice(0, 100) : "not specified";

    const systemPrompt = `You are a friendly assistant helping someone stay connected with people they've met. 
Your job is to suggest when and why they should catch up with specific contacts, AND recommend specific types of places to meet.

User's preferred hangout spots: ${placeTypes}
User's city/area: ${sanitizedCity}

For each contact, generate:
1. A short, warm suggestion (e.g., "Coffee to discuss the startup idea you both had")
2. An urgency level (high/medium/low) based on how long it's been
3. A friendly time suggestion (e.g., "This week", "Soon", "When you're free")
4. A place recommendation based on the user's preferences and the contact's context (e.g., "A quiet coffee shop" for business contacts, "A lively bar" for friends)

Be specific and personal based on the context provided. Keep suggestions under 60 characters.
Make the suggestions feel human and not robotic.
Match the place type to the relationship - professional contacts might prefer coffee/coworking, friends might prefer bars.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Here are the contacts I need suggestions for:\n${JSON.stringify(contactsInfo, null, 2)}\n\nPlease provide personalized catch-up suggestions with place recommendations.` 
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_suggestions",
              description: "Provide catch-up suggestions for each contact with place recommendations",
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
                        placeType: { type: "string", description: "Type of place to meet (coffee, bar, restaurant, coworking)" },
                        placeDescription: { type: "string", description: "Brief description of the ideal place, e.g. 'A quiet coffee shop with good wifi'" },
                      },
                      required: ["name", "suggestion", "urgency", "timeframe", "placeType", "placeDescription"],
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
