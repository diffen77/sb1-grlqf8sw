/*
  # Create admin profile

  1. Changes
    - Insert admin profile for user
    - Set role as 'admin'

  Note: The user must be created through the auth system first using the Supabase UI or API
*/

-- Insert admin profile if it doesn't exist
INSERT INTO public.profiles (id, role)
SELECT 
  id,
  'admin'
FROM auth.users
WHERE email = 'diffen@me.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';