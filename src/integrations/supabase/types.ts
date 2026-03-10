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
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          country: string
          created_at: string
          description: string | null
          id: string
          image_alt: string | null
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          slug: string
        }
        Insert: {
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          slug: string
        }
        Update: {
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category_id: string | null
          city_id: string
          created_at: string
          date_end: string | null
          date_start: string
          description: string | null
          id: string
          image_alt: string | null
          image_source: string | null
          image_url: string | null
          is_family_friendly: boolean
          is_free: boolean
          is_indoor: boolean
          is_outdoor: boolean
          neighbourhood_id: string | null
          official_url: string | null
          price: string | null
          short_description: string | null
          slug: string
          source_id: string | null
          source_url: string | null
          status: string
          tags: string[] | null
          ticket_url: string | null
          time_end: string | null
          time_start: string | null
          title: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          category_id?: string | null
          city_id: string
          created_at?: string
          date_end?: string | null
          date_start: string
          description?: string | null
          id?: string
          image_alt?: string | null
          image_source?: string | null
          image_url?: string | null
          is_family_friendly?: boolean
          is_free?: boolean
          is_indoor?: boolean
          is_outdoor?: boolean
          neighbourhood_id?: string | null
          official_url?: string | null
          price?: string | null
          short_description?: string | null
          slug: string
          source_id?: string | null
          source_url?: string | null
          status?: string
          tags?: string[] | null
          ticket_url?: string | null
          time_end?: string | null
          time_start?: string | null
          title: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          category_id?: string | null
          city_id?: string
          created_at?: string
          date_end?: string | null
          date_start?: string
          description?: string | null
          id?: string
          image_alt?: string | null
          image_source?: string | null
          image_url?: string | null
          is_family_friendly?: boolean
          is_free?: boolean
          is_indoor?: boolean
          is_outdoor?: boolean
          neighbourhood_id?: string | null
          official_url?: string | null
          price?: string | null
          short_description?: string | null
          slug?: string
          source_id?: string | null
          source_url?: string | null
          status?: string
          tags?: string[] | null
          ticket_url?: string | null
          time_end?: string | null
          time_start?: string | null
          title?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_neighbourhood_id_fkey"
            columns: ["neighbourhood_id"]
            isOneToOne: false
            referencedRelation: "neighbourhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          category_id: string
          city_id: string
          created_at: string
          description: string | null
          google_maps_link: string | null
          id: string
          image_alt: string | null
          image_source: string | null
          image_url: string | null
          is_approved: boolean
          is_featured: boolean
          latitude: number | null
          longitude: number | null
          name: string
          neighbourhood_id: string | null
          phone: string | null
          place_id: string | null
          price_level: string | null
          rating: number | null
          review_count: number | null
          short_description: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category_id: string
          city_id: string
          created_at?: string
          description?: string | null
          google_maps_link?: string | null
          id?: string
          image_alt?: string | null
          image_source?: string | null
          image_url?: string | null
          is_approved?: boolean
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          neighbourhood_id?: string | null
          phone?: string | null
          place_id?: string | null
          price_level?: string | null
          rating?: number | null
          review_count?: number | null
          short_description?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category_id?: string
          city_id?: string
          created_at?: string
          description?: string | null
          google_maps_link?: string | null
          id?: string
          image_alt?: string | null
          image_source?: string | null
          image_url?: string | null
          is_approved?: boolean
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighbourhood_id?: string | null
          phone?: string | null
          place_id?: string | null
          price_level?: string | null
          rating?: number | null
          review_count?: number | null
          short_description?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_neighbourhood_id_fkey"
            columns: ["neighbourhood_id"]
            isOneToOne: false
            referencedRelation: "neighbourhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      modifiers: {
        Row: {
          created_at: string
          description_template: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description_template?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description_template?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      neighbourhoods: {
        Row: {
          city_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          slug: string
        }
        Insert: {
          city_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          slug: string
        }
        Update: {
          city_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighbourhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      page_quality: {
        Row: {
          canonical_slug: string | null
          content_count: number
          created_at: string
          id: string
          is_published: boolean
          last_checked_at: string
          page_slug: string
        }
        Insert: {
          canonical_slug?: string | null
          content_count?: number
          created_at?: string
          id?: string
          is_published?: boolean
          last_checked_at?: string
          page_slug: string
        }
        Update: {
          canonical_slug?: string | null
          content_count?: number
          created_at?: string
          id?: string
          is_published?: boolean
          last_checked_at?: string
          page_slug?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          category_id: string | null
          city_id: string | null
          created_at: string
          date: string
          id: string
          page_path: string
          view_count: number
        }
        Insert: {
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          date?: string
          id?: string
          page_path: string
          view_count?: number
        }
        Update: {
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          date?: string
          id?: string
          page_path?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_views_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_views_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      programmatic_pages: {
        Row: {
          category_id: string | null
          city_id: string | null
          created_at: string
          id: string
          intro_text: string | null
          is_active: boolean
          listing_count: number
          meta_description: string | null
          modifier_id: string | null
          neighbourhood_id: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          id?: string
          intro_text?: string | null
          is_active?: boolean
          listing_count?: number
          meta_description?: string | null
          modifier_id?: string | null
          neighbourhood_id?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          id?: string
          intro_text?: string | null
          is_active?: boolean
          listing_count?: number
          meta_description?: string | null
          modifier_id?: string | null
          neighbourhood_id?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmatic_pages_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmatic_pages_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmatic_pages_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "modifiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmatic_pages_neighbourhood_id_fkey"
            columns: ["neighbourhood_id"]
            isOneToOne: false
            referencedRelation: "neighbourhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      search_trends: {
        Row: {
          category_id: string | null
          city_id: string | null
          created_at: string
          id: string
          page_generated: boolean
          query: string
          search_volume: number | null
          trend_score: number | null
        }
        Insert: {
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          id?: string
          page_generated?: boolean
          query: string
          search_volume?: number | null
          trend_score?: number | null
        }
        Update: {
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          id?: string
          page_generated?: boolean
          query?: string
          search_volume?: number | null
          trend_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "search_trends_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_trends_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_old_events: { Args: never; Returns: number }
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
