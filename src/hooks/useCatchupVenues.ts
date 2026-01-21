import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface VenueSuggestion {
    placeName: string;
    address?: string;
    searchQuery: string;
    placeType: string;
    placeDescription?: string;
    googleMapsLink: string;
}

interface UseCatchupVenuesProps {
    contactName: string;
    contactContext?: string;
    userCity?: string;
    userPreferences?: string[];
}

export function useCatchupVenues({
    contactName,
    contactContext,
    userCity,
    userPreferences
}: UseCatchupVenuesProps) {
    const { user } = useAuth();
    const [venues, setVenues] = useState<VenueSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVenues = async () => {
            if (!user || !contactName) return;

            setLoading(true);
            setError(null);

            try {
                console.log(`[useCatchupVenues] Fetching venues for contact: ${contactName}`);

                // Get the current session to extract the access token
                const { data: { session } } = await supabase.auth.getSession();

                if (!session?.access_token) {
                    throw new Error("No active session. Please sign in again.");
                }

                const response = await supabase.functions.invoke("suggest-catchup", {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: {
                        contacts: [{
                            name: contactName,
                            context: contactContext || "",
                            daysSinceMet: 14,
                            lastCatchup: null,
                        }],
                        preferences: userPreferences || ["coffee shops", "restaurants", "bars"],
                        city: userCity || null,
                    },
                });

                if (response.error) {
                    console.error("[useCatchupVenues] Edge Function error:", response.error);

                    // Try to extract more specific error message
                    const errorMessage = response.error.message || "Edge Function failed";

                    // Check for specific error types to provide better user feedback
                    if (errorMessage.includes("GEMINI_API_KEY")) {
                        throw new Error("AI service not configured. Please contact support.");
                    } else if (errorMessage.includes("auth") || errorMessage.includes("authorization")) {
                        throw new Error("Authentication failed. Please sign in again.");
                    } else if (errorMessage.includes("rate limit")) {
                        throw new Error("Service is busy. Please try again in a moment.");
                    } else {
                        throw new Error(`Failed to fetch suggestions: ${errorMessage}`);
                    }
                }

                if (response.data?.suggestions && response.data.suggestions.length > 0) {
                    const suggestion = response.data.suggestions[0];

                    // Extract venue suggestions from the AI response
                    // The AI might suggest multiple venues, let's create variations
                    const venueList: VenueSuggestion[] = [];

                    if (suggestion.placeName) {
                        const googleMapsLink = suggestion.searchQuery
                            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suggestion.searchQuery)}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${suggestion.placeName} ${userCity || ""}`)}`;

                        venueList.push({
                            placeName: suggestion.placeName,
                            address: suggestion.address,
                            searchQuery: suggestion.searchQuery || `${suggestion.placeName} ${userCity || ""}`,
                            placeType: suggestion.placeType || "cafe",
                            placeDescription: suggestion.placeDescription,
                            googleMapsLink,
                        });
                    }

                    setVenues(venueList);
                }
            } catch (err) {
                console.error("[useCatchupVenues] Error fetching venues:", err);

                // Provide detailed error information for debugging
                if (err instanceof Error) {
                    console.error("[useCatchupVenues] Error details:", {
                        message: err.message,
                        stack: err.stack,
                        name: err.name
                    });
                }

                // Set user-friendly error message
                const errorMessage = err instanceof Error
                    ? err.message
                    : "Failed to fetch venue suggestions. Please try again.";

                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchVenues();
    }, [user, contactName, contactContext, userCity, userPreferences]);

    return { venues, loading, error };
}
