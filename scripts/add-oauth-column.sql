-- =============================================
-- Add OAuth Support to user_integrations Table
-- =============================================

-- Add the missing column for OAuth 1.0a tokens (like Splitwise)
ALTER TABLE user_integrations 
ADD COLUMN IF NOT EXISTS access_token_secret_encrypted TEXT;

-- Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_integrations' 
        AND column_name = 'access_token_secret_encrypted'
    ) THEN
        RAISE NOTICE '✅ Column access_token_secret_encrypted added successfully!';
    ELSE
        RAISE NOTICE '❌ Failed to add access_token_secret_encrypted column';
    END IF;
END $$; 