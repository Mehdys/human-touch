import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays, formatDistanceToNow } from "date-fns";

export interface Contact {
  id: string;
  name: string;
  context: string | null;
  met_at: string;
  last_catchup: string | null;
  reminder_days: number;
  is_snoozed: boolean;
  snoozed_until: string | null;
  is_done: boolean;
  created_at: string;
  linkedin_url?: string | null;
  phone?: string | null;
}

export interface FeedContact extends Contact {
  timeAgo: string;
  suggestion: string;
  daysSinceMet: number;
  placeType?: string;
  placeDescription?: string;
  placeName?: string;
  address?: string;
  googleMapsLink?: string;
}

interface UserProfile {
  city: string | null;
  preferences: string[] | null;
}

export function useDbContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, {
    suggestion: string;
    urgency: string;
    timeframe: string;
    placeType?: string;
    placeDescription?: string;
    placeName?: string;
    address?: string;
    searchQuery?: string;
  }>>({});

  const fetchContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      const [contactsResult, profileResult] = await Promise.all([
        supabase
          .from("contacts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("city, preferences")
          .eq("id", user.id)
          .maybeSingle()
      ]);

      if (contactsResult.error) throw contactsResult.error;
      setContacts(contactsResult.data || []);

      if (profileResult.data) {
        setProfile(profileResult.data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Fetch AI suggestions when contacts change
  const fetchSuggestions = useCallback(async (contactsToSuggest: Contact[]) => {
    if (contactsToSuggest.length === 0) return;

    try {
      const contactsInfo = contactsToSuggest.map((c) => ({
        name: c.name,
        context: c.context,
        daysSinceMet: differenceInDays(new Date(), new Date(c.met_at)),
        lastCatchup: c.last_catchup,
      }));

      const response = await supabase.functions.invoke("suggest-catchup", {
        body: {
          contacts: contactsInfo,
          preferences: profile?.preferences || [],
          city: profile?.city || null,
        },
      });

      if (response.error) {
        console.error("Error fetching suggestions:", response.error);
        return;
      }

      const newSuggestions: Record<string, {
        suggestion: string;
        urgency: string;
        timeframe: string;
        placeType?: string;
        placeDescription?: string;
        placeName?: string;
        address?: string;
        searchQuery?: string;
      }> = {};

      response.data?.suggestions?.forEach((s: any) => {
        const contact = contactsToSuggest.find(
          (c) => c.name.toLowerCase() === s.name?.toLowerCase()
        );
        if (contact) {
          newSuggestions[contact.id] = {
            suggestion: s.suggestion,
            urgency: s.urgency,
            timeframe: s.timeframe,
            placeType: s.placeType,
            placeDescription: s.placeDescription,
            placeName: s.placeName,
            address: s.address,
            searchQuery: s.searchQuery,
          };
        }
      });

      setSuggestions((prev) => ({ ...prev, ...newSuggestions }));
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
    }
  }, [profile]);

  // Get feed contacts (not snoozed, not done)
  const feedContacts: FeedContact[] = contacts
    .filter((c) => {
      // 1. Filter out contacts marked as "done" (dismissed/archived)
      if (c.is_done) return false;

      // 2. Filter out explicitly snoozed contacts
      if (c.is_snoozed && c.snoozed_until) {
        return new Date(c.snoozed_until) < new Date();
      }

      // 3. Filter out contacts we've caught up with recently (within reminder cycle)
      if (c.last_catchup) {
        const lastCatchupDate = new Date(c.last_catchup);
        const daysSinceLastCatchup = differenceInDays(new Date(), lastCatchupDate);
        if (daysSinceLastCatchup < (c.reminder_days || 14)) {
          return false;
        }
      }

      return !c.is_snoozed;
    })
    .map((c) => {
      let daysSinceMet = 0;
      let timeAgo = "recently";

      try {
        if (c.met_at) {
          const metDate = new Date(c.met_at);
          // Check if date is valid
          if (!isNaN(metDate.getTime())) {
            daysSinceMet = differenceInDays(new Date(), metDate);
            timeAgo = `Met ${formatDistanceToNow(metDate, { addSuffix: true })}`;
          } else {
            console.warn(`Invalid met_at date for contact ${c.id}: ${c.met_at}`);
          }
        }
      } catch (e) {
        console.warn(`Error parsing date for contact ${c.id}`, e);
      }

      const aiSuggestion = suggestions[c.id];

      // Default suggestion based on context
      const defaultSuggestion = c.context
        ? `Catch up about ${c.context.toLowerCase()}`
        : "Time to reconnect!";

      let googleMapsLink = undefined;
      if (aiSuggestion?.searchQuery) {
        const query = encodeURIComponent(aiSuggestion.searchQuery);
        googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${query}`;
      } else if (aiSuggestion?.placeName) {
        const city = profile?.city ? ` ${profile.city}` : "";
        const query = encodeURIComponent(`${aiSuggestion.placeName}${city}`);
        googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${query}`;
      }

      return {
        ...c,
        timeAgo,
        suggestion: aiSuggestion?.suggestion || defaultSuggestion,
        daysSinceMet,
        placeType: aiSuggestion?.placeType,
        placeDescription: aiSuggestion?.placeDescription,
        placeName: aiSuggestion?.placeName,
        address: aiSuggestion?.address,
        googleMapsLink,
      };
    });

  // Fetch suggestions when feed contacts are available
  useEffect(() => {
    const contactsNeedingSuggestions = feedContacts.filter(
      (c) => !suggestions[c.id]
    );
    if (contactsNeedingSuggestions.length > 0 && !loading) {
      fetchSuggestions(contactsNeedingSuggestions);
    }
  }, [contacts, loading, profile]);

  const addContact = async (name: string, context?: string, linkedinUrl?: string, phone?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          name,
          context: context || null,
          linkedin_url: linkedinUrl || null,
          phone: phone || null,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchContacts();
      return data;
    } catch (error) {
      console.error("Error adding contact:", error);
      return null;
    }
  };

  const snoozeContact = async (id: string, days: number = 7) => {
    if (!user) return;

    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + days);

    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          is_snoozed: true,
          snoozed_until: snoozedUntil.toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      await fetchContacts();
    } catch (error) {
      console.error("Error snoozing contact:", error);
    }
  };

  const markAsCaughtUp = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          last_catchup: new Date().toISOString(),
          is_snoozed: false,
          snoozed_until: null,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      await fetchContacts();
    } catch (error) {
      console.error("Error marking as caught up:", error);
    }
  };

  const deleteContact = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      await fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  return {
    contacts,
    feedContacts,
    loading,
    profile,
    addContact,
    snoozeContact,
    markAsCaughtUp,
    deleteContact,
    refetch: fetchContacts,
  };
}
