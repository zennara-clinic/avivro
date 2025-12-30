-- ============================================
-- FIX: Auto-create user profiles on signup
-- ============================================

-- Step 1: Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name,
    subscription_tier,
    subscription_status,
    monthly_message_limit,
    monthly_messages_used,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free',
    'active',
    1000,
    0,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Backfill profiles for existing users without profiles
INSERT INTO public.user_profiles (
  id, 
  email, 
  full_name,
  subscription_tier,
  subscription_status,
  monthly_message_limit,
  monthly_messages_used,
  created_at, 
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  'free',
  'active',
  1000,
  0,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- Verify the fix
SELECT 
  au.email as auth_email,
  up.email as profile_email,
  up.full_name,
  up.subscription_tier,
  CASE 
    WHEN up.id IS NULL THEN '❌ Missing Profile'
    ELSE '✅ Profile Exists'
  END as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC
LIMIT 10;
