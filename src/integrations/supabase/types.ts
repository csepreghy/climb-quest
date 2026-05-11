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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_rewards: {
        Row: {
          activity: string
          created_at: string
          updated_at: string
          updated_by: string | null
          value: number
        }
        Insert: {
          activity: string
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          value: number
        }
        Update: {
          activity?: string
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          value?: number
        }
        Relationships: []
      }
      app_theme_settings: {
        Row: {
          header_opacity: number
          id: string
          selections: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          header_opacity?: number
          id?: string
          selections?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          header_opacity?: number
          id?: string
          selections?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_cap_config: {
        Row: {
          base: number
          enabled: boolean
          id: string
          level_step: number
          streak_max_days: number
          streak_step: number
          tier1_mult: number
          tier1_threshold: number
          tier2_mult: number
          tier2_threshold: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base?: number
          enabled?: boolean
          id?: string
          level_step?: number
          streak_max_days?: number
          streak_step?: number
          tier1_mult?: number
          tier1_threshold?: number
          tier2_mult?: number
          tier2_threshold?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base?: number
          enabled?: boolean
          id?: string
          level_step?: number
          streak_max_days?: number
          streak_step?: number
          tier1_mult?: number
          tier1_threshold?: number
          tier2_mult?: number
          tier2_threshold?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      daily_cap_overrides: {
        Row: {
          cap: number
          level: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cap: number
          level: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cap?: number
          level?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hidden_builtin_items: {
        Row: {
          hidden_at: string
          hidden_by: string | null
          item_id: string
        }
        Insert: {
          hidden_at?: string
          hidden_by?: string | null
          item_id: string
        }
        Update: {
          hidden_at?: string
          hidden_by?: string | null
          item_id?: string
        }
        Relationships: []
      }
      level_overrides: {
        Row: {
          chalk_req: number | null
          created_at: string
          gender: string
          image: string | null
          level: number
          name: string | null
          rarity: string | null
          tagline: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          chalk_req?: number | null
          created_at?: string
          gender: string
          image?: string | null
          level: number
          name?: string | null
          rarity?: string | null
          tagline?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          chalk_req?: number | null
          created_at?: string
          gender?: string
          image?: string | null
          level?: number
          name?: string | null
          rarity?: string | null
          tagline?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          character_name: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          character_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          character_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      public_gyms: {
        Row: {
          created_at: string
          data: Json
          grading_systems: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          data: Json
          grading_systems?: Json
          id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          grading_systems?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          applies_to: Json
          bonus_pct: number
          boss_bonus_pct: number
          category: string
          created_at: string
          crit_chance_pct: number
          gender: string
          group: string
          id: string
          image: string | null
          level_req: number | null
          name: string
          price: number
          price_mult: number
          rarity: string
          slot: string
          updated_at: string
        }
        Insert: {
          applies_to?: Json
          bonus_pct?: number
          boss_bonus_pct?: number
          category: string
          created_at?: string
          crit_chance_pct?: number
          gender?: string
          group: string
          id: string
          image?: string | null
          level_req?: number | null
          name: string
          price?: number
          price_mult?: number
          rarity: string
          slot: string
          updated_at?: string
        }
        Update: {
          applies_to?: Json
          bonus_pct?: number
          boss_bonus_pct?: number
          category?: string
          created_at?: string
          crit_chance_pct?: number
          gender?: string
          group?: string
          id?: string
          image?: string | null
          level_req?: number | null
          name?: string
          price?: number
          price_mult?: number
          rarity?: string
          slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_game_state: {
        Row: {
          created_at: string
          game: Json
          gyms: Json
          slot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game?: Json
          gyms?: Json
          slot?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game?: Json
          gyms?: Json
          slot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_users: {
        Args: never
        Returns: {
          bosses_sent: number
          character_name: string
          created_at: string
          display_name: string
          email: string
          is_admin: boolean
          level: number
          total_chalk_earned: number
          total_logs: number
          user_id: string
        }[]
      }
      get_climber_charts: {
        Args: { target_user: string }
        Returns: {
          logs: Json
          strength_sessions: Json
        }[]
      }
      get_leaderboard: {
        Args: never
        Returns: {
          bosses_sent: number
          character_name: string
          equipped: Json
          gender: string
          level: number
          owned: Json
          strength_sessions: number
          total_chalk_earned: number
          total_logs: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_character_name_available: {
        Args: { p_name: string }
        Returns: boolean
      }
      set_character_name: { Args: { p_name: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
