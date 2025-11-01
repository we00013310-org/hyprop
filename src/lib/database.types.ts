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
      users: {
        Row: {
          id: string
          email: string | null
          wallet_address: string | null
          kyc_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          wallet_address?: string | null
          kyc_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          wallet_address?: string | null
          kyc_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      pairs: {
        Row: {
          symbol: string
          display_name: string
          leverage_cap: number
          tick_size: number
          lot_size: number
          fee_rate_maker: number
          fee_rate_taker: number
          status: string
          last_refreshed_at: string
        }
        Insert: {
          symbol: string
          display_name: string
          leverage_cap?: number
          tick_size?: number
          lot_size?: number
          fee_rate_maker?: number
          fee_rate_taker?: number
          status?: string
          last_refreshed_at?: string
        }
        Update: {
          symbol?: string
          display_name?: string
          leverage_cap?: number
          tick_size?: number
          lot_size?: number
          fee_rate_maker?: number
          fee_rate_taker?: number
          status?: string
          last_refreshed_at?: string
        }
      }
      test_accounts: {
        Row: {
          id: string
          user_id: string
          account_size: number
          account_mode: string
          fee_paid: number
          virtual_balance: number
          dd_max: number
          dd_daily: number
          profit_target: number
          high_water_mark: number
          last_withdrawal_ts: string | null
          hl_api_private_key: string | null
          hl_builder_code: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_size: number
          account_mode: string
          fee_paid: number
          virtual_balance: number
          dd_max: number
          dd_daily: number
          profit_target: number
          high_water_mark: number
          last_withdrawal_ts?: string | null
          hl_api_private_key?: string | null
          hl_builder_code?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_size?: number
          account_mode?: string
          fee_paid?: number
          virtual_balance?: number
          dd_max?: number
          dd_daily?: number
          profit_target?: number
          high_water_mark?: number
          last_withdrawal_ts?: string | null
          hl_api_private_key?: string | null
          hl_builder_code?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      funded_accounts: {
        Row: {
          id: string
          user_id: string
          test_account_id: string | null
          primary_symbol: string
          pair_mode: string
          l_user: number
          n_max: number
          l_effective: number
          im_required: number
          maintenance_margin: number
          balance_actual: number
          dd_max: number
          dd_daily: number
          e_start: number
          e_day_start: number | null
          high_water_mark: number
          last_withdrawal_ts: string | null
          status: string
          hl_subaccount_id: string | null
          hl_builder_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          test_account_id?: string | null
          primary_symbol: string
          pair_mode?: string
          l_user: number
          n_max: number
          l_effective: number
          im_required: number
          maintenance_margin: number
          balance_actual: number
          dd_max: number
          dd_daily: number
          e_start: number
          e_day_start?: number | null
          high_water_mark: number
          last_withdrawal_ts?: string | null
          status?: string
          hl_subaccount_id?: string | null
          hl_builder_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          test_account_id?: string | null
          primary_symbol?: string
          pair_mode?: string
          l_user?: number
          n_max?: number
          l_effective?: number
          im_required?: number
          maintenance_margin?: number
          balance_actual?: number
          dd_max?: number
          dd_daily?: number
          e_start?: number
          e_day_start?: number | null
          high_water_mark?: number
          last_withdrawal_ts?: string | null
          status?: string
          hl_subaccount_id?: string | null
          hl_builder_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      positions: {
        Row: {
          id: string
          account_id: string
          symbol: string
          side: string
          size: number
          avg_entry: number
          upnl: number
          rpnl: number
          fees_accrued: number
          funding_accrued: number
          last_update_ts: string
        }
        Insert: {
          id?: string
          account_id: string
          symbol: string
          side: string
          size?: number
          avg_entry?: number
          upnl?: number
          rpnl?: number
          fees_accrued?: number
          funding_accrued?: number
          last_update_ts?: string
        }
        Update: {
          id?: string
          account_id?: string
          symbol?: string
          side?: string
          size?: number
          avg_entry?: number
          upnl?: number
          rpnl?: number
          fees_accrued?: number
          funding_accrued?: number
          last_update_ts?: string
        }
      }
      equity_snapshots: {
        Row: {
          id: string
          account_id: string
          ts: string
          equity: number
          peak_equity_cached: number
          upnl: number
          rpnl: number
          fees_accrued: number
          funding_accrued: number
          mark_seq: number | null
          daily_drawdown_flag: boolean
          max_drawdown_flag: boolean
        }
        Insert: {
          id?: string
          account_id: string
          ts?: string
          equity: number
          peak_equity_cached: number
          upnl?: number
          rpnl?: number
          fees_accrued?: number
          funding_accrued?: number
          mark_seq?: number | null
          daily_drawdown_flag?: boolean
          max_drawdown_flag?: boolean
        }
        Update: {
          id?: string
          account_id?: string
          ts?: string
          equity?: number
          peak_equity_cached?: number
          upnl?: number
          rpnl?: number
          fees_accrued?: number
          funding_accrued?: number
          mark_seq?: number | null
          daily_drawdown_flag?: boolean
          max_drawdown_flag?: boolean
        }
      }
      events: {
        Row: {
          id: string
          ts: string
          account_id: string | null
          user_id: string | null
          type: string
          payload: Json
        }
        Insert: {
          id?: string
          ts?: string
          account_id?: string | null
          user_id?: string | null
          type: string
          payload?: Json
        }
        Update: {
          id?: string
          ts?: string
          account_id?: string | null
          user_id?: string | null
          type?: string
          payload?: Json
        }
      }
      treasury_transfers: {
        Row: {
          id: string
          account_id: string
          tx_hash: string | null
          direction: string
          amount: number
          network: string
          status: string
          created_at: string
          confirmed_at: string | null
        }
        Insert: {
          id?: string
          account_id: string
          tx_hash?: string | null
          direction: string
          amount: number
          network: string
          status?: string
          created_at?: string
          confirmed_at?: string | null
        }
        Update: {
          id?: string
          account_id?: string
          tx_hash?: string | null
          direction?: string
          amount?: number
          network?: string
          status?: string
          created_at?: string
          confirmed_at?: string | null
        }
      }
      payouts: {
        Row: {
          id: string
          account_id: string
          period_start: string
          period_end: string
          gross_profit: number
          profit_split_trader: number
          profit_split_hyprop: number
          trader_amount: number
          hyprop_amount: number
          network: string
          tx_hash_trader: string | null
          tx_hash_hyprop: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          account_id: string
          period_start: string
          period_end: string
          gross_profit: number
          profit_split_trader?: number
          profit_split_hyprop?: number
          trader_amount: number
          hyprop_amount: number
          network: string
          tx_hash_trader?: string | null
          tx_hash_hyprop?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          period_start?: string
          period_end?: string
          gross_profit?: number
          profit_split_trader?: number
          profit_split_hyprop?: number
          trader_amount?: number
          hyprop_amount?: number
          network?: string
          tx_hash_trader?: string | null
          tx_hash_hyprop?: string | null
          status?: string
          created_at?: string
        }
      }
      config: {
        Row: {
          key: string
          value: Json
          created_at: string
        }
        Insert: {
          key: string
          value: Json
          created_at?: string
        }
        Update: {
          key?: string
          value?: Json
          created_at?: string
        }
      }
    }
  }
}
