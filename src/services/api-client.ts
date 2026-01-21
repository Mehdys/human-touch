import { supabase } from "@/integrations/supabase/client";

/**
 * Base API client with common functionality
 * All services should extend this class
 */
class APIClient {
    /**
     * Invoke Edge Function with type safety
     */
    protected async invoke<TResponse, TRequest = Record<string, unknown>>(
        functionName: string,
        body: TRequest
    ): Promise<TResponse> {
        const { data, error } = await supabase.functions.invoke(functionName, {
            body,
        });

        if (error) throw error;
        return data as TResponse;
    }

    /**
     * Query database with type safety
     */
    protected get db() {
        return supabase.from.bind(supabase);
    }

    /**
     * Get current user
     */
    protected async getCurrentUser() {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        return user;
    }

    /**
     * Get current session
     */
    protected async getSession() {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("No active session");
        return session;
    }
}

export default APIClient;
