import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TimeSlot {
    start: string;
    end: string;
    duration: number;
    label?: string;
    reasoning?: string;
}

interface AvailabilityData {
    freeSlots: TimeSlot[];
    calendarConnected: boolean;
    calendarEvents?: any[];
    calendarSummary?: string;
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

            // If we have calendar events, get AI reasoning for slots
            if (functionData.calendarEvents && functionData.calendarEvents.length > 0) {
                try {
                    const { data: slotSuggestions, error: suggestError } = await supabase.functions.invoke("suggest-slots", {
                        body: {
                            calendarEvents: functionData.calendarEvents,
                            freeSlots: functionData.freeSlots,
                            contact: { name: "Contact", context: "catchup" } // Generic for now
                        }
                    });

                    if (!suggestError && slotSuggestions?.suggestions) {
                        // Map reasoning to slots
                        const slotsWithReasoning = functionData.freeSlots.map((slot: TimeSlot) => {
                            const suggestion = slotSuggestions.suggestions.find((s: any) =>
                                s.slot.includes(new Date(slot.start).toLocaleDateString())
                            );
                            return {
                                ...slot,
                                reasoning: suggestion?.reasoning
                            };
                        });

                        return {
                            freeSlots: slotsWithReasoning,
                            calendarConnected: true,
                            calendarEvents: functionData.calendarEvents,
                            calendarSummary: slotSuggestions.calendarSummary
                        };
                    }
                } catch (err) {
                    console.log("AI reasoning skipped:", err);
                }
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
