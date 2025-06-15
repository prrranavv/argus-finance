-- =============================================
-- Argus Finance - Onboarding Infrastructure Setup
-- (Run this after tables are created)
-- =============================================

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User accounts indexes
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_type ON user_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_user_accounts_primary ON user_accounts(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_user_accounts_bank_name ON user_accounts(bank_name);

-- User integrations indexes
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_type ON user_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_user_integrations_active ON user_integrations(user_id, is_active) WHERE is_active = true;

-- Onboarding indexes
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_step ON user_onboarding(current_step);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(is_completed);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================

-- User accounts trigger
DROP TRIGGER IF EXISTS update_user_accounts_updated_at ON user_accounts;
CREATE TRIGGER update_user_accounts_updated_at
    BEFORE UPDATE ON user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User integrations trigger
DROP TRIGGER IF EXISTS update_user_integrations_updated_at ON user_integrations;
CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User onboarding trigger
DROP TRIGGER IF EXISTS update_user_onboarding_updated_at ON user_onboarding;
CREATE TRIGGER update_user_onboarding_updated_at
    BEFORE UPDATE ON user_onboarding
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own accounts" ON user_accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON user_accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON user_accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON user_accounts;

DROP POLICY IF EXISTS "Users can view own integrations" ON user_integrations;
DROP POLICY IF EXISTS "Users can insert own integrations" ON user_integrations;
DROP POLICY IF EXISTS "Users can update own integrations" ON user_integrations;
DROP POLICY IF EXISTS "Users can delete own integrations" ON user_integrations;

DROP POLICY IF EXISTS "Users can view own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can insert own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can update own onboarding" ON user_onboarding;
DROP POLICY IF EXISTS "Users can delete own onboarding" ON user_onboarding;

-- RLS policies for user_accounts
CREATE POLICY "Users can view own accounts" ON user_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON user_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON user_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON user_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_integrations
CREATE POLICY "Users can view own integrations" ON user_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own integrations" ON user_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own integrations" ON user_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own integrations" ON user_integrations FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_onboarding
CREATE POLICY "Users can view own onboarding" ON user_onboarding FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON user_onboarding FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own onboarding" ON user_onboarding FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own onboarding" ON user_onboarding FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- ENCRYPTION SETUP FOR TOKENS
-- =============================================

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt tokens
CREATE OR REPLACE FUNCTION encrypt_token(token TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(encrypt(token::bytea, gen_random_bytes(32), 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt tokens
CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token TEXT, key BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(decrypt(decode(encrypted_token, 'base64'), key, 'aes'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTIONS FOR ONBOARDING MANAGEMENT
-- =============================================

-- Function to initialize onboarding for new users
CREATE OR REPLACE FUNCTION initialize_user_onboarding()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_onboarding (user_id, current_step, steps_completed, is_completed)
  VALUES (
    NEW.id,
    'personal_info',
    '{"personal_info": false, "accounts": false, "integrations": false}'::jsonb,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize onboarding when user is created
DROP TRIGGER IF EXISTS on_user_created_init_onboarding ON users;
CREATE TRIGGER on_user_created_init_onboarding
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_onboarding();

-- Function to update onboarding progress
CREATE OR REPLACE FUNCTION update_onboarding_step(
  p_user_id UUID,
  p_step TEXT,
  p_completed BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
DECLARE
  current_steps JSONB;
  all_completed BOOLEAN;
BEGIN
  -- Update the specific step
  UPDATE user_onboarding 
  SET 
    steps_completed = jsonb_set(steps_completed, ARRAY[p_step], to_jsonb(p_completed)),
    current_step = CASE 
      WHEN p_step = 'personal_info' AND p_completed THEN 'accounts'
      WHEN p_step = 'accounts' AND p_completed THEN 'integrations'
      WHEN p_step = 'integrations' AND p_completed THEN 'completed'
      ELSE current_step
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING steps_completed INTO current_steps;

  -- Check if all steps are completed
  SELECT (
    (current_steps->>'personal_info')::boolean AND
    (current_steps->>'accounts')::boolean AND
    (current_steps->>'integrations')::boolean
  ) INTO all_completed;

  -- Mark onboarding as completed if all steps are done
  IF all_completed THEN
    UPDATE user_onboarding 
    SET 
      is_completed = true,
      completed_at = NOW(),
      current_step = 'completed'
    WHERE user_id = p_user_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify setup
DO $$
BEGIN
  RAISE NOTICE '✅ Onboarding infrastructure setup complete!';
  RAISE NOTICE '📋 Tables: user_accounts, user_integrations, user_onboarding';
  RAISE NOTICE '🔒 RLS policies created for all tables';
  RAISE NOTICE '🔑 Encryption functions available';
  RAISE NOTICE '⚡ Triggers and indexes created';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Ready for onboarding! New users will automatically get onboarding records.';
END $$; 