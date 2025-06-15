-- Get your user ID for the migration
-- Run this in your Supabase SQL Editor first

SELECT 
    id as user_id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'pranavgfinances@gmail.com';

-- This will show you your user UUID that we need for the migration 