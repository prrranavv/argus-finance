-- =============================================
-- Argus Finance - Supabase Database Schema
-- =============================================

-- Create statements table
CREATE TABLE IF NOT EXISTS statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash TEXT,
  file_url TEXT, -- Supabase Storage URL
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category TEXT,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  account_type TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  statement_id UUID REFERENCES statements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closing_balance DECIMAL(15,2),
  opening_balance DECIMAL(15,2),
  running_balance DECIMAL(15,2),
  credit_limit DECIMAL(15,2),
  due_date TEXT,
  reward_points DECIMAL(10,2),
  merchant_category TEXT,
  mode TEXT
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Statements indexes
CREATE INDEX IF NOT EXISTS idx_statements_filename_size ON statements(file_name, file_size);
CREATE INDEX IF NOT EXISTS idx_statements_hash ON statements(file_hash);
CREATE INDEX IF NOT EXISTS idx_statements_processed ON statements(processed);
CREATE INDEX IF NOT EXISTS idx_statements_uploaded_at ON statements(uploaded_at);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_bank ON transactions(bank_name);
CREATE INDEX IF NOT EXISTS idx_transactions_account_type ON transactions(account_type);
CREATE INDEX IF NOT EXISTS idx_transactions_statement ON transactions(statement_id);
CREATE INDEX IF NOT EXISTS idx_transactions_duplicate ON transactions(date, description, amount, type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS) - Disabled for now since no auth
-- =============================================

-- Enable RLS (commented out since we're not using auth yet)
-- ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (no auth)
-- We'll enable RLS later when we add authentication

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to statements table
DROP TRIGGER IF EXISTS update_statements_updated_at ON statements;
CREATE TRIGGER update_statements_updated_at
    BEFORE UPDATE ON statements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to transactions table
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STORAGE BUCKET SETUP (Run this in Supabase Dashboard)
-- =============================================

-- Note: Storage buckets need to be created via the Supabase Dashboard or via the management API
-- Create a bucket called "statements" with public access for file uploads

-- =============================================
-- SAMPLE DATA VERIFICATION QUERIES (Optional)
-- =============================================

-- Check if tables were created successfully
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('statements', 'transactions');

-- Check indexes
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE schemaname = 'public' AND tablename IN ('statements', 'transactions'); 