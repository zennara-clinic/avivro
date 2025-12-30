-- Quick diagnostic check
-- Copy this entire query and run it in Supabase SQL Editor

-- 1. Check if user_profiles table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_profiles'
) as table_exists;

-- 2. Check if you have any profiles at all
SELECT COUNT(*) as total_profiles FROM public.user_profiles;

-- 3. Check if trigger exists
SELECT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
) as trigger_exists;

-- 4. Check your specific user
SELECT 
  au.id as user_id,
  au.email as auth_email,
  au.created_at as signed_up_at,
  up.id as profile_id,
  up.email as profile_email,
  up.full_name,
  up.phone,
  CASE 
    WHEN up.id IS NULL THEN '❌ MISSING PROFILE - RUN FIX!'
    ELSE '✅ Profile exists'
  END as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC
LIMIT 5;
