-- ===================================
-- MIGRATION: Fix Auth Trigger v2
-- ===================================
-- This fixes the trigger that's preventing user creation

-- 1. Drop the problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_phone_auth();

-- 2. Create a VERY simple trigger that just logs and returns
-- We'll NOT auto-create profiles - we'll handle it in the application instead
CREATE OR REPLACE FUNCTION handle_new_user_phone_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Just log the user creation - don't try to insert profile
  -- The application will handle profile creation after verification
  RAISE LOG 'New auth user created: % with email: %', NEW.id, NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_phone_auth();

-- 4. Verify the trigger exists
SELECT 
  tgname,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
AND tgname = 'on_auth_user_created';
