-- =============================================
-- Argus Finance - User Management Schema Updates
-- =============================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  preferences JSONB DEFAULT '{
    "privacy_mode": true,
    "theme": "system",
    "notifications": {
      "email_sync": true,
      "transaction_alerts": false
    }
  }'::jsonb
);

-- Add user_id column to existing tables
ALTER TABLE statements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE all_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE balances ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_statements_user_id ON statements(user_id);
CREATE INDEX IF NOT EXISTS idx_all_transactions_user_id ON all_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);

-- =============================================
-- UPDATED_AT TRIGGER FOR USERS TABLE
-- =============================================

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE all_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for statements table
CREATE POLICY "Users can view own statements" ON statements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own statements" ON statements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own statements" ON statements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own statements" ON statements FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for all_transactions table
CREATE POLICY "Users can view own transactions" ON all_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON all_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON all_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON all_transactions FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for balances table
CREATE POLICY "Users can view own balances" ON balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own balances" ON balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own balances" ON balances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own balances" ON balances FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for emails table
CREATE POLICY "Users can view own emails" ON emails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emails" ON emails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emails" ON emails FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emails" ON emails FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTION TO CREATE USER PROFILE ON SIGNUP
-- =============================================

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- MIGRATION SCRIPT FOR EXISTING DATA
-- =============================================

-- Note: Run this separately after creating your admin user account
-- This will assign all existing data to the admin user

-- Example (replace with your actual user ID after creating admin account):
-- UPDATE statements SET user_id = 'your-user-uuid-here' WHERE user_id IS NULL;
-- UPDATE all_transactions SET user_id = 'your-user-uuid-here' WHERE user_id IS NULL;
-- UPDATE balances SET user_id = 'your-user-uuid-here' WHERE user_id IS NULL;
-- UPDATE emails SET user_id = 'your-user-uuid-here' WHERE user_id IS NULL; 