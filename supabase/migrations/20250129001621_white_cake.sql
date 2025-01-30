/*
  # Add admin policies for matches table

  1. Changes
    - Add RLS policies for admins to manage matches
    - Allow admins to insert, update, and delete matches
    - Keep existing policy for authenticated users to view matches

  2. Security
    - Admins can perform all operations on matches
    - Regular users can only view matches
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON matches;

-- Create new policies
CREATE POLICY "Matches are viewable by authenticated users"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete matches"
  ON matches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );