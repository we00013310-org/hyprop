export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      config: {
        Row: {
          created_at: string
          key: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          value: Json
        }
        Update: {
          created_at?: string
          key?: string
          value?: Json
        }
        Relationships: []
      }
      equity_snapshots: {
        Row: {
          account_id: string
          daily_drawdown_flag: boolean
          equity: number
          fees_accrued: number
          funding_accrued: number
          id: string
          mark_seq: number | null
          max_drawdown_flag: boolean
          peak_equity_cached: number
          rpnl: number
          ts: string
          upnl: number
        }
        Insert: {
          account_id: string
          daily_drawdown_flag?: boolean
          equity: number
          fees_accrued?: number
          funding_accrued?: number
          id?: string
          mark_seq?: number | null
          max_drawdown_flag?: boolean
          peak_equity_cached: number
          rpnl?: number
          ts?: string
          upnl?: number
        }
        Update: {
          account_id?: string
          daily_drawdown_flag?: boolean
          equity?: number
          fees_accrued?: number
          funding_accrued?: number
          id?: string
          mark_seq?: number | null
          max_drawdown_flag?: boolean
          peak_equity_cached?: number
          rpnl?: number
          ts?: string
          upnl?: number
        }
        Relationships: [
          {
            foreignKeyName: "equity_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "funded_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          account_id: string | null
          id: string
          payload: Json
          ts: string
          type: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          id?: string
          payload?: Json
          ts?: string
          type: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          id?: string
          payload?: Json
          ts?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "funded_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      funded_accounts: {
        Row: {
          account_mode: string
          account_size: number
          created_at: string
          dd_daily: number
          dd_max: number
          fee_paid: number
          high_water_mark: number
          id: string
          last_withdrawal_ts: string | null
          profit_target: number
          status: string
          test_account_id: string
          updated_at: string
          user_id: string
          virtual_balance: number
        }
        Insert: {
          account_mode: string
          account_size: number
          created_at?: string
          dd_daily: number
          dd_max: number
          fee_paid?: number
          high_water_mark: number
          id?: string
          last_withdrawal_ts?: string | null
          profit_target: number
          status?: string
          test_account_id: string
          updated_at?: string
          user_id: string
          virtual_balance: number
        }
        Update: {
          account_mode?: string
          account_size?: number
          created_at?: string
          dd_daily?: number
          dd_max?: number
          fee_paid?: number
          high_water_mark?: number
          id?: string
          last_withdrawal_ts?: string | null
          profit_target?: number
          status?: string
          test_account_id?: string
          updated_at?: string
          user_id?: string
          virtual_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "funded_accounts_test_account_id_fkey"
            columns: ["test_account_id"]
            isOneToOne: false
            referencedRelation: "test_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funded_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pairs: {
        Row: {
          display_name: string
          fee_rate_maker: number
          fee_rate_taker: number
          last_refreshed_at: string
          leverage_cap: number
          lot_size: number
          status: string
          symbol: string
          tick_size: number
        }
        Insert: {
          display_name: string
          fee_rate_maker?: number
          fee_rate_taker?: number
          last_refreshed_at?: string
          leverage_cap?: number
          lot_size?: number
          status?: string
          symbol: string
          tick_size?: number
        }
        Update: {
          display_name?: string
          fee_rate_maker?: number
          fee_rate_taker?: number
          last_refreshed_at?: string
          leverage_cap?: number
          lot_size?: number
          status?: string
          symbol?: string
          tick_size?: number
        }
        Relationships: []
      }
      payouts: {
        Row: {
          account_id: string
          created_at: string
          gross_profit: number
          hyprop_amount: number
          id: string
          network: string
          period_end: string
          period_start: string
          profit_split_hyprop: number
          profit_split_trader: number
          status: string
          trader_amount: number
          tx_hash_hyprop: string | null
          tx_hash_trader: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          gross_profit: number
          hyprop_amount: number
          id?: string
          network: string
          period_end: string
          period_start: string
          profit_split_hyprop?: number
          profit_split_trader?: number
          status?: string
          trader_amount: number
          tx_hash_hyprop?: string | null
          tx_hash_trader?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          gross_profit?: number
          hyprop_amount?: number
          id?: string
          network?: string
          period_end?: string
          period_start?: string
          profit_split_hyprop?: number
          profit_split_trader?: number
          status?: string
          trader_amount?: number
          tx_hash_hyprop?: string | null
          tx_hash_trader?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "funded_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          account_id: string
          avg_entry: number
          created_at: string
          fees_accrued: number
          id: string
          last_update_ts: string
          margin_used: number
          rpnl: number
          side: string
          size: number
          symbol: string
          upnl: number
        }
        Insert: {
          account_id: string
          avg_entry?: number
          created_at?: string
          fees_accrued?: number
          id?: string
          last_update_ts?: string
          margin_used?: number
          rpnl?: number
          side: string
          size?: number
          symbol: string
          upnl?: number
        }
        Update: {
          account_id?: string
          avg_entry?: number
          created_at?: string
          fees_accrued?: number
          id?: string
          last_update_ts?: string
          margin_used?: number
          rpnl?: number
          side?: string
          size?: number
          symbol?: string
          upnl?: number
        }
        Relationships: [
          {
            foreignKeyName: "positions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "funded_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      test_account_checkpoints: {
        Row: {
          checkpoint_balance: number | null
          checkpoint_number: number
          checkpoint_passed: boolean | null
          checkpoint_ts: string | null
          created_at: string | null
          id: string
          required_balance: number | null
          test_account_id: string
        }
        Insert: {
          checkpoint_balance?: number | null
          checkpoint_number: number
          checkpoint_passed?: boolean | null
          checkpoint_ts?: string | null
          created_at?: string | null
          id?: string
          required_balance?: number | null
          test_account_id: string
        }
        Update: {
          checkpoint_balance?: number | null
          checkpoint_number?: number
          checkpoint_passed?: boolean | null
          checkpoint_ts?: string | null
          created_at?: string | null
          id?: string
          required_balance?: number | null
          test_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_account_checkpoints_test_account_id_fkey"
            columns: ["test_account_id"]
            isOneToOne: false
            referencedRelation: "test_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      test_accounts: {
        Row: {
          account_mode: string
          account_size: number
          checkpoint_interval_hours: number | null
          checkpoint_profit_target_percent: number | null
          created_at: string
          current_checkpoint: number | null
          dd_daily: number
          dd_max: number
          fee_paid: number
          high_water_mark: number
          hl_api_private_key: string | null
          hl_builder_code: string | null
          hl_key: string | null
          id: string
          last_withdrawal_ts: string | null
          num_checkpoints: number | null
          profit_target: number
          status: string
          updated_at: string
          user_id: string
          virtual_balance: number
        }
        Insert: {
          account_mode: string
          account_size: number
          checkpoint_interval_hours?: number | null
          checkpoint_profit_target_percent?: number | null
          created_at?: string
          current_checkpoint?: number | null
          dd_daily: number
          dd_max: number
          fee_paid: number
          high_water_mark: number
          hl_api_private_key?: string | null
          hl_builder_code?: string | null
          hl_key?: string | null
          id?: string
          last_withdrawal_ts?: string | null
          num_checkpoints?: number | null
          profit_target: number
          status?: string
          updated_at?: string
          user_id: string
          virtual_balance: number
        }
        Update: {
          account_mode?: string
          account_size?: number
          checkpoint_interval_hours?: number | null
          checkpoint_profit_target_percent?: number | null
          created_at?: string
          current_checkpoint?: number | null
          dd_daily?: number
          dd_max?: number
          fee_paid?: number
          high_water_mark?: number
          hl_api_private_key?: string | null
          hl_builder_code?: string | null
          hl_key?: string | null
          id?: string
          last_withdrawal_ts?: string | null
          num_checkpoints?: number | null
          profit_target?: number
          status?: string
          updated_at?: string
          user_id?: string
          virtual_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      test_positions: {
        Row: {
          avg_entry: number
          created_at: string
          fees_accrued: number
          id: string
          last_update_ts: string
          margin_used: number
          rpnl: number
          side: string
          size: number
          symbol: string
          test_account_id: string
          upnl: number
        }
        Insert: {
          avg_entry?: number
          created_at?: string
          fees_accrued?: number
          id?: string
          last_update_ts?: string
          margin_used?: number
          rpnl?: number
          side: string
          size?: number
          symbol: string
          test_account_id: string
          upnl?: number
        }
        Update: {
          avg_entry?: number
          created_at?: string
          fees_accrued?: number
          id?: string
          last_update_ts?: string
          margin_used?: number
          rpnl?: number
          side?: string
          size?: number
          symbol?: string
          test_account_id?: string
          upnl?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_positions_test_account_id_fkey"
            columns: ["test_account_id"]
            isOneToOne: false
            referencedRelation: "test_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_transfers: {
        Row: {
          account_id: string
          amount: number
          confirmed_at: string | null
          created_at: string
          direction: string
          id: string
          network: string
          status: string
          tx_hash: string | null
        }
        Insert: {
          account_id: string
          amount: number
          confirmed_at?: string | null
          created_at?: string
          direction: string
          id?: string
          network: string
          status?: string
          tx_hash?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          direction?: string
          id?: string
          network?: string
          status?: string
          tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treasury_transfers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "funded_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          kyc_status: string
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          kyc_status?: string
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          kyc_status?: string
          updated_at?: string
          wallet_address?: string | null
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

