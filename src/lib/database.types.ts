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
      draws: {
        Row: {
          id: string
          week_number: number
          year: number
          draw_date: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          week_number: number
          year: number
          draw_date: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          week_number?: number
          year?: number
          draw_date?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          details: Json
          performed_by: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details?: Json
          performed_by: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          details?: Json
          performed_by?: string
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          match_status: string
          match_status_id: number
          sport_event_status: string
          status_time: string | null
          draw_id: string
          home_team: string
          home_team_id: string | null
          home_team_short_name: string | null
          home_team_medium_name: string | null
          home_team_country_id: number | null
          home_team_country_name: string | null
          home_team_country_code: string | null
          away_team: string
          away_team_id: string | null
          away_team_short_name: string | null
          away_team_medium_name: string | null
          away_team_country_id: number | null
          away_team_country_name: string | null
          away_team_country_code: string | null
          league_id: number | null
          league_name: string | null
          league_country_id: number | null
          league_country_name: string | null
          league_country_code: string | null
          match_time: string
          home_odds: number
          draw_odds: number
          away_odds: number
          distribution_date: string | null
          distribution_ref_date: string | null
          home_distribution: number | null
          draw_distribution: number | null
          away_distribution: number | null
          home_ref_distribution: number | null
          draw_ref_distribution: number | null
          away_ref_distribution: number | null
          favourite_odds: Json | null
          start_odds: Json | null
          username: string
          status: string
          last_login: string | null
          metadata: Json | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_status: string
          match_status_id: number
          sport_event_status: string
          status_time?: string | null
          draw_id: string
          home_team: string
          home_team_id?: string | null
          home_team_short_name?: string | null
          home_team_medium_name?: string | null
          home_team_country_id?: number | null
          home_team_country_name?: string | null
          home_team_country_code?: string | null
          away_team: string
          away_team_id?: string | null
          away_team_short_name?: string | null
          away_team_medium_name?: string | null
          away_team_country_id?: number | null
          away_team_country_name?: string | null
          away_team_country_code?: string | null
          league_id?: number | null
          league_name?: string | null
          league_country_id?: number | null
          league_country_name?: string | null
          league_country_code?: string | null
          match_time: string
          home_odds: number
          draw_odds: number
          away_odds: number
          distribution_date?: string | null
          distribution_ref_date?: string | null
          home_distribution?: number | null
          draw_distribution?: number | null
          away_distribution?: number | null
          home_ref_distribution?: number | null
          draw_ref_distribution?: number | null
          away_ref_distribution?: number | null
          favourite_odds?: Json | null
          start_odds?: Json | null
          username: string
          status?: string
          last_login?: string | null
          metadata?: Json | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_status?: string
          match_status_id?: number
          sport_event_status?: string
          status_time?: string | null
          draw_id?: string
          home_team?: string
          home_team_id?: string | null
          home_team_short_name?: string | null
          home_team_medium_name?: string | null
          home_team_country_id?: number | null
          home_team_country_name?: string | null
          home_team_country_code?: string | null
          away_team?: string
          away_team_id?: string | null
          away_team_short_name?: string | null
          away_team_medium_name?: string | null
          away_team_country_id?: number | null
          away_team_country_name?: string | null
          away_team_country_code?: string | null
          league_id?: number | null
          league_name?: string | null
          league_country_id?: number | null
          league_country_name?: string | null
          league_country_code?: string | null
          match_time?: string
          home_odds?: number
          draw_odds?: number
          away_odds?: number
          distribution_date?: string | null
          distribution_ref_date?: string | null
          home_distribution?: number | null
          draw_distribution?: number | null
          away_distribution?: number | null
          home_ref_distribution?: number | null
          draw_ref_distribution?: number | null
          away_ref_distribution?: number | null
          favourite_odds?: Json | null
          start_odds?: Json | null
          username?: string
          status?: string
          last_login?: string | null
          metadata?: Json | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bet_slips: {
        Row: {
          id: string
          user_id: string
          total_cost: number
          created_at: string
          status: string
        }
        Insert: {
          id?: string
          user_id: string
          total_cost: number
          created_at?: string
          status?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_cost?: number
          created_at?: string
          status?: string
        }
      }
      bet_selections: {
        Row: {
          id: string
          bet_slip_id: string
          match_id: string
          selection: string
          odds_at_time: number
          created_at: string
        }
        Insert: {
          id?: string
          bet_slip_id: string
          match_id: string
          selection: string
          odds_at_time: number
          created_at?: string
        }
        Update: {
          id?: string
          bet_slip_id?: string
          match_id?: string
          selection?: string
          odds_at_time?: number
          created_at?: string
        }
      }
    }
  }
}