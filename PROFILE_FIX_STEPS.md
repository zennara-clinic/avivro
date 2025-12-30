# Fix Profile Data - Step by Step

## Problem
Account Settings showing dummy data because `user_profiles` table is empty.

## Solution Steps

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your **Avivro** project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the Fix SQL
1. Click **New Query**
2. Copy the ENTIRE contents from `supabase-fix.sql`
3. Paste into the SQL editor
4. Click **RUN** button (or press Ctrl+Enter)

### Step 3: Verify It Worked
After running, you should see output like:
```
Success. Rows returned: X
```

The last SELECT query will show you all users and their profile status.

### Step 4: Check Your Profile
1. Refresh your Account Settings page
2. Open browser console (F12)
3. Look for these logs:
   - 🔍 Loading profile for user: [your-user-id]
   - ✅ Profile loaded successfully: [your-data]

4. You should now see YOUR email address (not "user@example.com")

## If Still Not Working

### Quick Debug Check
Run this in Supabase SQL Editor:

```sql
-- Check if you have a profile
SELECT 
  au.email as auth_email,
  up.email as profile_email,
  up.full_name,
  CASE 
    WHEN up.id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ HAS PROFILE'
  END as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE au.email = 'YOUR_EMAIL_HERE';  -- Replace with your actual email
```

### If Trigger Doesn't Exist
Run this to create it:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, email, subscription_tier, subscription_status,
    monthly_message_limit, monthly_messages_used, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, 'free', 'active', 1000, 0, NOW(), NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Expected Result
After fix, you should see:
- ✅ Your actual email address
- ✅ Empty name field (ready to fill in)
- ✅ Empty phone field (ready to fill in)
- ✅ Can save changes and they persist

## Still Having Issues?
1. Check browser console for error messages
2. Verify you're logged in with the correct account
3. Make sure RLS policies allow reading your own profile
