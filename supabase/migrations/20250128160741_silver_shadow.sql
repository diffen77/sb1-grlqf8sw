/*
  # Add API Configuration Table
  
  1. New Tables
    - `api_config`
      - `id` (uuid, primary key)
      - `api_url` (text, not null)
      - `last_updated` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `api_config` table
    - Add policy for authenticated users to read configuration
    - Add policy for authenticated users with admin claim to manage configuration
*/

-- Create api_config table
CREATE TABLE api_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_config ENABLE ROW LEVEL SECURITY;

-- Create policy for everyone to read api config
CREATE POLICY "Allow everyone to read api config"
  ON api_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for admins to manage api config
CREATE POLICY "Allow admins to manage api config"
  ON api_config
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');