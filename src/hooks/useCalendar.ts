import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FreeSlot {
    start: string;
    end: string;
    duration: number;
}

interface AvailabilityData {
    freeSlots: FreeSlot[];
    calendarConnected: boolean;
    eventsCount?: number;
    calendarEvents?: Array<{
        summary: string;
        start: string;
        end: string;
        description?: string | null;
    }>;
}

export function useCalendarAvailability() {
    return useQuery<AvailabilityData>({
        queryKey: ["calendar", "availability"],
        queryFn: async () => {
            const { data } = await supabase.auth.getSession();

            if (!data.session?.provider_token) {
                console.warn('[useCalendar] No provider token - calendar not connected');
                return {
                    freeSlots: [],
                    calendarConnected: false,
                };
            }

            console.log('[useCalendar] Fetching calendar availability');

            const { data: functionData, error } = await supabase.functions.invoke("get-availability", {
                headers: {
                    Authorization: `Bearer ${data.session.access_token}`,
                },
                body: { provider_token: data.session.provider_token }
            });

            if (error) {
                console.error("[useCalendar] Error fetching availability:", error);

                // Show user-friendly error based on the error message
                const errorMessage = error.message || error.toString();
                if (errorMessage.includes("401") || errorMessage.includes("expired")) {
                    console.warn("[useCalendar] Calendar access expired");
                } else if (errorMessage.includes("403") || errorMessage.includes("denied")) {
                    console.warn("[useCalendar] Calendar access denied");
                } else {
                    console.warn("[useCalendar] Calendar fetch failed:", errorMessage);
                }

                return {
                    freeSlots: [],
                    calendarConnected: false,
                };
            }

            console.log('[useCalendar] Calendar data received:', {
                connected: functionData.calendarConnected,
                slotsCount: functionData.freeSlots?.length || 0,
                eventsCount: functionData.eventsCount || functionData.calendarEvents?.length || 0
            });

            return functionData as AvailabilityData;
        },
        retry: (failureCount, error) => {
            // Don't retry on auth errors
            const errorMessage = String(error);
            if (errorMessage.includes('401') || errorMessage.includes('403') ||
                errorMessage.includes('unauthorized') || errorMessage.includes('expired')) {
                console.log('[useCalendar] Not retrying auth error');
                return false;
            }
            // Retry other errors up to 2 times
            return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

export function useCreateCalendarEvent() {
    return async (params: {
        catchupId: string;
        contactName: string;
        scheduledTime: string;
        placeName?: string;
        message?: string;
        durationMinutes?: number;
    }) => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            throw new Error("No active session");
        }



        const { data, error } = await supabase.functions.invoke("create-calendar-event", {
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
            body: params,
        });

        if (error) {
            throw error;
        }

        return data;
    };
}
