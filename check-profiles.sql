-- Check what's actually in user_profiles and auth.users
SELECT 
  au.id,
  au.email as auth_email,
  au.raw_user_meta_data->>'full_name' as metadata_name,
  au.raw_user_meta_data,
  up.email as profile_email,
  up.full_name as profile_name,
  up.phone,
  up.subscription_tier
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;
