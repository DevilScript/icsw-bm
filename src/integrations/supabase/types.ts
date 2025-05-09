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
      admin_auth: {
        Row: {
          auth_key: string
          created_at: string
          device_fingerprint: string
          expires_at: string
          id: string
          ip_address: string
          key_hash: string
          nonce: string
          used: boolean
        }
        Insert: {
          auth_key: string
          created_at?: string
          device_fingerprint: string
          expires_at: string
          id?: string
          ip_address: string
          key_hash: string
          nonce: string
          used?: boolean
        }
        Update: {
          auth_key?: string
          created_at?: string
          device_fingerprint?: string
          expires_at?: string
          id?: string
          ip_address?: string
          key_hash?: string
          nonce?: string
          used?: boolean
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string
          expires_at: string
          id: string
          ip_address: string
          last_active: string
          session_token: string
          user_agent: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          expires_at: string
          id?: string
          ip_address: string
          last_active?: string
          session_token: string
          user_agent: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          expires_at?: string
          id?: string
          ip_address?: string
          last_active?: string
          session_token?: string
          user_agent?: string
        }
        Relationships: []
      }
      set_clan: {
        Row: {
          clan: string
          count: number
          created_at: string | null
          faction: string
          id: string
          updated_at: string | null
        }
        Insert: {
          clan: string
          count?: number
          created_at?: string | null
          faction: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          clan?: string
          count?: number
          created_at?: string | null
          faction?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      set_id: {
        Row: {
          clan: string
          created_at: string | null
          game_id: string
          gp: number
          id: string
          is_active: boolean
          is_kagune_v2: boolean
          kagune: string
          link: string | null
          price: number
          rank: string
          rc: number
          updated_at: string | null
        }
        Insert: {
          clan: string
          created_at?: string | null
          game_id: string
          gp: number
          id?: string
          is_active?: boolean
          is_kagune_v2?: boolean
          kagune: string
          link?: string | null
          price: number
          rank: string
          rc: number
          updated_at?: string | null
        }
        Update: {
          clan?: string
          created_at?: string | null
          game_id?: string
          gp?: number
          id?: string
          is_active?: boolean
          is_kagune_v2?: boolean
          kagune?: string
          link?: string | null
          price?: number
          rank?: string
          rc?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      set_rc: {
        Row: {
          created_at: string | null
          id: string
          price: number
          rc: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price: number
          rc: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number
          rc?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      two_factor_auth: {
        Row: {
          auth_code: string
          contact_method: string
          contact_value: string
          created_at: string
          expires_at: string
          id: string
          verified: boolean
        }
        Insert: {
          auth_code: string
          contact_method: string
          contact_value: string
          created_at?: string
          expires_at: string
          id?: string
          verified?: boolean
        }
        Update: {
          auth_code?: string
          contact_method?: string
          contact_value?: string
          created_at?: string
          expires_at?: string
          id?: string
          verified?: boolean
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
    Enums: {},
  },
} as const
