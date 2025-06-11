-- Migrate data from transactions table
INSERT INTO all_transactions (
  id,
  date,
  description,
  amount,
  category,
  type,
  account_type,
  bank_name,
  source,
  statement_id,
  created_at,
  updated_at
)
SELECT
  id,
  date,
  description,
  amount,
  category,
  type,
  account_type,
  bank_name,
  'statement' as source,
  statement_id,
  created_at,
  updated_at
FROM transactions;

-- Migrate data from email_transactions table
INSERT INTO all_transactions (
  id,
  date,
  description,
  amount,
  category,
  type,
  account_type,
  bank_name,
  source,
  email_id,
  gmail_message_id,
  reference_number,
  created_at,
  updated_at
)
SELECT
  id,
  date,
  description,
  amount,
  category,
  -- Convert from credit/debit to income/expense to match the format used in transactions table
  CASE WHEN type = 'credit' THEN 'income' WHEN type = 'debit' THEN 'expense' ELSE type END as type,
  account_type,
  bank_name,
  'email' as source,
  email_id,
  gmail_message_id,
  reference_number,
  created_at,
  updated_at
FROM email_transactions; 