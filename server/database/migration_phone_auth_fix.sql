-- ===================================
-- MIGRATION: Fix Phone Auth Schema
-- ===================================
-- This migration updates the profiles table to support phone-based authentication
-- and removes/updates triggers that conflict with phone auth flow

-- 1. Add phone-related columns to profiles if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- 2. Drop the old trigger that auto-creates profiles
-- This trigger causes conflicts with phone auth flow
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. Create a new trigger that allows phone auth to work
-- This trigger creates a profile with minimal required fields
CREATE OR REPLACE FUNCTION handle_new_user_phone_auth()
RETURNS TRIGGER AS $$
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
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE((NEW.raw_user_meta_data->>'phone_verified')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    phone_verified = COALESCE(EXCLUDED.phone_verified, profiles.phone_verified);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_phone_auth();

-- 4. Create index on phone_number for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number)
WHERE phone_number IS NOT NULL;

-- 5. Create phone verification codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS phone_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for phone verification codes
CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_phone ON phone_verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_expires ON phone_verification_codes(expires_at);

-- 6. Enable RLS on phone_verification_codes if not already enabled
ALTER TABLE phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for phone_verification_codes
DROP POLICY IF EXISTS "Anyone can create verification codes" ON phone_verification_codes;
CREATE POLICY "Anyone can create verification codes" ON phone_verification_codes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read their verification codes" ON phone_verification_codes;
CREATE POLICY "Users can read their verification codes" ON phone_verification_codes
  FOR SELECT USING (true);

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.phone_verification_codes TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.phone_verification_codes TO authenticated;

-- ===================================
-- VERIFICATION
-- ===================================
-- Run these queries to verify the migration:
-- 
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;
--
-- This should show: id, email, first_name, last_name, phone_number, phone_verified, etc.
