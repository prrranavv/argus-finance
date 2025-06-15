-- Drop the existing function first
DROP FUNCTION IF EXISTS migrate_tokens_to_vault();

-- Recreate the function with fixed column names
CREATE OR REPLACE FUNCTION migrate_tokens_to_vault()
RETURNS TABLE(
  integration_id UUID,
  integration_type TEXT,
  user_id_value UUID,
  migration_status TEXT
) AS $$
DECLARE
  integration_record RECORD;
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
    -- Return the integration info for processing
    integration_id := integration_record.id;
    integration_type := integration_record.integration_type;
    user_id_value := integration_record.user_id;
    migration_status := 'pending_app_migration';
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 