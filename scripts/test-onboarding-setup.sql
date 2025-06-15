-- =============================================
-- Test Onboarding Infrastructure Setup
-- =============================================

-- Check if onboarding tables exist
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('user_accounts', 'user_integrations', 'user_onboarding');
    
    -- Check functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('initialize_user_onboarding', 'update_onboarding_step', 'encrypt_token');
    
    -- Check triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
    AND trigger_name = 'on_user_created_init_onboarding';
    
    -- Check RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('user_accounts', 'user_integrations', 'user_onboarding');
    
    -- Report results
    RAISE NOTICE '=== ONBOARDING INFRASTRUCTURE TEST ===';
    RAISE NOTICE 'Tables found: % / 3 expected', table_count;
    RAISE NOTICE 'Functions found: % / 3 expected', function_count;
    RAISE NOTICE 'Triggers found: % / 1 expected', trigger_count;
    RAISE NOTICE 'RLS Policies found: % / 12 expected', policy_count;
    RAISE NOTICE '';
    
    IF table_count = 3 AND function_count >= 2 AND trigger_count = 1 AND policy_count >= 10 THEN
        RAISE NOTICE '✅ ONBOARDING INFRASTRUCTURE: READY';
        RAISE NOTICE '🎯 New user signups should work properly!';
    ELSE
        RAISE NOTICE '❌ ONBOARDING INFRASTRUCTURE: INCOMPLETE';
        RAISE NOTICE '⚠️  Please run the setup-onboarding-infrastructure.sql script';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== DETAILED BREAKDOWN ===';
    
    -- List missing tables
    IF table_count < 3 THEN
        RAISE NOTICE 'Missing tables:';
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_accounts') THEN
            RAISE NOTICE '  - user_accounts';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_integrations') THEN
            RAISE NOTICE '  - user_integrations';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_onboarding') THEN
            RAISE NOTICE '  - user_onboarding';
        END IF;
    END IF;
    
    -- List missing functions
    IF function_count < 2 THEN
        RAISE NOTICE 'Missing functions:';
        IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'initialize_user_onboarding') THEN
            RAISE NOTICE '  - initialize_user_onboarding';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_onboarding_step') THEN
            RAISE NOTICE '  - update_onboarding_step';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'encrypt_token') THEN
            RAISE NOTICE '  - encrypt_token';
        END IF;
    END IF;
    
    -- Check trigger
    IF trigger_count = 0 THEN
        RAISE NOTICE 'Missing trigger: on_user_created_init_onboarding';
    END IF;
    
END $$; 