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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          body_part: Database["public"]["Enums"]["body_part"]
          category: Database["public"]["Enums"]["exercise_category"]
          created_at: string
          description_de: string | null
          description_en: string | null
          id: string
          image_url: string | null
          name_de: string
          name_en: string
        }
        Insert: {
          body_part: Database["public"]["Enums"]["body_part"]
          category: Database["public"]["Enums"]["exercise_category"]
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          name_de: string
          name_en: string
        }
        Update: {
          body_part?: Database["public"]["Enums"]["body_part"]
          category?: Database["public"]["Enums"]["exercise_category"]
          created_at?: string
          description_de?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          name_de?: string
          name_en?: string
        }
        Relationships: []
      }
      jogging_logs: {
        Row: {
          calories: number | null
          completed_at: string
          created_at: string
          distance: number
          duration: number
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          completed_at?: string
          created_at?: string
          distance: number
          duration: number
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          calories?: number | null
          completed_at?: string
          created_at?: string
          distance?: number
          duration?: number
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calories: number
          carbs: number | null
          completed_at: string
          created_at: string
          fats: number | null
          food_name: string
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes: string | null
          protein: number | null
          user_id: string
        }
        Insert: {
          calories: number
          carbs?: number | null
          completed_at?: string
          created_at?: string
          fats?: number | null
          food_name: string
          id?: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          protein?: number | null
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number | null
          completed_at?: string
          created_at?: string
          fats?: number | null
          food_name?: string
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          athlete_level: string | null
          avatar_url: string | null
          body_type: string | null
          created_at: string
          height: number | null
          id: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          athlete_level?: string | null
          avatar_url?: string | null
          body_type?: string | null
          created_at?: string
          height?: number | null
          id?: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          athlete_level?: string | null
          avatar_url?: string | null
          body_type?: string | null
          created_at?: string
          height?: number | null
          id?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          id: string
          measured_at: string
          notes: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          measured_at?: string
          notes?: string | null
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          measured_at?: string
          notes?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          completed_at: string
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          reps: number
          sets: number
          unit: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          completed_at?: string
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          reps?: number
          sets?: number
          unit?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          completed_at?: string
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          reps?: number
          sets?: number
          unit?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      body_part: "lower_body" | "upper_body"
      exercise_category:
        | "beine"
        | "waden"
        | "squats"
        | "po"
        | "brust"
        | "ruecken"
        | "core"
        | "schulter"
        | "trizeps"
        | "bizeps"
        | "bauch"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
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
      body_part: ["lower_body", "upper_body"],
      exercise_category: [
        "beine",
        "waden",
        "squats",
        "po",
        "brust",
        "ruecken",
        "core",
        "schulter",
        "trizeps",
        "bizeps",
        "bauch",
      ],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
    },
  },
} as const
