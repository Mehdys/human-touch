import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// CORS Utilities
// ============================================================================

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Handle CORS preflight requests
 * Returns a Response if it's an OPTIONS request, null otherwise
 */
export function handleCors(req: Request): Response | null {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    return null;
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

/**
 * Create an error response with CORS headers
 */
export function errorResponse(message: string, status = 500): Response {
    return jsonResponse({ error: message }, status);
}

// ============================================================================
// Authentication Utilities
// ============================================================================

export interface AuthResult {
    user: {
        id: string;
        email?: string;
    };
    supabase: ReturnType<typeof createClient>;
}

/**
 * Validate authentication and return user + supabase client
 * Throws an error if authentication fails
 */
export async function validateAuth(req: Request): Promise<AuthResult> {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
        throw new Error("Missing authorization header");
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error("Auth error:", error);
        throw new Error(`Authentication failed: ${error.message}`);
    }

    if (!user) {
        throw new Error("No user found in session");
    }

    console.log(`[Auth] User authenticated: ${user.id}`);
    return { user, supabase };
}

// ============================================================================
// AI API Utilities (Featherless AI)
// ============================================================================

/**
 * Call AI API using Featherless AI (DeepSeek V3)
 * Uses OpenAI-compatible API format with JSON mode
 */
export async function callGeminiAPI(
    prompt: string,
    toolDefinition: {
        name: string;
        description: string;
        parameters: any;
    },
    systemPrompt?: string
): Promise<any> {
    const FEATHERLESS_API_KEY = Deno.env.get("FEATHERLESS_API_KEY");
    if (!FEATHERLESS_API_KEY) {
        console.error("[AI API] CRITICAL: FEATHERLESS_API_KEY environment variable is not set!");
        console.error("[AI API] Please configure it in Supabase dashboard: Edge Functions > Secrets");
        throw new Error("FEATHERLESS_API_KEY not configured in Edge Function secrets. Please add it in Supabase dashboard.");
    }

    // Model: deepseek-ai/DeepSeek-V3-0324 (as requested)
    const model = "deepseek-ai/DeepSeek-V3-0324";
    const url = "https://api.featherless.ai/v1/chat/completions";

    console.log(`[AI API] Making request to Featherless AI (${model})`);

    // Build messages array
    const messages: any[] = [];

    if (systemPrompt) {
        messages.push({
            role: "system",
            content: systemPrompt
        });
    }

    // Add instruction to ensure JSON output
    messages.push({
        role: "user",
        content: `${prompt}\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(toolDefinition.parameters, null, 2)}`
    });

    let response;
    try {
        response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${FEATHERLESS_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                response_format: { type: "json_object" }, // Enforce JSON mode
                temperature: 0.3,
                max_tokens: 2000
            }),
        });
    } catch (fetchError) {
        console.error("[AI API] Network error:", fetchError);
        throw new Error(`Failed to connect to Featherless AI: ${fetchError instanceof Error ? fetchError.message : 'Unknown network error'}`);
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI API] HTTP ${response.status} error:`, errorText);

        if (response.status === 401 || response.status === 403) {
            throw new Error(`Featherless AI authentication failed (${response.status}). Please verify your FEATHERLESS_API_KEY.`);
        } else if (response.status === 429) {
            throw new Error("Featherless AI rate limit exceeded. Please try again later.");
        } else {
            throw new Error(`Featherless AI error (${response.status}): ${errorText.substring(0, 200)}`);
        }
    }

    const data = await response.json();
    console.log(`[AI API] Received response from Featherless AI`);

    let textContent = data.choices?.[0]?.message?.content;

    if (!textContent) {
        console.error("[AI API] Invalid response structure. Full response:", JSON.stringify(data, null, 2));
        throw new Error("Invalid AI API response: no content found");
    }

    // Clean up markdown code blocks if present
    textContent = textContent.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        const parsedResult = JSON.parse(textContent);
        console.log(`[AI API] Successfully parsed JSON response`);
        return parsedResult;
    } catch (parseError) {
        console.error("[AI API] Failed to parse JSON response:", textContent);
        throw new Error(`Failed to parse AI API JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Wrap an async handler with error handling
 */
export function withErrorHandling(
    handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
    return async (req: Request) => {
        try {
            return await handler(req);
        } catch (error) {
            console.error("[Error]", error);

            const message = error instanceof Error ? error.message : "Internal server error";

            // Determine status code based on error message
            let status = 500;
            if (message.includes("auth") || message.includes("authorization")) {
                status = 401;
            } else if (message.includes("Invalid") || message.includes("validation")) {
                status = 400;
            } else if (message.includes("not found")) {
                status = 404;
            }

            return errorResponse(message, status);
        }
    };
}
