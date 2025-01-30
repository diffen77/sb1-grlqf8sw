/*
  # Email Configuration and Logging Setup

  1. Tables
    - Create error_logs table for tracking email errors
    - Create email_config table for SMTP settings
  
  2. Security
    - Enable RLS on both tables
    - Add admin-only policies
*/

-- Create error_logs table first
CREATE TABLE error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  error_message text NOT NULL,
  error_details jsonb,
  context text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view error logs
CREATE POLICY "Admins can view error logs"
  ON error_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create email configuration table
CREATE TABLE email_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host text NOT NULL,
  smtp_port integer NOT NULL,
  smtp_user text NOT NULL,
  smtp_password text NOT NULL,
  from_email text NOT NULL,
  from_name text NOT NULL,
  reply_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_config CHECK (id = '00000000-0000-0000-0000-000000000000')
);

-- Enable RLS on email_config
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage email config
CREATE POLICY "Admins can manage email config"
  ON email_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to send email
CREATE OR REPLACE FUNCTION send_email(
  to_email text,
  subject text,
  html_body text,
  text_body text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config email_config;
BEGIN
  -- Get email configuration
  SELECT * INTO config
  FROM email_config
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email configuration not found';
  END IF;

  -- Log the attempt
  INSERT INTO error_logs (
    error_type,
    error_message,
    error_details,
    context
  ) VALUES (
    'EMAIL_ATTEMPT',
    'Attempting to send email',
    jsonb_build_object(
      'to', to_email,
      'subject', subject
    ),
    'send_email function'
  );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    INSERT INTO error_logs (
      error_type,
      error_message,
      error_details,
      context
    ) VALUES (
      'EMAIL_SEND_ERROR',
      SQLERRM,
      jsonb_build_object(
        'to_email', to_email,
        'subject', subject,
        'error_state', SQLSTATE
      ),
      'send_email function'
    );
    RETURN false;
END;
$$;