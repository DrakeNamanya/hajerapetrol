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
      account_credentials: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          is_password_changed: boolean
          temporary_password: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          is_password_changed?: boolean
          temporary_password: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          is_password_changed?: boolean
          temporary_password?: string
          user_id?: string | null
        }
        Relationships: []
      }
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
      inventory_items: {
        Row: {
          barcode: string | null
          category: string
          cost_price: number
          created_at: string
          created_by: string | null
          current_stock: number
          department: string
          description: string | null
          expiry_date: string | null
          id: string
          is_active: boolean
          maximum_stock: number
          minimum_stock: number
          name: string
          sku: string | null
          supplier_contact: string | null
          supplier_name: string | null
          unit_of_measure: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category: string
          cost_price?: number
          created_at?: string
          created_by?: string | null
          current_stock?: number
          department: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          maximum_stock?: number
          minimum_stock?: number
          name: string
          sku?: string | null
          supplier_contact?: string | null
          supplier_name?: string | null
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category?: string
          cost_price?: number
          created_at?: string
          created_by?: string | null
          current_stock?: number
          department?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          maximum_stock?: number
          minimum_stock?: number
          name?: string
          sku?: string | null
          supplier_contact?: string | null
          supplier_name?: string | null
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      low_stock_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_level: string
          created_at: string
          current_stock: number
          id: string
          is_acknowledged: boolean
          item_id: string
          minimum_stock: number
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_level?: string
          created_at?: string
          current_stock: number
          id?: string
          is_acknowledged?: boolean
          item_id: string
          minimum_stock: number
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_level?: string
          created_at?: string
          current_stock?: number
          id?: string
          is_acknowledged?: boolean
          item_id?: string
          minimum_stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "low_stock_alerts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
          department?: Database["public"]["Enums"]["department"]
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          id: string
          item_id: string
          notes: string | null
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number
          total_cost: number
          unit_cost: number
        }
        Insert: {
          id?: string
          item_id: string
          notes?: string | null
          purchase_order_id: string
          quantity_ordered: number
          quantity_received?: number
          total_cost: number
          unit_cost: number
        }
        Update: {
          id?: string
          item_id?: string
          notes?: string | null
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          status: string
          supplier_contact: string | null
          supplier_name: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          status?: string
          supplier_contact?: string | null
          supplier_name: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: string
          supplier_contact?: string | null
          supplier_name?: string
          total_amount?: number
          updated_at?: string
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
      sales: {
        Row: {
          accountant_approved_at: string | null
          amount_received: number | null
          approved_by_accountant: string | null
          approved_by_manager: string | null
          change_amount: number | null
          created_at: string
          created_by: string
          customer_name: string | null
          department: string
          id: string
          items: Json
          manager_approved_at: string | null
          payment_method: string
          pump_number: string | null
          sale_type: string
          status: string
          subtotal: number
          table_number: string | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          accountant_approved_at?: string | null
          amount_received?: number | null
          approved_by_accountant?: string | null
          approved_by_manager?: string | null
          change_amount?: number | null
          created_at?: string
          created_by: string
          customer_name?: string | null
          department: string
          id?: string
          items: Json
          manager_approved_at?: string | null
          payment_method: string
          pump_number?: string | null
          sale_type: string
          status?: string
          subtotal?: number
          table_number?: string | null
          tax?: number
          total: number
          updated_at?: string
        }
        Update: {
          accountant_approved_at?: string | null
          amount_received?: number | null
          approved_by_accountant?: string | null
          approved_by_manager?: string | null
          change_amount?: number | null
          created_at?: string
          created_by?: string
          customer_name?: string | null
          department?: string
          id?: string
          items?: Json
          manager_approved_at?: string | null
          payment_method?: string
          pump_number?: string | null
          sale_type?: string
          status?: string
          subtotal?: number
          table_number?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_by: string | null
          department: string
          id: string
          item_id: string
          movement_date: string
          movement_type: string
          new_stock: number
          notes: string | null
          previous_stock: number
          quantity: number
          reference_id: string | null
          reference_type: string | null
          total_value: number | null
          unit_cost: number | null
        }
        Insert: {
          created_by?: string | null
          department: string
          id?: string
          item_id: string
          movement_date?: string
          movement_type: string
          new_stock: number
          notes?: string | null
          previous_stock: number
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          total_value?: number | null
          unit_cost?: number | null
        }
        Update: {
          created_by?: string | null
          department?: string
          id?: string
          item_id?: string
          movement_date?: string
          movement_type?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          total_value?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
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
