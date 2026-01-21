import APIClient from "./api-client";

export interface Event {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    location: string | null;
    event_date: string;
    created_at: string;
}

export interface CreateEventParams {
    name: string;
    description?: string;
    location?: string;
    eventDate: string;
}

class EventsService extends APIClient {
    /**
     * Get all events for current user
     */
    async getEvents(): Promise<Event[]> {
        const user = await this.getCurrentUser();

        const { data, error } = await this.db()("events")
            .select("*")
            .eq("user_id", user.id)
            .order("event_date", { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Create a new event
     */
    async createEvent(params: CreateEventParams): Promise<Event> {
        const user = await this.getCurrentUser();

        const { data, error } = await this.db()("events")
            .insert({
                user_id: user.id,
                name: params.name,
                description: params.description || null,
                location: params.location || null,
                event_date: params.eventDate,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete an event
     */
    async deleteEvent(id: string): Promise<void> {
        const user = await this.getCurrentUser();

        const { error } = await this.db()("events")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) throw error;
    }
}

// Export singleton instance
export const eventsService = new EventsService();
