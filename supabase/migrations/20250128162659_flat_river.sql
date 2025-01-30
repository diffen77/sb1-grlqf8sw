/*
  # Fix API config table policies

  1. Changes
    - Drop existing RLS policies for api_config table
    - Create new policies that properly handle both authenticated and admin users
    - Ensure admins can manage all records while authenticated users can only read

  2. Security
    - Policies updated to use proper role checks
    - Separate policies for different operations (select, insert, update)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow everyone to read api config" ON api_config;
DROP POLICY IF EXISTS "Allow admins to manage api config" ON api_config;

-- Create new policies
CREATE POLICY "Allow authenticated users to read api config"
  ON api_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to insert api config"
  ON api_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Allow admins to update api config"
  ON api_config
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Allow admins to delete api config"
  ON api_config
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );