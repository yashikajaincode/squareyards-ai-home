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
      boq_items: {
        Row: {
          catalog_item_id: string | null
          category: string | null
          id: string
          name: string
          note: string | null
          option_id: string
          qty: number
          unit_price_inr: number | null
          user_id: string
        }
        Insert: {
          catalog_item_id?: string | null
          category?: string | null
          id?: string
          name: string
          note?: string | null
          option_id: string
          qty?: number
          unit_price_inr?: number | null
          user_id: string
        }
        Update: {
          catalog_item_id?: string | null
          category?: string | null
          id?: string
          name?: string
          note?: string | null
          option_id?: string
          qty?: number
          unit_price_inr?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boq_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "boq_items_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "design_options"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog: {
        Row: {
          category: string
          color_finish: string | null
          depth_cm: number | null
          height_cm: number | null
          in_stock: number | null
          item_id: string
          lead_time_days: number | null
          name: string
          price_inr: number | null
          room_types: string | null
          style_tags: string | null
          width_cm: number | null
        }
        Insert: {
          category: string
          color_finish?: string | null
          depth_cm?: number | null
          height_cm?: number | null
          in_stock?: number | null
          item_id: string
          lead_time_days?: number | null
          name: string
          price_inr?: number | null
          room_types?: string | null
          style_tags?: string | null
          width_cm?: number | null
        }
        Update: {
          category?: string
          color_finish?: string | null
          depth_cm?: number | null
          height_cm?: number | null
          in_stock?: number | null
          item_id?: string
          lead_time_days?: number | null
          name?: string
          price_inr?: number | null
          room_types?: string | null
          style_tags?: string | null
          width_cm?: number | null
        }
        Relationships: []
      }
      design_options: {
        Row: {
          after_url: string | null
          before_url: string | null
          budget_used: number | null
          color_palette: Json | null
          concept_name: string
          confidence: number | null
          created_at: string
          id: string
          label: string
          materials: Json | null
          moodboard_urls: Json | null
          project_id: string
          rationale: string | null
          room_index: number
          room_label: string | null
          style_dna: Json | null
          tradeoffs: string | null
          user_id: string
        }
        Insert: {
          after_url?: string | null
          before_url?: string | null
          budget_used?: number | null
          color_palette?: Json | null
          concept_name: string
          confidence?: number | null
          created_at?: string
          id?: string
          label: string
          materials?: Json | null
          moodboard_urls?: Json | null
          project_id: string
          rationale?: string | null
          room_index?: number
          room_label?: string | null
          style_dna?: Json | null
          tradeoffs?: string | null
          user_id: string
        }
        Update: {
          after_url?: string | null
          before_url?: string | null
          budget_used?: number | null
          color_palette?: Json | null
          concept_name?: string
          confidence?: number | null
          created_at?: string
          id?: string
          label?: string
          materials?: Json | null
          moodboard_urls?: Json | null
          project_id?: string
          rationale?: string | null
          room_index?: number
          room_label?: string | null
          style_dna?: Json | null
          tradeoffs?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_options_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      project_images: {
        Row: {
          created_at: string
          id: string
          kind: string
          project_id: string
          public_url: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          project_id: string
          public_url?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          project_id?: string
          public_url?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          ai_analysis: Json | null
          budget_inr: number | null
          cover_url: string | null
          created_at: string
          id: string
          intent: string
          length_cm: number | null
          lifestyle: string | null
          must_haves: string | null
          notes: string | null
          room_type: string | null
          rooms: Json
          status: string
          style_preference: string | null
          title: string
          updated_at: string
          user_id: string
          width_cm: number | null
          workflow: Json | null
        }
        Insert: {
          ai_analysis?: Json | null
          budget_inr?: number | null
          cover_url?: string | null
          created_at?: string
          id?: string
          intent: string
          length_cm?: number | null
          lifestyle?: string | null
          must_haves?: string | null
          notes?: string | null
          room_type?: string | null
          rooms?: Json
          status?: string
          style_preference?: string | null
          title: string
          updated_at?: string
          user_id: string
          width_cm?: number | null
          workflow?: Json | null
        }
        Update: {
          ai_analysis?: Json | null
          budget_inr?: number | null
          cover_url?: string | null
          created_at?: string
          id?: string
          intent?: string
          length_cm?: number | null
          lifestyle?: string | null
          must_haves?: string | null
          notes?: string | null
          room_type?: string | null
          rooms?: Json
          status?: string
          style_preference?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          width_cm?: number | null
          workflow?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
