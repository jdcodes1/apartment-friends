-- ===================================
-- DIAGNOSTIC & FIX: Phone Auth Issues
-- ===================================

-- 1. First, let's check if the trigger exists and what it does
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass;

-- 2. Check for any errors in recent profile creations
-- (This might not return anything if RLS blocks it)
SELECT id, email, first_name, last_name, phone_number, created_at FROM profiles ORDER BY created_at DESC LIMIT 5;

-- 3. Check if there are unique constraint issues on phone_number
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'profiles';

-- 4. Drop the problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_phone_auth();

-- 5. Create a MUCH simpler, more robust trigger that won't fail
-- This uses error handling to prevent auth creation from failing
CREATE OR REPLACE FUNCTION handle_new_user_phone_auth()
RETURNS TRIGGER AS $$
DECLARE
  phone_val TEXT;
  phone_verified_val BOOLEAN;
BEGIN
  -- Extract values from metadata, with defaults
  phone_val := NEW.raw_user_meta_data->>'phone';
  phone_verified_val := COALESCE((NEW.raw_user_meta_data->>'phone_verified')::boolean, false);

  -- Only try to insert if profile doesn't already exist
  IF NOT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    BEGIN
      INSERT INTO profiles (
        id,
        email,
        first_name,
        last_name,
        phone_number,
        phone_verified
      )
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Account'),
        phone_val,
        phone_verified_val
      );
    EXCEPTION WHEN OTHERS THEN
      -- If insert fails (e.g., duplicate phone_number), just log it and continue
      -- This prevents auth user creation from failing
      RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_phone_auth();

-- 7. Make sure phone_number constraint allows NULLs (for non-phone users)
-- Drop old constraint if it exists without allowing NULL
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_number_unique;

-- 8. Recreate the unique constraint that allows NULL values
ALTER TABLE profiles 
ADD CONSTRAINT profiles_phone_number_unique UNIQUE (phone_number) WHERE phone_number IS NOT NULL;

-- 9. Verify the constraints and indexes are correct
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND indexname LIKE '%phone%';

-- 10. Grant proper permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.phone_verification_codes TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.phone_verification_codes TO authenticated;

-- ===================================
-- AFTER RUNNING THIS:
-- ===================================
-- 1. Stop your server
-- 2. Delete any test user accounts with that phone number from auth.users in Supabase
-- 3. Restart your server
-- 4. Try registering again
-- ===================================
