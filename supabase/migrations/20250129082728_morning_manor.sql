/*
  # Add draws table and update matches schema

  1. New Tables
    - `draws`
      - `id` (uuid, primary key)
      - `week_number` (integer)
      - `year` (integer)
      - `draw_date` (timestamptz)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `draw_id` to matches table
    - Add unique constraint on week_number and year
    - Add RLS policies for draws table
*/

-- Create draws table
CREATE TABLE IF NOT EXISTS draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer NOT NULL,
  year integer NOT NULL,
  draw_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (week_number, year)
);

-- Add draw_id to matches
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS draw_id uuid REFERENCES draws(id);

-- Enable RLS
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

-- Create policies for draws table
CREATE POLICY "Draws are viewable by authenticated users"
  ON draws FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert draws"
  ON draws FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update draws"
  ON draws FOR UPDATE
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

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_draws_updated_at
  BEFORE UPDATE ON draws
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();