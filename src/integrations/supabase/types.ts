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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      anonymous_chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "anonymous_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_chat_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          participant_1: string
          participant_2: string | null
          status: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          participant_1: string
          participant_2?: string | null
          status: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          participant_1?: string
          participant_2?: string | null
          status?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          booking_stage: string | null
          created_at: string
          id: string
          room_id: string
          status: string
          stay_duration: number | null
          token_amount: number | null
          token_paid: boolean | null
          token_required: boolean | null
          user_details: string | null
          user_id: string
          user_type: string | null
        }
        Insert: {
          booking_stage?: string | null
          created_at?: string
          id?: string
          room_id: string
          status?: string
          stay_duration?: number | null
          token_amount?: number | null
          token_paid?: boolean | null
          token_required?: boolean | null
          user_details?: string | null
          user_id: string
          user_type?: string | null
        }
        Update: {
          booking_stage?: string | null
          created_at?: string
          id?: string
          room_id?: string
          status?: string
          stay_duration?: number | null
          token_amount?: number | null
          token_paid?: boolean | null
          token_required?: boolean | null
          user_details?: string | null
          user_id?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
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
          archived: boolean | null
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
          archived?: boolean | null
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
          archived?: boolean | null
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
      fcm_tokens: {
        Row: {
          created_at: string | null
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fcm_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "safe_profile_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fcm_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      firebase_user_mappings: {
        Row: {
          created_at: string | null
          firebase_uid: string
          id: string
          phone_number: string | null
          supabase_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          firebase_uid: string
          id?: string
          phone_number?: string | null
          supabase_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          firebase_uid?: string
          id?: string
          phone_number?: string | null
          supabase_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      manual_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          proof_file_name: string | null
          proof_image_url: string | null
          relationship_id: string
          renter_id: string
          status: string
          submitted_at: string
          transaction_id: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          proof_file_name?: string | null
          proof_image_url?: string | null
          relationship_id: string
          renter_id: string
          status?: string
          submitted_at?: string
          transaction_id?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          proof_file_name?: string | null
          proof_image_url?: string | null
          relationship_id?: string
          renter_id?: string
          status?: string
          submitted_at?: string
          transaction_id?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
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
      meter_photos: {
        Row: {
          billing_month: string
          created_at: string
          file_size: number
          id: string
          owner_id: string
          photo_name: string
          photo_url: string
          relationship_id: string
          renter_id: string
          updated_at: string
        }
        Insert: {
          billing_month?: string
          created_at?: string
          file_size: number
          id?: string
          owner_id: string
          photo_name: string
          photo_url: string
          relationship_id: string
          renter_id: string
          updated_at?: string
        }
        Update: {
          billing_month?: string
          created_at?: string
          file_size?: number
          id?: string
          owner_id?: string
          photo_name?: string
          photo_url?: string
          relationship_id?: string
          renter_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          archived: boolean | null
          created_at: string
          id: string
          message: string
          owner_id: string
          renter_id: string
          title: string | null
        }
        Insert: {
          archived?: boolean | null
          created_at?: string
          id?: string
          message: string
          owner_id: string
          renter_id: string
          title?: string | null
        }
        Update: {
          archived?: boolean | null
          created_at?: string
          id?: string
          message?: string
          owner_id?: string
          renter_id?: string
          title?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          deep_link_url: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deep_link_url?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deep_link_url?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profile_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_upi_details: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
          qr_code_file_name: string | null
          qr_code_url: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id: string
          qr_code_file_name?: string | null
          qr_code_url?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          qr_code_file_name?: string | null
          qr_code_url?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          billing_month: string | null
          created_at: string
          due_date: string | null
          electric_bill_amount: number | null
          id: string
          owner_id: string | null
          payment_date: string
          payment_method: string | null
          payment_status: string
          property_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          relationship_id: string | null
          rent_id: string | null
          renter_id: string
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          billing_month?: string | null
          created_at?: string
          due_date?: string | null
          electric_bill_amount?: number | null
          id?: string
          owner_id?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_status?: string
          property_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          relationship_id?: string | null
          rent_id?: string | null
          renter_id: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_month?: string | null
          created_at?: string
          due_date?: string | null
          electric_bill_amount?: number | null
          id?: string
          owner_id?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_status?: string
          property_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          relationship_id?: string | null
          rent_id?: string | null
          renter_id?: string
          status?: string
          transaction_id?: string | null
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
            foreignKeyName: "payments_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_rent_id_fkey"
            columns: ["rent_id"]
            isOneToOne: false
            referencedRelation: "rent_status"
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
      referral_events: {
        Row: {
          created_at: string
          id: string
          is_new_user: boolean
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount: number
          reward_status: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_new_user?: boolean
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount?: number
          reward_status?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_new_user?: boolean
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number
          reward_status?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          reward_amount: number | null
          reward_credited_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          reward_amount?: number | null
          reward_credited_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_amount?: number | null
          reward_credited_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      relationships: {
        Row: {
          archived: boolean | null
          chat_room_id: string
          created_at: string
          id: string
          owner_id: string
          renter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          archived?: boolean | null
          chat_room_id?: string
          created_at?: string
          id?: string
          owner_id: string
          renter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived?: boolean | null
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
      rent_management: {
        Row: {
          created_at: string
          due_date: string
          id: string
          notification_sent: boolean
          notification_sent_at: string | null
          owner_id: string
          rent_amount: number
          renter_id: string
          status: Database["public"]["Enums"]["rent_status_enum"]
          status_set_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          notification_sent?: boolean
          notification_sent_at?: string | null
          owner_id: string
          rent_amount: number
          renter_id: string
          status?: Database["public"]["Enums"]["rent_status_enum"]
          status_set_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          notification_sent?: boolean
          notification_sent_at?: string | null
          owner_id?: string
          rent_amount?: number
          renter_id?: string
          status?: Database["public"]["Enums"]["rent_status_enum"]
          status_set_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_management_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "safe_profile_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_management_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_management_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "safe_profile_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_management_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_status: {
        Row: {
          billing_month: string | null
          created_at: string
          current_amount: number
          due_date: string
          id: string
          last_payment_id: string | null
          relationship_id: string
          status: string
          updated_at: string
        }
        Insert: {
          billing_month?: string | null
          created_at?: string
          current_amount?: number
          due_date: string
          id?: string
          last_payment_id?: string | null
          relationship_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          billing_month?: string | null
          created_at?: string
          current_amount?: number
          due_date?: string
          id?: string
          last_payment_id?: string | null
          relationship_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_status_last_payment_id_fkey"
            columns: ["last_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_status_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_agreements: {
        Row: {
          created_at: string | null
          due_date: string | null
          end_date: string | null
          id: string
          monthly_rent: number
          next_due_date: string | null
          owner_id: string
          property_id: string
          renter_id: string
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          end_date?: string | null
          id?: string
          monthly_rent: number
          next_due_date?: string | null
          owner_id: string
          property_id: string
          renter_id: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          end_date?: string | null
          id?: string
          monthly_rent?: number
          next_due_date?: string | null
          owner_id?: string
          property_id?: string
          renter_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
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
          booking: boolean | null
          created_at: string
          description: string
          facilities: Json
          house_name: string | null
          house_no: string | null
          id: string
          images: string[] | null
          location: string
          location_latitude: number | null
          location_longitude: number | null
          owner_id: string
          owner_phone: string
          price: number
          room_number: string | null
          title: string
          updated_at: string | null
          videos: string[] | null
        }
        Insert: {
          available?: boolean
          booking?: boolean | null
          created_at?: string
          description: string
          facilities?: Json
          house_name?: string | null
          house_no?: string | null
          id?: string
          images?: string[] | null
          location: string
          location_latitude?: number | null
          location_longitude?: number | null
          owner_id: string
          owner_phone: string
          price: number
          room_number?: string | null
          title: string
          updated_at?: string | null
          videos?: string[] | null
        }
        Update: {
          available?: boolean
          booking?: boolean | null
          created_at?: string
          description?: string
          facilities?: Json
          house_name?: string | null
          house_no?: string | null
          id?: string
          images?: string[] | null
          location?: string
          location_latitude?: number | null
          location_longitude?: number | null
          owner_id?: string
          owner_phone?: string
          price?: number
          room_number?: string | null
          title?: string
          updated_at?: string | null
          videos?: string[] | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      top_rooms: {
        Row: {
          created_at: string
          id: string
          room_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "top_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "rooms_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          accommodation_type: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          data_classification: Json | null
          email: string | null
          fcm_token: string | null
          firebase_uid: string | null
          full_name: string | null
          hostel_pg_name: string | null
          house_number: string | null
          id: string
          is_owner_profile_complete: boolean | null
          location_latitude: number | null
          location_longitude: number | null
          phone: string | null
          property_address: Json | null
          property_location: string | null
          property_name: string | null
          public_id: string | null
          razorpay_account_id: string | null
          razorpay_merchant_id: string | null
          resident_type: string | null
          room_number: string | null
          total_rental_rooms: number | null
          updated_at: string
          upi_id: string | null
          upi_phone_number: string | null
        }
        Insert: {
          accommodation_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          data_classification?: Json | null
          email?: string | null
          fcm_token?: string | null
          firebase_uid?: string | null
          full_name?: string | null
          hostel_pg_name?: string | null
          house_number?: string | null
          id?: string
          is_owner_profile_complete?: boolean | null
          location_latitude?: number | null
          location_longitude?: number | null
          phone?: string | null
          property_address?: Json | null
          property_location?: string | null
          property_name?: string | null
          public_id?: string | null
          razorpay_account_id?: string | null
          razorpay_merchant_id?: string | null
          resident_type?: string | null
          room_number?: string | null
          total_rental_rooms?: number | null
          updated_at?: string
          upi_id?: string | null
          upi_phone_number?: string | null
        }
        Update: {
          accommodation_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          data_classification?: Json | null
          email?: string | null
          fcm_token?: string | null
          firebase_uid?: string | null
          full_name?: string | null
          hostel_pg_name?: string | null
          house_number?: string | null
          id?: string
          is_owner_profile_complete?: boolean | null
          location_latitude?: number | null
          location_longitude?: number | null
          phone?: string | null
          property_address?: Json | null
          property_location?: string | null
          property_name?: string | null
          public_id?: string | null
          razorpay_account_id?: string | null
          razorpay_merchant_id?: string | null
          resident_type?: string | null
          room_number?: string | null
          total_rental_rooms?: number | null
          updated_at?: string
          upi_id?: string | null
          upi_phone_number?: string | null
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          created_at: string
          email: string | null
          google_id: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          google_id?: string | null
          id?: string
          phone?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          google_id?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      rooms_public_view: {
        Row: {
          available: boolean | null
          booking: boolean | null
          created_at: string | null
          description: string | null
          facilities: Json | null
          house_name: string | null
          house_no: string | null
          id: string | null
          images: string[] | null
          location: string | null
          location_latitude: number | null
          location_longitude: number | null
          owner_id: string | null
          owner_phone: string | null
          price: number | null
          title: string | null
          updated_at: string | null
          videos: string[] | null
        }
        Insert: {
          available?: boolean | null
          booking?: boolean | null
          created_at?: string | null
          description?: string | null
          facilities?: Json | null
          house_name?: string | null
          house_no?: string | null
          id?: string | null
          images?: string[] | null
          location?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          owner_id?: string | null
          owner_phone?: string | null
          price?: number | null
          title?: string | null
          updated_at?: string | null
          videos?: string[] | null
        }
        Update: {
          available?: boolean | null
          booking?: boolean | null
          created_at?: string | null
          description?: string | null
          facilities?: Json | null
          house_name?: string | null
          house_no?: string | null
          id?: string | null
          images?: string[] | null
          location?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          owner_id?: string | null
          owner_phone?: string | null
          price?: number | null
          title?: string | null
          updated_at?: string | null
          videos?: string[] | null
        }
        Relationships: []
      }
      safe_profile_view: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          public_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          public_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          public_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_referral_code: {
        Args: { p_referral_code: string }
        Returns: boolean
      }
      archive_previous_connection_data: {
        Args: { new_owner_id: string; renter_user_id: string }
        Returns: undefined
      }
      can_access_owner_contact: {
        Args: { room_owner_id: string }
        Returns: boolean
      }
      can_access_user_profile: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_google_role_conflict: {
        Args: {
          email_param: string
          google_id_param: string
          requested_role: string
        }
        Returns: boolean
      }
      check_phone_role_conflict: {
        Args: { phone_param: string; requested_role: string }
        Returns: {
          existing_role: string
          has_conflict: boolean
        }[]
      }
      cleanup_stale_waiting_sessions: { Args: never; Returns: undefined }
      create_document_record: {
        Args: {
          p_document_type: string
          p_file_name: string
          p_file_path: string
          p_file_size: number
          p_file_type: string
          p_relationship_id: string
        }
        Returns: {
          archived: boolean | null
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
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_owner_notice: {
        Args: { p_message: string; p_renter_id: string; p_title?: string }
        Returns: {
          archived: boolean | null
          created_at: string
          id: string
          message: string
          owner_id: string
          renter_id: string
          title: string | null
        }
        SetofOptions: {
          from: "*"
          to: "notices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_referral_event: {
        Args: { p_referral_code: string }
        Returns: Json
      }
      ensure_unique_public_id: { Args: never; Returns: string }
      find_or_create_anonymous_chat: {
        Args: { user_id_param: string }
        Returns: string
      }
      generate_public_id: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_active_renter_relationships: {
        Args: { renter_user_id: string }
        Returns: {
          archived: boolean
          chat_room_id: string
          created_at: string
          id: string
          owner_id: string
          renter_id: string
          status: string
          updated_at: string
        }[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_or_create_referral_code: {
        Args: never
        Returns: {
          referral_code: string
          referral_id: string
        }[]
      }
      get_referrer_from_code: {
        Args: { p_referral_code: string }
        Returns: string
      }
      get_rent_management_with_reset: {
        Args: { p_owner_id?: string }
        Returns: {
          created_at: string
          due_date: string
          id: string
          notification_sent: boolean
          notification_sent_at: string
          owner_id: string
          rent_amount: number
          renter_id: string
          status: string
          status_set_at: string
          updated_at: string
        }[]
      }
      get_room_details_for_authenticated: {
        Args: never
        Returns: {
          available: boolean
          created_at: string
          description: string
          facilities: Json
          house_name: string
          house_no: string
          id: string
          images: string[]
          location: string
          location_latitude: number
          location_longitude: number
          owner_id: string
          owner_phone: string
          price: number
          title: string
          videos: string[]
        }[]
      }
      get_rooms_public: {
        Args: never
        Returns: {
          available: boolean
          created_at: string
          description: string
          facilities: Json
          house_name: string
          house_no: string
          id: string
          images: string[]
          location: string
          location_latitude: number
          location_longitude: number
          owner_id: string
          owner_phone: string
          price: number
          title: string
          videos: string[]
        }[]
      }
      get_user_fcm_tokens: {
        Args: { target_user_id: string }
        Returns: {
          token: string
        }[]
      }
      get_user_role: { Args: { user_uuid: string }; Returns: string }
      log_profile_access_attempt: {
        Args: { access_granted: boolean; target_user_id: string }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_resource_id?: string
          p_resource_type?: string
          p_severity?: string
          p_user_id: string
        }
        Returns: undefined
      }
      save_fcm_token: {
        Args: { p_device_id?: string; p_token: string }
        Returns: undefined
      }
      search_user_by_public_id: {
        Args: { search_public_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          public_id: string
        }[]
      }
      set_renter_monthly_rent: {
        Args: {
          p_monthly_rent: number
          p_next_due_date?: string
          p_renter_id: string
        }
        Returns: Json
      }
      submit_complaint: {
        Args: {
          p_description: string
          p_owner_id: string
          p_relationship_id: string
          p_title: string
        }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "complaints"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_room_availability_for_owner: {
        Args: { is_available: boolean; room_id: string }
        Returns: undefined
      }
      validate_relationship_access: {
        Args: { relationship_uuid: string; user_uuid: string }
        Returns: boolean
      }
      validate_sensitive_operation: {
        Args: { operation_type: string; user_uuid: string }
        Returns: boolean
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
      rent_payment_status: "pending" | "paid" | "unpaid"
      rent_status_enum: "paid" | "unpaid" | "pending"
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
      document_type: [
        "id_proof",
        "rental_agreement",
        "utility_bill",
        "income_proof",
        "other",
        "lease_agreement",
        "reference",
      ],
      rent_payment_status: ["pending", "paid", "unpaid"],
      rent_status_enum: ["paid", "unpaid", "pending"],
    },
  },
} as const
