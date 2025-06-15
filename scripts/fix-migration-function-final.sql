-- Drop the existing function first
DROP FUNCTION IF EXISTS migrate_tokens_to_vault();

-- Recreate the function with completely unique column names to avoid ambiguity
CREATE OR REPLACE FUNCTION migrate_tokens_to_vault()
RETURNS TABLE(
  record_id UUID,
  record_integration_type TEXT,
  record_user_id UUID,
  record_migration_status TEXT
) AS $$
DECLARE
  integration_record RECORD;
BEGIN
  -- Loop through all integrations with encrypted tokens
  FOR integration_record IN 
    SELECT ui.id, ui.user_id, ui.integration_type, 
           ui.access_token_encrypted, 
           ui.refresh_token_encrypted, 
           ui.access_token_secret_encrypted
    FROM user_integrations ui
    WHERE (ui.access_token_encrypted IS NOT NULL 
           OR ui.refresh_token_encrypted IS NOT NULL 
           OR ui.access_token_secret_encrypted IS NOT NULL)
    AND (ui.access_token_vault_id IS NULL 
         AND ui.refresh_token_vault_id IS NULL 
         AND ui.access_token_secret_vault_id IS NULL)
  LOOP
    -- Return the integration info for processing
    record_id := integration_record.id;
    record_integration_type := integration_record.integration_type;
    record_user_id := integration_record.user_id;
    record_migration_status := 'pending_app_migration';
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 