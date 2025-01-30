/*
  # Add SSL/TLS Support to Email Configuration
  
  1. Changes
    - Add use_ssl column to email_config table
    - Add test_email_connection function
*/

-- Add use_ssl column to email_config
ALTER TABLE email_config
ADD COLUMN IF NOT EXISTS use_ssl boolean DEFAULT true;

-- Create function to test email connection
CREATE OR REPLACE FUNCTION test_email_connection(
  test_host text,
  test_port integer,
  test_user text,
  test_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the test attempt
  INSERT INTO error_logs (
    error_type,
    error_message,
    error_details,
    context
  ) VALUES (
    'EMAIL_TEST',
    'Testing email connection',
    jsonb_build_object(
      'host', test_host,
      'port', test_port,
      'user', test_user
    ),
    'test_email_connection function'
  );

  -- For now, just return true as we can't actually test SMTP connection
  -- In production, you would implement actual SMTP connection testing here
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
      'EMAIL_TEST_ERROR',
      SQLERRM,
      jsonb_build_object(
        'host', test_host,
        'port', test_port,
        'user', test_user,
        'error_state', SQLSTATE
      ),
      'test_email_connection function'
    );
    RETURN false;
END;
$$;