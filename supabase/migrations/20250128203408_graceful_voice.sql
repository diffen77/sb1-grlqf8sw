/*
  # Fix authentication setup

  1. Changes
    - Properly creates admin user with correct password hashing
    - Ensures email is confirmed
    - Sets up proper authentication metadata
    - Updates profile with admin role

  2. Security
    - Uses secure password hashing
    - Sets up proper authentication state
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
      '{"provider":"email","providers":["email"]}',
      '{"name":"Admin User"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_uid;
  ELSE
    -- Update existing user's password and ensure email is confirmed
    UPDATE auth.users
    SET 
      encrypted_password = crypt('Password8', gen_salt('bf')),
      email_confirmed_at = NOW(),
      updated_at = NOW(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'
    WHERE id = admin_uid;
  END IF;

  -- Ensure profile exists and has admin role
  INSERT INTO public.profiles (id, role)
  VALUES (admin_uid, 'admin')
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'admin',
    updated_at = NOW();

END $$;