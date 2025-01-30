/*
  # 50-lappen Betting Database Schema

  1. New Tables
    - `matches`
      - `id` (uuid, primary key)
      - `home_team` (text)
      - `away_team` (text)
      - `match_time` (timestamptz)
      - `home_odds` (decimal)
      - `draw_odds` (decimal)
      - `away_odds` (decimal)
      - `home_form` (text)
      - `away_form` (text)
      - `head_to_head` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `bet_slips`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `total_cost` (decimal)
      - `created_at` (timestamptz)
      - `status` (text)

    - `bet_selections`
      - `id` (uuid, primary key)
      - `bet_slip_id` (uuid, references bet_slips)
      - `match_id` (uuid, references matches)
      - `selection` (text)
      - `odds_at_time` (decimal)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to:
      - Read matches (all users)
      - Read their own bet slips and selections
      - Create new bet slips and selections
*/

-- Create matches table
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team text NOT NULL,
  away_team text NOT NULL,
  match_time timestamptz NOT NULL,
  home_odds decimal NOT NULL,
  draw_odds decimal NOT NULL,
  away_odds decimal NOT NULL,
  home_form text,
  away_form text,
  head_to_head text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bet_slips table
CREATE TABLE bet_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  total_cost decimal NOT NULL,
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
);

-- Create bet_selections table
CREATE TABLE bet_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_slip_id uuid REFERENCES bet_slips ON DELETE CASCADE NOT NULL,
  match_id uuid REFERENCES matches NOT NULL,
  selection text NOT NULL CHECK (selection IN ('1', 'X', '2')),
  odds_at_time decimal NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_selections ENABLE ROW LEVEL SECURITY;

-- Matches policies
CREATE POLICY "Matches are viewable by everyone"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

-- Bet slips policies
CREATE POLICY "Users can view their own bet slips"
  ON bet_slips FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bet slips"
  ON bet_slips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Bet selections policies
CREATE POLICY "Users can view their own bet selections"
  ON bet_selections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bet_slips
      WHERE bet_slips.id = bet_selections.bet_slip_id
      AND bet_slips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bet selections for their own bet slips"
  ON bet_selections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bet_slips
      WHERE bet_slips.id = bet_slip_id
      AND bet_slips.user_id = auth.uid()
    )
  );