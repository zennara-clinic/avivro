-- First, check what data we have
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data,
  up.full_name,
  up.phone
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;

-- If full_name is empty, update it manually for your account
-- Replace 'your@email.com' with your actual email
UPDATE public.user_profiles
SET 
  full_name = 'Your Full Name',  -- Replace with your actual name
  phone = '+91 1234567890',      -- Replace with your phone
  updated_at = NOW()
WHERE email = 'your@email.com';  -- Replace with your actual email

-- Verify the update
SELECT * FROM public.user_profiles WHERE email = 'your@email.com';
