import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays, differenceInHours, formatDistanceToNow } from "date-fns";

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
  event_id?: string | null;
  followed_up_at?: string | null;
}

export interface FeedContact extends Contact {
  timeAgo: string;
  suggestion: string;
  daysSinceMet: number;
  hoursSinceMet: number;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  urgencyMessage: string;
  placeType?: string;
  placeDescription?: string;
}

interface UserProfile {
  city: string | null;
  preferences: string[] | null;
}

// Calculate urgency based on time since meeting
function getUrgency(hoursSinceMet: number): { level: FeedContact['urgencyLevel']; message: string } {
  if (hoursSinceMet <= 24) {
    return { level: 'critical', message: 'Follow up now — connection is fresh' };
  } else if (hoursSinceMet <= 48) {
    return { level: 'high', message: 'Best moment to reach out' };
  } else if (hoursSinceMet <= 72) {
    return { level: 'medium', message: 'Still a great time to connect' };
  } else {
    return { level: 'low', message: 'Time to reconnect' };
  }
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
          .eq("user_id", user.id)
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
          };
        }
      });

      setSuggestions((prev) => ({ ...prev, ...newSuggestions }));
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
    }
  }, [profile]);

  // Get feed contacts - prioritized by urgency (recency)
  const feedContacts: FeedContact[] = contacts
    .filter((c) => {
      // Only show contacts not yet followed up
      if (c.followed_up_at) return false;
      if (c.is_done) return false;
      if (c.is_snoozed && c.snoozed_until) {
        return new Date(c.snoozed_until) < new Date();
      }
      return !c.is_snoozed;
    })
    .map((c) => {
      const now = new Date();
      const metAt = new Date(c.met_at);
      const daysSinceMet = differenceInDays(now, metAt);
      const hoursSinceMet = differenceInHours(now, metAt);
      const timeAgo = formatDistanceToNow(metAt, { addSuffix: true });
      const aiSuggestion = suggestions[c.id];
      const { level: urgencyLevel, message: urgencyMessage } = getUrgency(hoursSinceMet);
      
      // Default suggestion based on context
      const defaultSuggestion = c.context
        ? `Catch up about ${c.context.toLowerCase()}`
        : "Time to reconnect!";

      return {
        ...c,
        timeAgo: `Met ${timeAgo}`,
        suggestion: aiSuggestion?.suggestion || defaultSuggestion,
        daysSinceMet,
        hoursSinceMet,
        urgencyLevel,
        urgencyMessage,
        placeType: aiSuggestion?.placeType,
        placeDescription: aiSuggestion?.placeDescription,
      };
    })
    // Sort by urgency (most recent first - lower hoursSinceMet = higher priority)
    .sort((a, b) => a.hoursSinceMet - b.hoursSinceMet);

  // Fetch suggestions when feed contacts are available
  useEffect(() => {
    const contactsNeedingSuggestions = feedContacts.filter(
      (c) => !suggestions[c.id]
    );
    if (contactsNeedingSuggestions.length > 0 && !loading) {
      fetchSuggestions(contactsNeedingSuggestions);
    }
  }, [contacts, loading, profile]);

  const addContact = async (name: string, context?: string, linkedinUrl?: string, phone?: string, eventId?: string) => {
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
          event_id: eventId || null,
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
          followed_up_at: new Date().toISOString(),
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

  // Analytics: Get follow-up rate within 72 hours
  const getFollowUpAnalytics = () => {
    const now = new Date();
    const contactsWithEvents = contacts.filter(c => c.event_id);
    
    const followedUpIn72h = contactsWithEvents.filter(c => {
      if (!c.followed_up_at) return false;
      const metAt = new Date(c.met_at);
      const followedAt = new Date(c.followed_up_at);
      const hoursToFollowUp = differenceInHours(followedAt, metAt);
      return hoursToFollowUp <= 72;
    });

    return {
      total: contactsWithEvents.length,
      followedUp: followedUpIn72h.length,
      rate: contactsWithEvents.length > 0 
        ? Math.round((followedUpIn72h.length / contactsWithEvents.length) * 100) 
        : 0,
    };
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
    getFollowUpAnalytics,
    refetch: fetchContacts,
  };
}
