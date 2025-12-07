-- Migration: Remove email field from profiles table
-- This migration removes the email field as it's no longer needed
-- Users are now identified by phone number, and internal placeholders are used for Supabase Auth

-- Step 1: Drop the unique constraint on email
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;

-- Step 2: Drop the email index
DROP INDEX IF EXISTS idx_profiles_email;

-- Step 3: Drop the email column
ALTER TABLE profiles DROP COLUMN IF EXISTS email;

-- Verification query - should show email is gone
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';
