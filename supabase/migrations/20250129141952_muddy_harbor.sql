/*
  # Fix user selections table

  1. Changes
    - Drop existing user_selections table
    - Create new user_selections table with composite primary key
    - Add proper indexes and constraints
    - Update RLS policies
*/

-- Drop existing table
DROP TABLE IF EXISTS user_selections;

-- Create new user_selections table with composite primary key
CREATE TABLE user_selections (
  user_id uuid REFERENCES auth.users NOT NULL,
  match_id uuid REFERENCES matches NOT NULL,
  selection text NOT NULL CHECK (selection IN ('1', 'X', '2')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Make user_id, match_id, and selection the primary key
  PRIMARY KEY (user_id, match_id, selection)
);

-- Enable RLS
ALTER TABLE user_selections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own selections"
  ON user_selections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own selections"
  ON user_selections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own selections"
  ON user_selections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_user_selections_user_match ON user_selections(user_id, match_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_selections_updated_at
  BEFORE UPDATE ON user_selections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();