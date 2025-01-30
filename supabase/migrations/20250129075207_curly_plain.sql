/*
  # Add visibility and display order columns to matches

  1. Changes
    - Add `visible` column to matches table (boolean, defaults to true)
    - Add `display_order` column to matches table (integer, defaults to 0)
    - Update existing rows with default values
*/

-- Add new columns
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS visible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update existing rows to have sequential display_order
WITH numbered_matches AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY match_time) - 1 as new_order
  FROM matches
)
UPDATE matches
SET display_order = numbered_matches.new_order
FROM numbered_matches
WHERE matches.id = numbered_matches.id;