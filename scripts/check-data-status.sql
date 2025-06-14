-- Check your current data status
-- Run this to see what data exists and needs migration

-- Check how much data you have
SELECT 
    'statements' as table_name,
    COUNT(*) as total_records,
    COUNT(user_id) as assigned_to_users,
    COUNT(*) - COUNT(user_id) as needs_migration
FROM statements
UNION ALL
SELECT 
    'all_transactions',
    COUNT(*),
    COUNT(user_id),
    COUNT(*) - COUNT(user_id)
FROM all_transactions
UNION ALL
SELECT 
    'balances',
    COUNT(*),
    COUNT(user_id),
    COUNT(*) - COUNT(user_id)
FROM balances
UNION ALL
SELECT 
    'emails',
    COUNT(*),
    COUNT(user_id),
    COUNT(*) - COUNT(user_id)
FROM emails;

-- Show sample of unassigned data
SELECT 'Sample transactions without user_id:' as info;
SELECT id, date, description, amount, bank_name 
FROM all_transactions 
WHERE user_id IS NULL 
LIMIT 5; 