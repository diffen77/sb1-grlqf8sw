/*
  # Add event number to matches table

  1. Changes
    - Add event_number column to matches table
    - Add index for event_number for efficient sorting
*/

-- Add event_number column
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS event_number integer;

-- Add index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_matches_event_number ON matches(event_number);