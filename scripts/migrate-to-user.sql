-- =============================================
-- MIGRATION: Link Existing Data to Your Account
-- =============================================
-- Run this AFTER you've created your account with pranavgfinances@gmail.com

DO $$
DECLARE
    admin_user_id UUID;
    statements_updated INTEGER;
    transactions_updated INTEGER;
    balances_updated INTEGER;
    emails_updated INTEGER;
BEGIN
    -- Get your user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'pranavgfinances@gmail.com'
    LIMIT 1;
    
    -- Check if user exists
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found! Please make sure you have signed up with email: pranavgfinances@gmail.com';
    END IF;
    
    RAISE NOTICE '✅ Found user account: %', admin_user_id;
    
    -- Assign existing statements to your account
    UPDATE statements 
    SET user_id = admin_user_id 
    WHERE user_id IS NULL;
    GET DIAGNOSTICS statements_updated = ROW_COUNT;
    
    -- Assign existing transactions to your account  
    UPDATE all_transactions 
    SET user_id = admin_user_id 
    WHERE user_id IS NULL;
    GET DIAGNOSTICS transactions_updated = ROW_COUNT;
    
    -- Assign existing balances to your account
    UPDATE balances 
    SET user_id = admin_user_id 
    WHERE user_id IS NULL;
    GET DIAGNOSTICS balances_updated = ROW_COUNT;
    
    -- Assign existing emails to your account
    UPDATE emails 
    SET user_id = admin_user_id 
    WHERE user_id IS NULL;
    GET DIAGNOSTICS emails_updated = ROW_COUNT;
    
    -- Show results
    RAISE NOTICE '📊 MIGRATION COMPLETE!';
    RAISE NOTICE '📄 Statements assigned: %', statements_updated;
    RAISE NOTICE '💰 Transactions assigned: %', transactions_updated;
    RAISE NOTICE '📈 Balances assigned: %', balances_updated;
    RAISE NOTICE '📧 Emails assigned: %', emails_updated;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 All your existing data is now linked to your account!';
    RAISE NOTICE '🔄 Refresh your app to see your data.';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Migration failed: %', SQLERRM;
END $$;

-- Verify the migration worked
SELECT 
    'VERIFICATION - Data now assigned to your account:' as status;
    
SELECT 
    'statements' as table_name,
    COUNT(*) as total_records
FROM statements 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'pranavgfinances@gmail.com')
UNION ALL
SELECT 
    'all_transactions',
    COUNT(*)
FROM all_transactions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'pranavgfinances@gmail.com')
UNION ALL
SELECT 
    'balances',
    COUNT(*)
FROM balances 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'pranavgfinances@gmail.com')
UNION ALL
SELECT 
    'emails',
    COUNT(*)
FROM emails 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'pranavgfinances@gmail.com'); 