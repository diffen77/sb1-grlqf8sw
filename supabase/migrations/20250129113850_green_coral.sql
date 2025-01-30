/*
  # Add user selections table

  1. New Tables
    - `user_selections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `match_id` (uuid, references matches)
      - `selection` (text, one of '1', 'X', '2')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_selections` table
    - Add policies for users to manage their own selections
*/

-- Create user_selections table
CREATE TABLE user_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  match_id uuid REFERENCES matches NOT NULL,
  selection text NOT NULL CHECK (selection IN ('1', 'X', '2')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, match_id)
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

CREATE POLICY "Users can update their own selections"
  ON user_selections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own selections"
  ON user_selections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_selections_updated_at
  BEFORE UPDATE ON user_selections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();