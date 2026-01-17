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
}

export interface FeedContact extends Contact {
  timeAgo: string;
  suggestion: string;
  daysSinceMet: number;
}

export function useDbContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Record<string, { suggestion: string; urgency: string; timeframe: string }>>({});

  const fetchContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
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
        body: { contacts: contactsInfo },
      });

      if (response.error) {
        console.error("Error fetching suggestions:", response.error);
        return;
      }

      const newSuggestions: Record<string, { suggestion: string; urgency: string; timeframe: string }> = {};
      response.data?.suggestions?.forEach((s: any) => {
        const contact = contactsToSuggest.find(
          (c) => c.name.toLowerCase() === s.name?.toLowerCase()
        );
        if (contact) {
          newSuggestions[contact.id] = {
            suggestion: s.suggestion,
            urgency: s.urgency,
            timeframe: s.timeframe,
          };
        }
      });

      setSuggestions((prev) => ({ ...prev, ...newSuggestions }));
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
    }
  }, []);

  // Get feed contacts (not snoozed, not done)
  const feedContacts: FeedContact[] = contacts
    .filter((c) => {
      if (c.is_done) return false;
      if (c.is_snoozed && c.snoozed_until) {
        return new Date(c.snoozed_until) < new Date();
      }
      return !c.is_snoozed;
    })
    .map((c) => {
      const daysSinceMet = differenceInDays(new Date(), new Date(c.met_at));
      const timeAgo = formatDistanceToNow(new Date(c.met_at), { addSuffix: true });
      const aiSuggestion = suggestions[c.id];
      
      // Default suggestion based on context
      const defaultSuggestion = c.context
        ? `Catch up about ${c.context.toLowerCase()}`
        : "Time to reconnect!";

      return {
        ...c,
        timeAgo: `Met ${timeAgo}`,
        suggestion: aiSuggestion?.suggestion || defaultSuggestion,
        daysSinceMet,
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
  }, [contacts, loading]);

  const addContact = async (name: string, context?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          name,
          context: context || null,
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
    addContact,
    snoozeContact,
    markAsCaughtUp,
    deleteContact,
    refetch: fetchContacts,
  };
}
