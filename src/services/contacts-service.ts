import APIClient from "./api-client";

export interface Contact {
    id: string;
    user_id: string;
    name: string;
    context: string | null;
    met_at: string;
    last_catchup: string | null;
    linkedin_url: string | null;
    phone: string | null;
    is_snoozed: boolean;
    snoozed_until: string | null;
    created_at: string;
}

export interface CreateContactParams {
    name: string;
    context?: string;
    linkedinUrl?: string;
    phone?: string;
}

export interface CatchupSuggestion {
    name: string;
    suggestion: string;
    urgency: "high" | "medium" | "low";
    timeframe: string;
    placeName?: string;
    address?: string;
    searchQuery?: string;
    placeType?: string;
    placeDescription?: string;
}

class ContactsService extends APIClient {
    /**
     * Fetch all contacts for current user
     */
    async getContacts(): Promise<Contact[]> {
        const user = await this.getCurrentUser();

        const { data, error } = await this.db()("contacts")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get a single contact by ID
     */
    async getContact(id: string): Promise<Contact | null> {
        const user = await this.getCurrentUser();

        const { data, error } = await this.db()("contacts")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    /**
     * Create a new contact
     */
    async createContact(params: CreateContactParams): Promise<Contact> {
        const user = await this.getCurrentUser();

        const { data, error } = await this.db()("contacts")
            .insert({
                user_id: user.id,
                name: params.name,
                context: params.context || null,
                linkedin_url: params.linkedinUrl || null,
                phone: params.phone || null,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get AI catchup suggestions
     */
    async getSuggestions(params: {
        contacts: Array<{
            name: string;
            context: string | null;
            daysSinceMet: number;
            lastCatchup: string | null;
        }>;
        preferences?: string[];
        city?: string | null;
    }): Promise<{ suggestions: CatchupSuggestion[] }> {
        return this.invoke("suggest-catchup", params);
    }

    /**
     * Snooze a contact
     */
    async snoozeContact(id: string, days: number = 7): Promise<void> {
        const user = await this.getCurrentUser();
        const snoozedUntil = new Date();
        snoozedUntil.setDate(snoozedUntil.getDate() + days);

        const { error } = await this.db()("contacts")
            .update({
                is_snoozed: true,
                snoozed_until: snoozedUntil.toISOString(),
            })
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) throw error;
    }

    /**
     * Mark contact as caught up
     */
    async markAsCaughtUp(id: string): Promise<void> {
        const user = await this.getCurrentUser();

        const { error } = await this.db()("contacts")
            .update({
                last_catchup: new Date().toISOString(),
                is_snoozed: false,
                snoozed_until: null,
            })
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) throw error;
    }

    /**
     * Delete a contact
     */
    async deleteContact(id: string): Promise<void> {
        const user = await this.getCurrentUser();

        const { error } = await this.db()("contacts")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) throw error;
    }
}

// Export singleton instance
export const contactsService = new ContactsService();
