/*
  # Email Templates and Functions for Invitations

  1. New Features
    - Custom email templates table
    - Function to send invitation emails
    - Support for HTML and text templates
*/

-- Create email templates table
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  subject text NOT NULL,
  html_body text NOT NULL,
  text_body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage templates
CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert invitation template
INSERT INTO email_templates (name, subject, html_body, text_body)
VALUES (
  'invite_user',
  'You''ve been invited to join Stryktipset',
  '<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
    <h1 style="color: #2563eb;">Welcome to Stryktipset</h1>
    <p>You''ve been invited to join Stryktipset by {{inviter_name}}.</p>
    {{#if custom_message}}
    <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
      <p style="margin: 0;">{{custom_message}}</p>
    </div>
    {{/if}}
    <p>Click the button below to create your account:</p>
    <a href="{{invite_link}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Accept Invitation</a>
    <p style="color: #6b7280; font-size: 14px;">This invitation will expire in 7 days.</p>
  </div>',
  'Welcome to Stryktipset!

You''ve been invited to join Stryktipset by {{inviter_name}}.

{{#if custom_message}}
Personal message:
{{custom_message}}

{{/if}}
Click the link below to create your account:
{{invite_link}}

This invitation will expire in 7 days.'
);

-- Create function to send invitation email
CREATE OR REPLACE FUNCTION send_invitation_email(
  invitation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record invitations;
  template email_templates;
  inviter_name text;
  base_url text;
  html_content text;
  text_content text;
BEGIN
  -- Get invitation details
  SELECT * INTO invite_record
  FROM invitations
  WHERE id = invitation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Get email template
  SELECT * INTO template
  FROM email_templates
  WHERE name = 'invite_user';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email template not found';
  END IF;

  -- Get inviter's name or email
  SELECT COALESCE(raw_user_meta_data->>'name', email) INTO inviter_name
  FROM auth.users
  WHERE id = invite_record.created_by;

  -- Get base URL from settings or use default
  base_url := current_setting('app.settings.base_url', true);
  IF base_url IS NULL THEN
    base_url := 'http://localhost:5173';
  END IF;

  -- Replace template variables
  html_content := template.html_body;
  text_content := template.text_body;

  html_content := replace(html_content, '{{inviter_name}}', inviter_name);
  text_content := replace(text_content, '{{inviter_name}}', inviter_name);

  html_content := replace(html_content, '{{invite_link}}', base_url || '/accept-invite?token=' || invite_record.token);
  text_content := replace(text_content, '{{invite_link}}', base_url || '/accept-invite?token=' || invite_record.token);

  IF invite_record.message IS NOT NULL THEN
    html_content := replace(html_content, '{{#if custom_message}}', '');
    html_content := replace(html_content, '{{/if}}', '');
    html_content := replace(html_content, '{{custom_message}}', invite_record.message);

    text_content := replace(text_content, '{{#if custom_message}}', '');
    text_content := replace(text_content, '{{/if}}', '');
    text_content := replace(text_content, '{{custom_message}}', invite_record.message);
  ELSE
    -- Remove custom message block if no message
    html_content := regexp_replace(html_content, '{{#if custom_message}}.*?{{/if}}', '', 'gs');
    text_content := regexp_replace(text_content, '{{#if custom_message}}.*?{{/if}}', '', 'gs');
  END IF;

  -- Send email using Supabase's built-in email functionality
  PERFORM net.http_post(
    url := current_setting('supabase.email_server_url', true),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.email_server_key', true)
    ),
    body := jsonb_build_object(
      'to', invite_record.email,
      'subject', template.subject,
      'html', html_content,
      'text', text_content
    )
  );
END;
$$;