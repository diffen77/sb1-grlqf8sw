-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations;
DROP TRIGGER IF EXISTS handle_invitation_conflict ON invitations;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;

-- Create invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  message text,
  expires_at timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_active_invitation UNIQUE (email, status)
);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage invitations"
  ON invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- Create function to handle invitation conflicts
CREATE OR REPLACE FUNCTION handle_invitation_conflict()
RETURNS TRIGGER AS $$
BEGIN
  -- If there's an existing pending invitation, update it
  IF EXISTS (
    SELECT 1 FROM invitations 
    WHERE email = NEW.email 
    AND status = 'pending'
  ) THEN
    UPDATE invitations
    SET 
      token = NEW.token,
      role = NEW.role,
      message = NEW.message,
      expires_at = NEW.expires_at,
      created_by = NEW.created_by,
      status = 'pending',
      updated_at = now()
    WHERE email = NEW.email AND status = 'pending';
    RETURN NULL;
  END IF;
  
  -- If there's no pending invitation, allow the new one
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for handling invitation conflicts
CREATE TRIGGER handle_invitation_conflict
  BEFORE INSERT ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_invitation_conflict();