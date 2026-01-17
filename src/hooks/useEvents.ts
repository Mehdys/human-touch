import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Event {
  id: string;
  user_id: string;
  name: string;
  event_date: string;
  location: string | null;
  event_type: string | null;
  created_at: string;
  updated_at: string;
}

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .order("event_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
      
      // Set most recent event as current if within 72 hours
      if (data && data.length > 0) {
        const mostRecent = data[0];
        const hoursSinceEvent = (Date.now() - new Date(mostRecent.event_date).getTime()) / (1000 * 60 * 60);
        if (hoursSinceEvent <= 72) {
          setCurrentEvent(mostRecent);
        }
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (name: string, eventDate: Date, location?: string, eventType?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("events")
        .insert({
          user_id: user.id,
          name,
          event_date: eventDate.toISOString(),
          location: location || null,
          event_type: eventType || 'networking',
        })
        .select()
        .single();

      if (error) throw error;
      await fetchEvents();
      setCurrentEvent(data);
      return data;
    } catch (error) {
      console.error("Error creating event:", error);
      return null;
    }
  };

  const getRecentEvents = () => {
    const now = new Date();
    return events.filter(e => {
      const hoursSince = (now.getTime() - new Date(e.event_date).getTime()) / (1000 * 60 * 60);
      return hoursSince <= 72;
    });
  };

  return {
    events,
    loading,
    currentEvent,
    setCurrentEvent,
    createEvent,
    getRecentEvents,
    refetch: fetchEvents,
  };
}
