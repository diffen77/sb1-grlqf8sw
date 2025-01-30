/*
  # Add Initial API Configuration Data
  
  1. Data Changes
    - Insert default API configuration if none exists
*/

DO $$ 
BEGIN
  -- Only insert if no records exist
  IF NOT EXISTS (SELECT 1 FROM api_config) THEN
    INSERT INTO api_config (api_url)
    VALUES ('https://api.example.com/matches');
  END IF;
END $$;