/*
  # Enhance betting system functionality

  1. Add Indexes
    - Add indexes for common queries on bet_slips and bet_selections
  
  2. Add Status Tracking
    - Add status tracking for bet slips
    - Add validation constraints
  
  3. Add Audit Fields
    - Add updated_at timestamps
*/

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bet_slips_user_id ON bet_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_slips_status ON bet_slips(status);
CREATE INDEX IF NOT EXISTS idx_bet_selections_bet_slip_id ON bet_selections(bet_slip_id);

-- Add status constraint to bet_slips
ALTER TABLE bet_slips 
DROP CONSTRAINT IF EXISTS valid_status,
ADD CONSTRAINT valid_status 
CHECK (status IN ('pending', 'active', 'settled', 'cancelled'));

-- Add updated_at column and trigger to bet_slips if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bet_slips' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE bet_slips 
    ADD COLUMN updated_at timestamptz DEFAULT now();
    
    CREATE TRIGGER update_bet_slips_updated_at
      BEFORE UPDATE ON bet_slips
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add policies for updating bet slips
CREATE POLICY "Users can update their own pending bet slips"
  ON bet_slips FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'pending'
  );

-- Add policy for cancelling bet slips
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can cancel their own pending bet slips" ON bet_slips;
  
  CREATE POLICY "Users can cancel their own pending bet slips"
    ON bet_slips FOR UPDATE
    TO authenticated
    USING (
      auth.uid() = user_id 
      AND status = 'pending'
    )
    WITH CHECK (
      auth.uid() = user_id 
      AND status = 'pending'
    );
END $$;