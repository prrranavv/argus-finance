-- Update emails table schema: Replace content_type with is_relevant boolean
-- Run this in your Supabase SQL editor

-- Add the new is_relevant column
ALTER TABLE emails 
ADD COLUMN is_relevant BOOLEAN DEFAULT false;

-- Update existing records to set is_relevant based on content_type
UPDATE emails 
SET is_relevant = CASE 
  WHEN content_type = 'transaction' THEN true 
  ELSE false 
END
WHERE content_type IS NOT NULL;

-- Drop the old content_type column
ALTER TABLE emails 
DROP COLUMN content_type;

-- Add comment to the new column
COMMENT ON COLUMN emails.is_relevant IS 'Boolean flag indicating if email contains financial/transaction data';

-- Create index on is_relevant for faster queries
CREATE INDEX IF NOT EXISTS idx_emails_is_relevant ON emails(is_relevant);

-- Verify the change
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'emails' 
AND column_name IN ('is_relevant', 'content_type')
ORDER BY column_name; 