-- =============================================
-- Migration Script: Assign Existing Data to Admin User
-- =============================================

-- This script should be run AFTER:
-- 1. Running setup-supabase-users.sql
-- 2. Creating your admin user account via the auth system
-- 3. Replacing 'YOUR_USER_ID_HERE' with your actual user ID

-- IMPORTANT: Replace this with your actual user ID after creating your account
-- You can get your user ID by signing up and checking the auth.users table
-- Or by running: SELECT id FROM auth.users WHERE email = 'pranavgfinances@gmail.com';

-- Step 1: Get your user ID (run this first to get the ID)
-- SELECT id FROM auth.users WHERE email = 'pranavgfinances@gmail.com';

-- Step 2: Replace 'YOUR_USER_ID_HERE' with the actual UUID from step 1
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'pranavgfinances@gmail.com'
    LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found. Please create an account with email pranavgfinances@gmail.com first.';
    END IF;
    
    -- Assign existing statements to admin user
    UPDATE statements 
    SET user_id = admin_user_id 
    WHERE user_id IS NULL;
    
    -- Assign existing transactions to admin user
    UPDATE all_transactions 
    SET user_id = admin_user_id 
    WHERE user_id IS NULL;
    
    -- Assign existing balances to admin user
    UPDATE balances 
    SET user_id = admin_user_id 
    WHERE user_id IS NULL;
    
    -- Assign existing emails to admin user
    UPDATE emails 
    SET user_id = admin_user_id 
    WHERE user_id IS NULL;
    
    -- Log the results
    RAISE NOTICE 'Migration completed for user: %', admin_user_id;
    RAISE NOTICE 'Updated statements: %', (SELECT COUNT(*) FROM statements WHERE user_id = admin_user_id);
    RAISE NOTICE 'Updated transactions: %', (SELECT COUNT(*) FROM all_transactions WHERE user_id = admin_user_id);
    RAISE NOTICE 'Updated balances: %', (SELECT COUNT(*) FROM balances WHERE user_id = admin_user_id);
    RAISE NOTICE 'Updated emails: %', (SELECT COUNT(*) FROM emails WHERE user_id = admin_user_id);
END $$;

-- =============================================
-- Verification Queries
-- =============================================

-- Check that all data has been assigned to users
SELECT 
    'statements' as table_name,
    COUNT(*) as total_records,
    COUNT(user_id) as assigned_records,
    COUNT(*) - COUNT(user_id) as unassigned_records
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