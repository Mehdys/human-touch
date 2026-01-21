import APIClient from "./api-client";

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    city: string | null;
    preferences: string[] | null;
    created_at: string;
    updated_at: string;
}

export interface UpdateProfileParams {
    fullName?: string;
    city?: string;
    preferences?: string[];
}

class ProfileService extends APIClient {
    /**
     * Get current user's profile
     */
    async getProfile(): Promise<UserProfile | null> {
        const user = await this.getCurrentUser();

        const { data, error } = await this.db()("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    /**
     * Update user's profile
     */
    async updateProfile(params: UpdateProfileParams): Promise<UserProfile> {
        const user = await this.getCurrentUser();

        const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (params.fullName !== undefined) updates.full_name = params.fullName;
        if (params.city !== undefined) updates.city = params.city;
        if (params.preferences !== undefined) updates.preferences = params.preferences;

        const { data, error } = await this.db()("profiles")
            .update(updates)
            .eq("id", user.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

// Export singleton instance
export const profileService = new ProfileService();
