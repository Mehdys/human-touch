import { supabase } from "@/integrations/supabase/client";
import { handleError } from "./error-handler";

export interface EdgeFunctionOptions {
    functionName: string;
    body: Record<string, unknown>;
    context?: string;
    signal?: AbortSignal;
}

/**
 * Invoke an Edge Function with standardized error handling
 */
export async function invokeEdgeFunction<T>(
    options: EdgeFunctionOptions
): Promise<T> {
    const { functionName, body, context = functionName, signal } = options;

    try {
        const { data, error } = await supabase.functions.invoke(functionName, {
            body,
        });

        if (error) {
            throw error;
        }

        return data as T;
    } catch (error) {
        // Check if aborted
        if (signal?.aborted) {
            throw new Error("Request cancelled");
        }

        throw handleError(error, context, { silent: true });
    }
}

/**
 * Get current provider token (for Google Calendar)
 */
export async function getProviderToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.provider_token || null;
}

/**
 * Check if calendar is connected
 */
export async function isCalendarConnected(): Promise<boolean> {
    const token = await getProviderToken();
    return !!token;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}
