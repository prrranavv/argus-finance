-- =============================================
-- Migrate to Supabase Vault for Token Storage
-- =============================================

-- Enable the vault extension
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Create vault secrets for integration tokens
-- Note: These will be created programmatically via the API, not in SQL

-- Update user_integrations table to use vault references instead of encrypted columns
ALTER TABLE user_integrations 
ADD COLUMN IF NOT EXISTS access_token_vault_id UUID REFERENCES vault.secrets(id),
ADD COLUMN IF NOT EXISTS refresh_token_vault_id UUID REFERENCES vault.secrets(id),
ADD COLUMN IF NOT EXISTS access_token_secret_vault_id UUID REFERENCES vault.secrets(id);

-- Create indexes for vault references
CREATE INDEX IF NOT EXISTS idx_user_integrations_access_token_vault ON user_integrations(access_token_vault_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_refresh_token_vault ON user_integrations(refresh_token_vault_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_access_token_secret_vault ON user_integrations(access_token_secret_vault_id);

-- Function to migrate existing encrypted tokens to vault
CREATE OR REPLACE FUNCTION migrate_tokens_to_vault()
RETURNS TABLE(
  integration_id UUID,
  integration_type TEXT,
  user_id UUID,
  migration_status TEXT
) AS $$
DECLARE
  integration_record RECORD;
  access_token_secret_id UUID;
  refresh_token_secret_id UUID;
  access_token_secret_secret_id UUID;
BEGIN
  -- Loop through all integrations with encrypted tokens
  FOR integration_record IN 
    SELECT id, user_id, integration_type, 
           access_token_encrypted, 
           refresh_token_encrypted, 
           access_token_secret_encrypted
    FROM user_integrations 
    WHERE (access_token_encrypted IS NOT NULL 
           OR refresh_token_encrypted IS NOT NULL 
           OR access_token_secret_encrypted IS NOT NULL)
    AND (access_token_vault_id IS NULL 
         AND refresh_token_vault_id IS NULL 
         AND access_token_secret_vault_id IS NULL)
  LOOP
    -- Note: The actual token decryption and vault storage will be done
    -- via the application code, not in SQL, for security reasons
    
    -- Return the integration info for processing
    integration_id := integration_record.id;
    integration_type := integration_record.integration_type;
    user_id := integration_record.user_id;
    migration_status := 'pending_app_migration';
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old encrypted columns after migration
CREATE OR REPLACE FUNCTION cleanup_encrypted_columns()
RETURNS BOOLEAN AS $$
BEGIN
  -- Only run this after confirming all tokens are migrated to vault
  -- This is a destructive operation!
  
  -- Check if any integrations still rely on encrypted columns
  IF EXISTS (
    SELECT 1 FROM user_integrations 
    WHERE (access_token_vault_id IS NULL AND access_token_encrypted IS NOT NULL)
       OR (refresh_token_vault_id IS NULL AND refresh_token_encrypted IS NOT NULL)
       OR (access_token_secret_vault_id IS NULL AND access_token_secret_encrypted IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Cannot cleanup: Some integrations still have encrypted tokens without vault references';
  END IF;
  
  -- Drop the old encrypted columns
  ALTER TABLE user_integrations 
  DROP COLUMN IF EXISTS access_token_encrypted,
  DROP COLUMN IF EXISTS refresh_token_encrypted,
  DROP COLUMN IF EXISTS access_token_secret_encrypted;
  
  -- Drop old encryption functions
  DROP FUNCTION IF EXISTS encrypt_token(TEXT);
  DROP FUNCTION IF EXISTS decrypt_token(TEXT, BYTEA);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check vault migration status
CREATE OR REPLACE FUNCTION check_vault_migration_status()
RETURNS TABLE(
  total_integrations BIGINT,
  migrated_to_vault BIGINT,
  pending_migration BIGINT,
  migration_complete BOOLEAN
) AS $$
BEGIN
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN (access_token_vault_id IS NOT NULL 
                     OR refresh_token_vault_id IS NOT NULL 
                     OR access_token_secret_vault_id IS NOT NULL) THEN 1 END) as migrated,
    COUNT(CASE WHEN (access_token_encrypted IS NOT NULL 
                     OR refresh_token_encrypted IS NOT NULL 
                     OR access_token_secret_encrypted IS NOT NULL)
                AND (access_token_vault_id IS NULL 
                     AND refresh_token_vault_id IS NULL 
                     AND access_token_secret_vault_id IS NULL) THEN 1 END) as pending
  INTO total_integrations, migrated_to_vault, pending_migration
  FROM user_integrations;
  
  migration_complete := (pending_migration = 0 AND total_integrations > 0);
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check vault extension
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'supabase_vault') THEN
    RAISE NOTICE '✅ Supabase Vault extension enabled';
  ELSE
    RAISE NOTICE '❌ Supabase Vault extension not found - ensure it is available in your Supabase project';
  END IF;
END $$;

-- Show migration status
SELECT * FROM check_vault_migration_status();

-- Show integrations that need migration
SELECT * FROM migrate_tokens_to_vault();

RAISE NOTICE '';
RAISE NOTICE '🔐 Supabase Vault setup complete!';
RAISE NOTICE '📋 Next steps:';
RAISE NOTICE '1. Run the Node.js migration script to move encrypted tokens to vault';
RAISE NOTICE '2. Update application code to use vault instead of custom encryption';
RAISE NOTICE '3. Test all integrations thoroughly';
RAISE NOTICE '4. Run cleanup_encrypted_columns() to remove old columns (DESTRUCTIVE!)'; 