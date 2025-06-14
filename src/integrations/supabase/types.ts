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
      business_settings: {
        Row: {
          address: string
          business_name: string
          email: string | null
          id: string
          phone: string
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string
          business_name?: string
          email?: string | null
          id?: string
          phone?: string
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          business_name?: string
          email?: string | null
          id?: string
          phone?: string
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          accountant_approved_at: string | null
          amount: number
          approved_by_accountant: string | null
          approved_by_director: string | null
          approved_by_manager: string | null
          created_at: string
          department: string
          description: string
          director_approved_at: string | null
          id: string
          manager_approved_at: string | null
          rejection_reason: string | null
          requested_by: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          accountant_approved_at?: string | null
          amount: number
          approved_by_accountant?: string | null
          approved_by_director?: string | null
          approved_by_manager?: string | null
          created_at?: string
          department: string
          description: string
          director_approved_at?: string | null
          id?: string
          manager_approved_at?: string | null
          rejection_reason?: string | null
          requested_by: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          accountant_approved_at?: string | null
          amount?: number
          approved_by_accountant?: string | null
          approved_by_director?: string | null
          approved_by_manager?: string | null
          created_at?: string
          department?: string
          description?: string
          director_approved_at?: string | null
          id?: string
          manager_approved_at?: string | null
          rejection_reason?: string | null
          requested_by?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: Database["public"]["Enums"]["department"]
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department: Database["public"]["Enums"]["department"]
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: Database["public"]["Enums"]["department"]
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount_received: number | null
          change_amount: number | null
          created_at: string
          created_by: string
          customer_name: string | null
          department: string
          id: string
          items: Json
          payment_method: string
          pump_number: string | null
          receipt_number: string
          subtotal: number
          table_number: string | null
          tax: number
          total: number
        }
        Insert: {
          amount_received?: number | null
          change_amount?: number | null
          created_at?: string
          created_by: string
          customer_name?: string | null
          department: string
          id?: string
          items: Json
          payment_method: string
          pump_number?: string | null
          receipt_number: string
          subtotal: number
          table_number?: string | null
          tax: number
          total: number
        }
        Update: {
          amount_received?: number | null
          change_amount?: number | null
          created_at?: string
          created_by?: string
          customer_name?: string | null
          department?: string
          id?: string
          items?: Json
          payment_method?: string
          pump_number?: string | null
          receipt_number?: string
          subtotal?: number
          table_number?: string | null
          tax?: number
          total?: number
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          department: Database["public"]["Enums"]["department"]
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          department: Database["public"]["Enums"]["department"]
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          department?: Database["public"]["Enums"]["department"]
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      department:
        | "executive"
        | "management"
        | "accounting"
        | "fuel"
        | "supermarket"
        | "restaurant"
      user_role:
        | "director"
        | "manager"
        | "accountant"
        | "fuel_cashier"
        | "supermarket_cashier"
        | "restaurant_cashier"
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
      department: [
        "executive",
        "management",
        "accounting",
        "fuel",
        "supermarket",
        "restaurant",
      ],
      user_role: [
        "director",
        "manager",
        "accountant",
        "fuel_cashier",
        "supermarket_cashier",
        "restaurant_cashier",
      ],
    },
  },
} as const
