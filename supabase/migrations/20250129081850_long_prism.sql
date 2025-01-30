/*
  # Update match schema for new API format

  1. New Columns
    - Add columns for participant details
    - Add columns for league information
    - Add columns for betting metrics
    - Add columns for Svenska Folket data

  2. Changes
    - Update existing columns to match API format
    - Add new constraints and indexes
*/

-- Add new columns for participant details
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS home_team_id text,
ADD COLUMN IF NOT EXISTS home_team_short_name text,
ADD COLUMN IF NOT EXISTS home_team_medium_name text,
ADD COLUMN IF NOT EXISTS home_team_country_id integer,
ADD COLUMN IF NOT EXISTS home_team_country_name text,
ADD COLUMN IF NOT EXISTS home_team_country_code text,
ADD COLUMN IF NOT EXISTS away_team_id text,
ADD COLUMN IF NOT EXISTS away_team_short_name text,
ADD COLUMN IF NOT EXISTS away_team_medium_name text,
ADD COLUMN IF NOT EXISTS away_team_country_id integer,
ADD COLUMN IF NOT EXISTS away_team_country_name text,
ADD COLUMN IF NOT EXISTS away_team_country_code text;

-- Add columns for match status
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS match_status text,
ADD COLUMN IF NOT EXISTS match_status_id integer,
ADD COLUMN IF NOT EXISTS sport_event_status text,
ADD COLUMN IF NOT EXISTS status_time timestamptz;

-- Add columns for league information
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS league_id integer,
ADD COLUMN IF NOT EXISTS league_name text,
ADD COLUMN IF NOT EXISTS league_country_id integer,
ADD COLUMN IF NOT EXISTS league_country_name text,
ADD COLUMN IF NOT EXISTS league_country_code text;

-- Add columns for betting metrics
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS distribution_date timestamptz,
ADD COLUMN IF NOT EXISTS distribution_ref_date timestamptz,
ADD COLUMN IF NOT EXISTS home_distribution integer,
ADD COLUMN IF NOT EXISTS draw_distribution integer,
ADD COLUMN IF NOT EXISTS away_distribution integer,
ADD COLUMN IF NOT EXISTS home_ref_distribution integer,
ADD COLUMN IF NOT EXISTS draw_ref_distribution integer,
ADD COLUMN IF NOT EXISTS away_ref_distribution integer,
ADD COLUMN IF NOT EXISTS favourite_odds jsonb,
ADD COLUMN IF NOT EXISTS start_odds jsonb;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_matches_match_time ON matches(match_time);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(match_status);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league_id);

-- Add check constraints
ALTER TABLE matches
ADD CONSTRAINT valid_distribution 
CHECK (
  home_distribution BETWEEN 0 AND 100 AND
  draw_distribution BETWEEN 0 AND 100 AND
  away_distribution BETWEEN 0 AND 100 AND
  home_distribution + draw_distribution + away_distribution = 100
);