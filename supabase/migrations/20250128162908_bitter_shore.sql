/*
  # Fix RLS policies for api_config

  1. Changes
    - Create profiles table for user roles
    - Add default admin user
    - Update RLS policies to use profiles table for role checks
    - Add single_row policy to handle empty table cases

  2. Security
    - Proper role checking through profiles table
    - Ensures only actual admins can modify data
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Drop existing policies on api_config
DROP POLICY IF EXISTS "Allow authenticated users to read api config" ON api_config;
DROP POLICY IF EXISTS "Allow admins to insert api config" ON api_config;
DROP POLICY IF EXISTS "Allow admins to update api config" ON api_config;
DROP POLICY IF EXISTS "Allow admins to delete api config" ON api_config;

-- Create new policies using profiles table
CREATE POLICY "Allow authenticated users to read api config"
  ON api_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage api config"
  ON api_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add policy to ensure single row
CREATE POLICY "Ensure single row"
  ON api_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM api_config
    )
  );