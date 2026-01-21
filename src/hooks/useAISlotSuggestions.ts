import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCalendarAvailability } from "./useCalendar";
import { handleError } from "@/lib/error-handler";

interface SlotSuggestion {
    slot: string;
    beforeEvent: string;
    afterEvent: string;
    reasoning: string;
}

interface SuggestSlotsResponse {
    calendarSummary: string;
    suggestions: SlotSuggestion[];
}

export function useAISlotSuggestions(contactName: string, contactContext?: string) {
    const { user } = useAuth();
    const { data: calendarData, isLoading: loadingCalendar } = useCalendarAvailability();
    const [suggestions, setSuggestions] = useState<SuggestSlotsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSuggestions = async (staticSlots?: Array<{ id: string; label: string; time: string }>) => {
        if (!user || !calendarData?.calendarConnected || !contactName) {
            if (!contactName) {
                console.warn("[useAISlotSuggestions] No contact name provided, skipping AI suggestions");
            }
            return;
        }

        // Can use either calendar slots or static slots
        const hasCalendarSlots = calendarData?.calendarConnected && calendarData.freeSlots.length > 0;
        const hasStaticSlots = staticSlots && staticSlots.length > 0;

        if (!hasCalendarSlots && !hasStaticSlots) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get the current session to extract the access token
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                throw new Error("No active session. Please sign in again.");
            }

            const response = await supabase.functions.invoke("suggest-slots", {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: {
                    calendarEvents: calendarData?.calendarEvents || [],
                    freeSlots: hasCalendarSlots
                        ? calendarData!.freeSlots.map(slot => ({
                            start: slot.start,
                            end: slot.end,
                            label: new Date(slot.start).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                            })
                        }))
                        : staticSlots!.map(slot => ({
                            start: new Date().toISOString(),
                            end: new Date(Date.now() + 3600000).toISOString(),
                            label: `${slot.label} ${slot.time}`
                        })),
                    contact: {
                        name: contactName,
                        context: contactContext || ""
                    }
                },
            });

            if (response.error) {
                throw response.error;
            }

            setSuggestions(response.data);
        } catch (err) {
            const appError = handleError(err, "useAISlotSuggestions", {
                customMessage: "Failed to load time suggestions",
                onRetry: () => fetchSuggestions(staticSlots),
            });
            setError(appError.userMessage);
        } finally {
            setLoading(false);
        }
    };

    return {
        suggestions,
        loading: loading || loadingCalendar,
        error,
        fetchSuggestions,
        hasCalendar: calendarData?.calendarConnected || false
    };
}
