export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      catchups: {
        Row: {
          contact_ids: string[]
          created_at: string
          id: string
          message: string | null
          place_name: string | null
          place_type: string | null
          scheduled_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          contact_ids: string[]
          created_at?: string
          id?: string
          message?: string | null
          place_name?: string | null
          place_type?: string | null
          scheduled_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          contact_ids?: string[]
          created_at?: string
          id?: string
          message?: string | null
          place_name?: string | null
          place_type?: string | null
          scheduled_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          context: string | null
          created_at: string
          event_id: string | null
          followed_up_at: string | null
          id: string
          is_done: boolean | null
          is_snoozed: boolean | null
          last_catchup: string | null
          linkedin_url: string | null
          met_at: string | null
          name: string
          phone: string | null
          reminder_days: number | null
          snoozed_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          event_id?: string | null
          followed_up_at?: string | null
          id?: string
          is_done?: boolean | null
          is_snoozed?: boolean | null
          last_catchup?: string | null
          linkedin_url?: string | null
          met_at?: string | null
          name: string
          phone?: string | null
          reminder_days?: number | null
          snoozed_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          event_id?: string | null
          followed_up_at?: string | null
          id?: string
          is_done?: boolean | null
          is_snoozed?: boolean | null
          last_catchup?: string | null
          linkedin_url?: string | null
          met_at?: string | null
          name?: string
          phone?: string | null
          reminder_days?: number | null
          snoozed_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_date: string
          event_type: string | null
          id: string
          location: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date?: string
          event_type?: string | null
          id?: string
          location?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_type?: string | null
          id?: string
          location?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          google_calendar_connected: boolean | null
          google_refresh_token: string | null
          id: string
          linkedin_url: string | null
          name: string | null
          phone: string | null
          preference: string | null
          preferences: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          google_calendar_connected?: boolean | null
          google_refresh_token?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string | null
          phone?: string | null
          preference?: string | null
          preferences?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          google_calendar_connected?: boolean | null
          google_refresh_token?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string | null
          phone?: string | null
          preference?: string | null
          preferences?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_shares: {
        Row: {
          context: string | null
          created_at: string
          expires_at: string
          id: string
          linkedin_url: string | null
          name: string
          phone: string | null
          share_code: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          linkedin_url?: string | null
          name: string
          phone?: string | null
          share_code: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          phone?: string | null
          share_code?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_share_by_code: {
        Args: { p_share_code: string }
        Returns: {
          context: string
          expires_at: string
          id: string
          linkedin_url: string
          name: string
          phone: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
