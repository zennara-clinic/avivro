# Supabase Setup - User Profile Auto-Creation

## Problem
When users sign up, their profile is not automatically created in the `user_profiles` table, so Account Settings shows placeholder data.

## Solution
Run this SQL in your Supabase SQL Editor to create a trigger that automatically creates a user profile when someone signs up:

```sql
-- Create a function that creates a user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that calls the function after a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## What This Does:
1. When a new user signs up in Supabase Auth
2. The trigger automatically creates a matching record in `user_profiles` table
3. Sets the email from auth
4. Sets the full_name if provided during signup
5. Sets timestamps

## After Running This:
- New signups will automatically get a profile
- Existing users without profiles: Run this to create profiles for them:

```sql
-- Create profiles for existing users who don't have one
INSERT INTO public.user_profiles (id, email, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
```

## Test It:
1. Sign up a new user
2. Go to Account Settings
3. You should see the email populated
4. Update your name and phone, click Save Changes
5. Refresh - data should persist
