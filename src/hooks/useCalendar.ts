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
                return {
                    freeSlots: [],
                    calendarConnected: false,
                };
            }

            const { data: functionData, error } = await supabase.functions.invoke("get-availability", {
                headers: {
                    Authorization: `Bearer ${data.session.access_token}`,
                },
                body: { provider_token: data.session.provider_token }
            });

            if (error) {
                console.error("Error fetching availability:", error);
                return {
                    freeSlots: [],
                    calendarConnected: false,
                };
            }

            return functionData as AvailabilityData;
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
