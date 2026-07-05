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
      badge_overrides: {
        Row: {
          badge_id: string
          created_at: string
          description: string | null
          flavor: string | null
          rarity: string | null
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          badge_id: string
          created_at?: string
          description?: string | null
          flavor?: string | null
          rarity?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          badge_id?: string
          created_at?: string
          description?: string | null
          flavor?: string | null
          rarity?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      board_sessions: {
        Row: {
          board_type: string
          chalk_awarded: number
          created_at: string
          grade: string
          grade_rank: number
          grade_system: string
          id: string
          is_benchmark: boolean
          is_flash: boolean
          kilter_angle: number | null
          logged_at: string
          moonboard_variant: string | null
          notes: string | null
          problem_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          board_type: string
          chalk_awarded?: number
          created_at?: string
          grade: string
          grade_rank: number
          grade_system: string
          id?: string
          is_benchmark?: boolean
          is_flash?: boolean
          kilter_angle?: number | null
          logged_at?: string
          moonboard_variant?: string | null
          notes?: string | null
          problem_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          board_type?: string
          chalk_awarded?: number
          created_at?: string
          grade?: string
          grade_rank?: number
          grade_system?: string
          id?: string
          is_benchmark?: boolean
          is_flash?: boolean
          kilter_angle?: number | null
          logged_at?: string
          moonboard_variant?: string | null
          notes?: string | null
          problem_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      card_lab_settings: {
        Row: {
          config: Json
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          id?: number
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
      feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      hangboard_calibration: {
        Row: {
          holds: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          holds: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          holds?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hangboard_workouts: {
        Row: {
          board: string
          created_at: string
          description: string | null
          id: string
          is_template: boolean
          name: string
          steps: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          board?: string
          created_at?: string
          description?: string | null
          id?: string
          is_template?: boolean
          name: string
          steps?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          board?: string
          created_at?: string
          description?: string | null
          id?: string
          is_template?: boolean
          name?: string
          steps?: Json
          updated_at?: string
          user_id?: string | null
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
      notification_reads: {
        Row: {
          created_at: string
          dismissed_at: string | null
          id: string
          notification_id: string
          seen_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed_at?: string | null
          id?: string
          notification_id: string
          seen_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed_at?: string | null
          id?: string
          notification_id?: string
          seen_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          audience: string
          body: string
          created_at: string
          expires_at: string | null
          highlights: Json | null
          id: string
          payload: Json | null
          priority: string
          source: string
          starts_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          audience?: string
          body: string
          created_at?: string
          expires_at?: string | null
          highlights?: Json | null
          id?: string
          payload?: Json | null
          priority?: string
          source?: string
          starts_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          audience?: string
          body?: string
          created_at?: string
          expires_at?: string | null
          highlights?: Json | null
          id?: string
          payload?: Json | null
          priority?: string
          source?: string
          starts_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          archived_at: string | null
          character_name: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          archived_at?: string | null
          character_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          archived_at?: string | null
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
          board_bonus_pct: number
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
          board_bonus_pct?: number
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
          board_bonus_pct?: number
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
      streak_config: {
        Row: {
          day_bonus_pcts: Json
          enabled: boolean
          id: string
          milestones: Json
          post7_chalk_days: number
          post7_chalk_pct: number
          post7_crit_days: number
          post7_crit_pct: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          day_bonus_pcts?: Json
          enabled?: boolean
          id?: string
          milestones?: Json
          post7_chalk_days?: number
          post7_chalk_pct?: number
          post7_crit_days?: number
          post7_crit_pct?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          day_bonus_pcts?: Json
          enabled?: boolean
          id?: string
          milestones?: Json
          post7_chalk_days?: number
          post7_chalk_pct?: number
          post7_crit_days?: number
          post7_crit_pct?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      topo_settings: {
        Row: {
          config: Json
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_game_state: {
        Row: {
          created_at: string
          game: Json
          gyms: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game?: Json
          gyms?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game?: Json
          gyms?: Json
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
          archived_at: string
          bosses_sent: number
          character_name: string
          created_at: string
          display_name: string
          email: string
          is_admin: boolean
          level: number
          provider: string
          total_chalk_earned: number
          total_logs: number
          user_id: string
        }[]
      }
      get_all_feedback: {
        Args: never
        Returns: {
          category: string
          character_name: string
          created_at: string
          email: string
          id: string
          message: string
          user_id: string
        }[]
      }
      get_climber_charts: {
        Args: { target_user: string }
        Returns: {
          board_sessions: Json
          logs: Json
          strength_sessions: Json
        }[]
      }
      get_leaderboard: {
        Args: never
        Returns: {
          board_sessions: number
          bosses_sent: number
          character_name: string
          equipped: Json
          gender: string
          level: number
          owned: Json
          strength_reps: number
          strength_seconds: number
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
      set_user_archived: {
        Args: { archived: boolean; target_user: string }
        Returns: undefined
      }
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
