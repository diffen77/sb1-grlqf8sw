/*
  # Create admin user

  1. Changes
    - Creates admin user if it doesn't exist
    - Sets up admin role and permissions
    - Ensures proper profile setup

  2. Security
    - Uses secure password hashing
    - Sets up proper role-based access
*/

-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- Check if the user already exists
  SELECT id INTO admin_uid
  FROM auth.users
  WHERE email = 'diffen@me.com';

  -- If user doesn't exist, create them
  IF admin_uid IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'diffen@me.com',
      crypt('Password8', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_uid;
  END IF;

  -- Ensure profile exists and has admin role
  INSERT INTO public.profiles (id, role)
  VALUES (admin_uid, 'admin')
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();

END $$;