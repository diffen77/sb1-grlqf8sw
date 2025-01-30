-- Drop the existing constraint
ALTER TABLE matches DROP CONSTRAINT IF EXISTS valid_distribution;

-- Add a new, more flexible constraint
ALTER TABLE matches
ADD CONSTRAINT valid_distribution 
CHECK (
  (
    -- Either all distribution values are NULL
    (home_distribution IS NULL AND draw_distribution IS NULL AND away_distribution IS NULL)
    OR
    -- Or they are valid percentages that sum to 100
    (
      home_distribution BETWEEN 0 AND 100 AND
      draw_distribution BETWEEN 0 AND 100 AND
      away_distribution BETWEEN 0 AND 100 AND
      home_distribution + draw_distribution + away_distribution = 100
    )
  )
);

-- Add reference distributions constraint
ALTER TABLE matches
ADD CONSTRAINT valid_ref_distribution 
CHECK (
  (
    -- Either all ref distribution values are NULL
    (home_ref_distribution IS NULL AND draw_ref_distribution IS NULL AND away_ref_distribution IS NULL)
    OR
    -- Or they are valid percentages that sum to 100
    (
      home_ref_distribution BETWEEN 0 AND 100 AND
      draw_ref_distribution BETWEEN 0 AND 100 AND
      away_ref_distribution BETWEEN 0 AND 100 AND
      home_ref_distribution + draw_ref_distribution + away_ref_distribution = 100
    )
  )
);