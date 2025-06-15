-- Create wrapper functions in public schema for vault operations
-- These allow the Supabase client to access vault functions via RPC

-- Function to create a secret in the vault
CREATE OR REPLACE FUNCTION public.create_vault_secret(
  secret_value TEXT,
  secret_name TEXT DEFAULT NULL,
  secret_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  -- Only allow service_role to call this function
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Access denied. Only service_role can create vault secrets.';
  END IF;

  -- Call the vault.create_secret function
  IF secret_name IS NOT NULL AND secret_description IS NOT NULL THEN
    RETURN vault.create_secret(secret_value, secret_name, secret_description);
  ELSIF secret_name IS NOT NULL THEN
    RETURN vault.create_secret(secret_value, secret_name);
  ELSE
    RETURN vault.create_secret(secret_value);
  END IF;
END;
$$;

-- Function to update a secret in the vault
CREATE OR REPLACE FUNCTION public.update_vault_secret(
  secret_id UUID,
  new_secret_value TEXT,
  new_secret_name TEXT DEFAULT NULL,
  new_secret_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  -- Only allow service_role to call this function
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Access denied. Only service_role can update vault secrets.';
  END IF;

  -- Call the vault.update_secret function
  IF new_secret_name IS NOT NULL AND new_secret_description IS NOT NULL THEN
    PERFORM vault.update_secret(secret_id, new_secret_value, new_secret_name, new_secret_description);
  ELSIF new_secret_name IS NOT NULL THEN
    PERFORM vault.update_secret(secret_id, new_secret_value, new_secret_name);
  ELSE
    PERFORM vault.update_secret(secret_id, new_secret_value);
  END IF;
END;
$$;

-- Function to get a decrypted secret from the vault
CREATE OR REPLACE FUNCTION public.get_vault_secret(secret_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  secret_value TEXT;
BEGIN
  -- Only allow service_role to call this function
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Access denied. Only service_role can read vault secrets.';
  END IF;

  -- Get the decrypted secret from the vault
  SELECT decrypted_secret 
  INTO secret_value
  FROM vault.decrypted_secrets 
  WHERE id = secret_id;

  RETURN secret_value;
END;
$$;

-- Function to delete a secret from the vault (by setting it to inactive)
CREATE OR REPLACE FUNCTION public.delete_vault_secret(secret_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  -- Only allow service_role to call this function
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Access denied. Only service_role can delete vault secrets.';
  END IF;

  -- Delete the secret from vault.secrets table
  DELETE FROM vault.secrets WHERE id = secret_id;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  RETURN rows_affected > 0;
END;
$$;

-- Grant execute permissions to service_role
GRANT EXECUTE ON FUNCTION public.create_vault_secret(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_vault_secret(UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_vault_secret(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_vault_secret(UUID) TO service_role; 