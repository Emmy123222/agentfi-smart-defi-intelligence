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
      agents: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          wallet_address: string
          name: string
          strategy: 'trend' | 'momentum' | 'mean-reversion'
          risk_level: 'low' | 'medium' | 'high'
          allocated_amount: number
          status: 'created' | 'active' | 'paused' | 'stopped'
          token_pairs: string[]
          gas_settings: Json
          slippage_tolerance: number
          current_balance: number
          total_pnl: number
          total_trades: number
          win_rate: number
          last_signal_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          wallet_address: string
          name: string
          strategy: 'trend' | 'momentum' | 'mean-reversion'
          risk_level: 'low' | 'medium' | 'high'
          allocated_amount: number
          status?: 'created' | 'active' | 'paused' | 'stopped'
          token_pairs?: string[]
          gas_settings?: Json
          slippage_tolerance?: number
          current_balance?: number
          total_pnl?: number
          total_trades?: number
          win_rate?: number
          last_signal_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          wallet_address?: string
          name?: string
          strategy?: 'trend' | 'momentum' | 'mean-reversion'
          risk_level?: 'low' | 'medium' | 'high'
          allocated_amount?: number
          status?: 'created' | 'active' | 'paused' | 'stopped'
          token_pairs?: string[]
          gas_settings?: Json
          slippage_tolerance?: number
          current_balance?: number
          total_pnl?: number
          total_trades?: number
          win_rate?: number
          last_signal_at?: string | null
        }
        Relationships: []
      }
      trading_signals: {
        Row: {
          id: string
          created_at: string
          agent_id: string
          signal_type: 'BUY' | 'SELL' | 'HOLD'
          token_pair: string
          confidence_score: number
          reasoning: string
          price_target: number | null
          stop_loss: number | null
          position_size: number
          executed: boolean
          executed_at: string | null
          execution_price: number | null
          gas_used: number | null
          transaction_hash: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          agent_id: string
          signal_type: 'BUY' | 'SELL' | 'HOLD'
          token_pair: string
          confidence_score: number
          reasoning: string
          price_target?: number | null
          stop_loss?: number | null
          position_size: number
          executed?: boolean
          executed_at?: string | null
          execution_price?: number | null
          gas_used?: number | null
          transaction_hash?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          agent_id?: string
          signal_type?: 'BUY' | 'SELL' | 'HOLD'
          token_pair?: string
          confidence_score?: number
          reasoning?: string
          price_target?: number | null
          stop_loss?: number | null
          position_size?: number
          executed?: boolean
          executed_at?: string | null
          execution_price?: number | null
          gas_used?: number | null
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trading_signals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          wallet_address: string
          total_agents: number
          total_balance: number
          total_pnl: number
          preferred_risk_level: 'low' | 'medium' | 'high' | null
          notification_preferences: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          wallet_address: string
          total_agents?: number
          total_balance?: number
          total_pnl?: number
          preferred_risk_level?: 'low' | 'medium' | 'high' | null
          notification_preferences?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          wallet_address?: string
          total_agents?: number
          total_balance?: number
          total_pnl?: number
          preferred_risk_level?: 'low' | 'medium' | 'high' | null
          notification_preferences?: Json
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never