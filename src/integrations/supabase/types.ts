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
      automation_logs: {
        Row: {
          completed_at: string | null
          details: Json | null
          duplicates_merged: number | null
          error_message: string | null
          events_expired: number | null
          id: string
          listings_added: number | null
          listings_archived: number | null
          listings_updated: number | null
          pages_published: number | null
          pages_unpublished: number | null
          run_type: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          details?: Json | null
          duplicates_merged?: number | null
          error_message?: string | null
          events_expired?: number | null
          id?: string
          listings_added?: number | null
          listings_archived?: number | null
          listings_updated?: number | null
          pages_published?: number | null
          pages_unpublished?: number | null
          run_type?: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          details?: Json | null
          duplicates_merged?: number | null
          error_message?: string | null
          events_expired?: number | null
          id?: string
          listings_added?: number | null
          listings_archived?: number | null
          listings_updated?: number | null
          pages_published?: number | null
          pages_unpublished?: number | null
          run_type?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      automation_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image_alt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          county: string | null
          created_at: string
          description: string | null
          id: string
          image_alt: string | null
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          nearby_city_slugs: string[] | null
          slug: string
        }
        Insert: {
          country?: string
          county?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          nearby_city_slugs?: string[] | null
          slug: string
        }
        Update: {
          country?: string
          county?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          nearby_city_slugs?: string[] | null
          slug?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      event_sources: {
        Row: {
          city_id: string | null
          council_area: string | null
          crawl_frequency: string | null
          created_at: string
          events_url: string | null
          id: string
          is_active: boolean
          last_scraped_at: string | null
          name: string
          notes: string | null
          priority: number
          source_type: string
          tags: string[] | null
          town: string | null
          website_url: string | null
        }
        Insert: {
          city_id?: string | null
          council_area?: string | null
          crawl_frequency?: string | null
          created_at?: string
          events_url?: string | null
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          name: string
          notes?: string | null
          priority?: number
          source_type?: string
          tags?: string[] | null
          town?: string | null
          website_url?: string | null
        }
        Update: {
          city_id?: string | null
          council_area?: string | null
          crawl_frequency?: string | null
          created_at?: string
          events_url?: string | null
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          name?: string
          notes?: string | null
          priority?: number
          source_type?: string
          tags?: string[] | null
          town?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sources_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category_id: string | null
          city_id: string
          council_area: string | null
          created_at: string
          date_end: string | null
          date_start: string
          description: string | null
          id: string
          image_alt: string | null
          image_source: string | null
          image_status: string
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
          venue_listing_id: string | null
          venue_name: string | null
        }
        Insert: {
          category_id?: string | null
          city_id: string
          council_area?: string | null
          created_at?: string
          date_end?: string | null
          date_start: string
          description?: string | null
          id?: string
          image_alt?: string | null
          image_source?: string | null
          image_status?: string
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
          venue_listing_id?: string | null
          venue_name?: string | null
        }
        Update: {
          category_id?: string | null
          city_id?: string
          council_area?: string | null
          created_at?: string
          date_end?: string | null
          date_start?: string
          description?: string | null
          id?: string
          image_alt?: string | null
          image_source?: string | null
          image_status?: string
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
          venue_listing_id?: string | null
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
          {
            foreignKeyName: "events_venue_listing_id_fkey"
            columns: ["venue_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      landmarks: {
        Row: {
          city_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          radius_km: number
          slug: string
        }
        Insert: {
          city_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          radius_km?: number
          slug: string
        }
        Update: {
          city_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          radius_km?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "landmarks_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          age_groups: string[] | null
          audience_tags: string[] | null
          category_id: string
          city_id: string
          created_at: string
          description: string | null
          family_friendly: boolean
          google_maps_link: string | null
          id: string
          image_alt: string | null
          image_source: string | null
          image_status: string
          image_url: string | null
          is_approved: boolean
          is_archived: boolean
          is_event_venue: boolean
          is_featured: boolean
          kids_friendly: boolean
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
          age_groups?: string[] | null
          audience_tags?: string[] | null
          category_id: string
          city_id: string
          created_at?: string
          description?: string | null
          family_friendly?: boolean
          google_maps_link?: string | null
          id?: string
          image_alt?: string | null
          image_source?: string | null
          image_status?: string
          image_url?: string | null
          is_approved?: boolean
          is_archived?: boolean
          is_event_venue?: boolean
          is_featured?: boolean
          kids_friendly?: boolean
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
          age_groups?: string[] | null
          audience_tags?: string[] | null
          category_id?: string
          city_id?: string
          created_at?: string
          description?: string | null
          family_friendly?: boolean
          google_maps_link?: string | null
          id?: string
          image_alt?: string | null
          image_source?: string | null
          image_status?: string
          image_url?: string | null
          is_approved?: boolean
          is_archived?: boolean
          is_event_venue?: boolean
          is_featured?: boolean
          kids_friendly?: boolean
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
      nearby_listings: {
        Args: {
          p_category_slug?: string
          p_lat: number
          p_limit?: number
          p_lng: number
          p_radius_km?: number
        }
        Returns: {
          address: string | null
          age_groups: string[] | null
          audience_tags: string[] | null
          category_id: string
          city_id: string
          created_at: string
          description: string | null
          family_friendly: boolean
          google_maps_link: string | null
          id: string
          image_alt: string | null
          image_source: string | null
          image_status: string
          image_url: string | null
          is_approved: boolean
          is_archived: boolean
          is_event_venue: boolean
          is_featured: boolean
          kids_friendly: boolean
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
        }[]
        SetofOptions: {
          from: "*"
          to: "listings"
          isOneToOne: false
          isSetofReturn: true
        }
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
