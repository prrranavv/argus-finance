-- =============================================
-- Gmail Email Tables - Supabase Database Schema
-- =============================================

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id TEXT UNIQUE NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  received_date TIMESTAMPTZ NOT NULL,
  attachment_urls JSON DEFAULT '[]'::json,
  account_type TEXT CHECK (account_type IN ('credit_card', 'bank_account')),
  bank_name TEXT,
  content TEXT,
  content_type TEXT CHECK (content_type IN ('transaction', 'irrelevant')) DEFAULT 'irrelevant',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_transactions table
CREATE TABLE IF NOT EXISTS email_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('credit_card', 'bank_account')),
  bank_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  category TEXT,
  balance DECIMAL(15,2),
  date TIMESTAMPTZ NOT NULL,
  reward_points DECIMAL(10,2),
  mode TEXT,
  reference_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Emails table indexes
CREATE INDEX IF NOT EXISTS idx_emails_gmail_message_id ON emails(gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_emails_from_email ON emails(from_email);
CREATE INDEX IF NOT EXISTS idx_emails_received_date ON emails(received_date);
CREATE INDEX IF NOT EXISTS idx_emails_account_type ON emails(account_type);
CREATE INDEX IF NOT EXISTS idx_emails_bank_name ON emails(bank_name);
CREATE INDEX IF NOT EXISTS idx_emails_content_type ON emails(content_type);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at);

-- Email transactions table indexes
CREATE INDEX IF NOT EXISTS idx_email_transactions_email_id ON email_transactions(email_id);
CREATE INDEX IF NOT EXISTS idx_email_transactions_gmail_message_id ON email_transactions(gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_email_transactions_date ON email_transactions(date);
CREATE INDEX IF NOT EXISTS idx_email_transactions_type ON email_transactions(type);
CREATE INDEX IF NOT EXISTS idx_email_transactions_bank_name ON email_transactions(bank_name);
CREATE INDEX IF NOT EXISTS idx_email_transactions_account_type ON email_transactions(account_type);
CREATE INDEX IF NOT EXISTS idx_email_transactions_category ON email_transactions(category);
CREATE INDEX IF NOT EXISTS idx_email_transactions_amount ON email_transactions(amount);
CREATE INDEX IF NOT EXISTS idx_email_transactions_description ON email_transactions(description);
CREATE INDEX IF NOT EXISTS idx_email_transactions_created_at ON email_transactions(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_emails_bank_type ON emails(bank_name, account_type);
CREATE INDEX IF NOT EXISTS idx_email_transactions_bank_type ON email_transactions(bank_name, account_type);
CREATE INDEX IF NOT EXISTS idx_email_transactions_date_type ON email_transactions(date, type);

-- =============================================
-- UPDATED_AT TRIGGERS (Using existing function)
-- =============================================

-- Apply trigger to emails table
DROP TRIGGER IF EXISTS update_emails_updated_at ON emails;
CREATE TRIGGER update_emails_updated_at
    BEFORE UPDATE ON emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to email_transactions table
DROP TRIGGER IF EXISTS update_email_transactions_updated_at ON email_transactions;
CREATE TRIGGER update_email_transactions_updated_at
    BEFORE UPDATE ON email_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE emails IS 'Stores Gmail email metadata and content';
COMMENT ON COLUMN emails.gmail_message_id IS 'Unique Gmail message ID from Gmail API';
COMMENT ON COLUMN emails.attachment_urls IS 'JSON array of attachment download URLs with metadata';
COMMENT ON COLUMN emails.content IS 'Cleaned email content from OpenAI processing';
COMMENT ON COLUMN emails.content_type IS 'Whether email contains transaction data or is irrelevant';

COMMENT ON TABLE email_transactions IS 'Financial transactions extracted from Gmail emails';
COMMENT ON COLUMN email_transactions.email_id IS 'References the source email';
COMMENT ON COLUMN email_transactions.gmail_message_id IS 'Direct Gmail message ID for quick lookup';
COMMENT ON COLUMN email_transactions.amount IS 'Transaction amount (always positive, use type for debit/credit)';
COMMENT ON COLUMN email_transactions.type IS 'Transaction direction: credit (money in) or debit (money out)';
COMMENT ON COLUMN email_transactions.mode IS 'Payment method: upi, card, direct_bank_transfer, etc.';

-- =============================================
-- SAMPLE QUERIES FOR VERIFICATION
-- =============================================

-- Check if tables were created successfully
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('emails', 'email_transactions');

-- Check indexes
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE schemaname = 'public' AND tablename IN ('emails', 'email_transactions')
-- ORDER BY tablename, indexname;

-- Sample data verification queries:
-- SELECT COUNT(*) as total_emails FROM emails;
-- SELECT COUNT(*) as total_transactions FROM email_transactions;
-- SELECT bank_name, account_type, COUNT(*) FROM emails GROUP BY bank_name, account_type;
-- SELECT type, COUNT(*), SUM(amount) FROM email_transactions GROUP BY type; 