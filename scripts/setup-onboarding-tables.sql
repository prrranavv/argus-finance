-- =============================================
-- Argus Finance - Onboarding Tables Schema
-- =============================================

-- User Accounts (Combined Bank Accounts & Credit Cards)
CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL, -- e.g., "HDFC Bank", "Axis Magnus Credit Card"
  account_number TEXT, -- Actual account/card number for transaction mapping
  account_type TEXT NOT NULL CHECK (account_type IN ('bank_account', 'credit_card')),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Integration Tokens (Encrypted)
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('gmail', 'splitwise')),
  access_token_encrypted TEXT, -- Encrypted access token
  access_token_secret_encrypted TEXT, -- Encrypted access token secret (for OAuth 1.0a like Splitwise)
  refresh_token_encrypted TEXT, -- Encrypted refresh token (if applicable)
  token_expires_at TIMESTAMPTZ,
  additional_data JSONB DEFAULT '{}'::jsonb, -- For extra integration-specific data
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, integration_type)
);

-- Onboarding Progress Tracking
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step TEXT DEFAULT 'personal_info' CHECK (current_step IN (
    'personal_info', 
    'accounts', 
    'integrations', 
    'completed'
  )),
  steps_completed JSONB DEFAULT '{
    "personal_info": false,
    "accounts": false,
    "integrations": false
  }'::jsonb,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

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
-- SAMPLE QUERIES FOR TESTING
-- =============================================

-- Get user's onboarding status
-- SELECT * FROM user_onboarding WHERE user_id = auth.uid();

-- Get user's accounts
-- SELECT * FROM user_accounts WHERE user_id = auth.uid() ORDER BY is_primary DESC, created_at ASC;

-- Get user's active integrations
-- SELECT integration_type, is_active, last_sync_at FROM user_integrations 
-- WHERE user_id = auth.uid() AND is_active = true; 