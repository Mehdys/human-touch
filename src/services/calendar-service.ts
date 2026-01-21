import APIClient from "./api-client";

export interface CalendarEvent {
    summary: string;
    start: string;
    end: string;
}

export interface FreeSlot {
    start: string;
    end: string;
    duration: number;
}

export interface AvailabilityData {
    calendarConnected: boolean;
    freeSlots: FreeSlot[];
    calendarEvents: CalendarEvent[];
}

export interface CreateCalendarEventParams {
    catchupId: string;
    contactName: string;
    scheduledTime: string;
    durationMinutes?: number;
    placeName?: string;
    message?: string;
}

export interface CreateCalendarEventResponse {
    eventId: string;
    eventLink: string;
    success: boolean;
}

class CalendarService extends APIClient {
    /**
     * Get calendar availability and free slots
     */
    async getAvailability(): Promise<AvailabilityData> {
        const session = await this.getSession();
        const providerToken = session.provider_token;

        if (!providerToken) {
            return {
                calendarConnected: false,
                freeSlots: [],
                calendarEvents: [],
            };
        }

        return this.invoke("get-availability", {
            provider_token: providerToken,
        });
    }

    /**
     * Create a calendar event
     */
    async createEvent(params: CreateCalendarEventParams): Promise<CreateCalendarEventResponse> {
        return this.invoke("create-calendar-event", params);
    }

    /**
     * Check if calendar is connected
     */
    async isConnected(): Promise<boolean> {
        const session = await this.getSession();
        return !!session.provider_token;
    }
}

// Export singleton instance
export const calendarService = new CalendarService();
