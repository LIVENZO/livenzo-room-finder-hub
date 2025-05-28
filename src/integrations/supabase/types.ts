export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          id: string
          message: string | null
          move_in_date: string | null
          owner_id: string
          room_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          move_in_date?: string | null
          owner_id: string
          room_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          move_in_date?: string | null
          owner_id?: string
          room_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          receiver_id: string
          relationship_id: string | null
          room_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          receiver_id: string
          relationship_id?: string | null
          room_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          receiver_id?: string
          relationship_id?: string | null
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          created_at: string
          description: string
          id: string
          owner_id: string
          relationship_id: string
          renter_id: string
          response: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          owner_id: string
          relationship_id: string
          renter_id: string
          response?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          relationship_id?: string
          renter_id?: string
          response?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          comments: string | null
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          relationship_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          relationship_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          relationship_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          property_id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          property_id: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          property_id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          created_at: string
          id: string
          message: string
          owner_id: string
          renter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          owner_id: string
          renter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          owner_id?: string
          renter_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          payment_date: string
          property_id: string
          renter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          id?: string
          payment_date?: string
          property_id: string
          renter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          payment_date?: string
          property_id?: string
          renter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "renters"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          amenities: Json | null
          city: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          monthly_rent: number
          name: string
          rooms_available: number
          state: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          address: string
          amenities?: Json | null
          city: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          monthly_rent: number
          name: string
          rooms_available?: number
          state: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          address?: string
          amenities?: Json | null
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          monthly_rent?: number
          name?: string
          rooms_available?: number
          state?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      relationships: {
        Row: {
          chat_room_id: string
          created_at: string
          id: string
          owner_id: string
          renter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          chat_room_id?: string
          created_at?: string
          id?: string
          owner_id: string
          renter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          chat_room_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          renter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      renters: {
        Row: {
          created_at: string
          id: string
          property_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          room_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          room_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          available: boolean
          created_at: string
          description: string
          facilities: Json
          house_name: string | null
          house_no: string | null
          id: string
          images: string[] | null
          location: string
          owner_id: string
          owner_phone: string
          price: number
          title: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          description: string
          facilities?: Json
          house_name?: string | null
          house_no?: string | null
          id?: string
          images?: string[] | null
          location: string
          owner_id: string
          owner_phone: string
          price: number
          title: string
        }
        Update: {
          available?: boolean
          created_at?: string
          description?: string
          facilities?: Json
          house_name?: string | null
          house_no?: string | null
          id?: string
          images?: string[] | null
          location?: string
          owner_id?: string
          owner_phone?: string
          price?: number
          title?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          accommodation_type: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          house_number: string | null
          id: string
          is_owner_profile_complete: boolean | null
          phone: string | null
          property_address: Json | null
          property_location: string | null
          property_name: string | null
          resident_type: string | null
          total_rental_rooms: number | null
          updated_at: string
        }
        Insert: {
          accommodation_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          house_number?: string | null
          id: string
          is_owner_profile_complete?: boolean | null
          phone?: string | null
          property_address?: Json | null
          property_location?: string | null
          property_name?: string | null
          resident_type?: string | null
          total_rental_rooms?: number | null
          updated_at?: string
        }
        Update: {
          accommodation_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          house_number?: string | null
          id?: string
          is_owner_profile_complete?: boolean | null
          phone?: string | null
          property_address?: Json | null
          property_location?: string | null
          property_name?: string | null
          resident_type?: string | null
          total_rental_rooms?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_room_availability_for_owner: {
        Args: { room_id: string; is_available: boolean }
        Returns: undefined
      }
    }
    Enums: {
      document_type:
        | "id_proof"
        | "rental_agreement"
        | "utility_bill"
        | "income_proof"
        | "other"
        | "lease_agreement"
        | "reference"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      document_type: [
        "id_proof",
        "rental_agreement",
        "utility_bill",
        "income_proof",
        "other",
        "lease_agreement",
        "reference",
      ],
    },
  },
} as const
