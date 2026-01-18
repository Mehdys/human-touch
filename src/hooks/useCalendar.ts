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
        const { data, error } = await supabase.functions.invoke("create-calendar-event", {
            body: params,
        });

        if (error) {
            throw error;
        }

        return data;
    };
}
