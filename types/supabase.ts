export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      routes: {
        Row: {
          id: string
          name: string
          start_location: string
          end_location: string
          fare_amount: number
          estimated_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          start_location: string
          end_location: string
          fare_amount: number
          estimated_time: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_location?: string
          end_location?: string
          fare_amount?: number
          estimated_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          plate_number: string
          route_id: string
          capacity: number
          current_location: { latitude: number; longitude: number } | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plate_number: string
          route_id: string
          capacity: number
          current_location?: { latitude: number; longitude: number } | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plate_number?: string
          route_id?: string
          capacity?: number
          current_location?: { latitude: number; longitude: number } | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      stages: {
        Row: {
          id: string
          name: string
          location: { latitude: number; longitude: number }
          route_id: string
          order_number: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: { latitude: number; longitude: number }
          route_id: string
          order_number: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: { latitude: number; longitude: number }
          route_id?: string
          order_number?: number
          created_at?: string
          updated_at?: string
        }
      }
      fare_reports: {
        Row: {
          id: string
          route_id: string
          user_id: string
          fare_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          route_id: string
          user_id: string
          fare_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          route_id?: string
          user_id?: string
          fare_amount?: number
          created_at?: string
        }
      }
      congestion_reports: {
        Row: {
          id: string
          route_id: string
          user_id: string
          level: 'low' | 'medium' | 'high'
          location: { latitude: number; longitude: number }
          created_at: string
        }
        Insert: {
          id?: string
          route_id: string
          user_id: string
          level: 'low' | 'medium' | 'high'
          location: { latitude: number; longitude: number }
          created_at?: string
        }
        Update: {
          id?: string
          route_id?: string
          user_id?: string
          level?: 'low' | 'medium' | 'high'
          location?: { latitude: number; longitude: number }
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          preferred_routes: string[] | null
          theme_preference: 'light' | 'dark' | 'system'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          preferred_routes?: string[] | null
          theme_preference?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          preferred_routes?: string[] | null
          theme_preference?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
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
  }
}