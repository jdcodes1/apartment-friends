-- Migration for phone-based authentication with magic codes
-- This migration adds support for passwordless SMS authentication

-- Step 1: Create verification_codes table for storing magic codes
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for quick lookups
CREATE INDEX idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Step 2: Create rate_limiting table to prevent abuse
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'send_code' or 'verify_code'
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auth_rate_limits_phone ON auth_rate_limits(phone, action_type);

-- Step 3: Update profiles table to make phone unique and add phone_verified
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Note: We'll keep email for now but make it optional for backwards compatibility
ALTER TABLE profiles
  ALTER COLUMN email DROP NOT NULL;

-- Add unique constraint on phone (but allow null for backwards compat)
CREATE UNIQUE INDEX idx_profiles_phone_unique ON profiles(phone) WHERE phone IS NOT NULL;

-- Step 4: Add function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_phone TEXT,
  p_action_type TEXT,
  p_max_attempts INTEGER,
  p_window_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_attempts INTEGER;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if currently blocked
  SELECT blocked_until INTO v_blocked_until
  FROM auth_rate_limits
  WHERE phone = p_phone
    AND action_type = p_action_type
    AND blocked_until IS NOT NULL
    AND blocked_until > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_blocked_until IS NOT NULL THEN
    RETURN false;
  END IF;

  -- Count recent attempts
  SELECT COALESCE(SUM(attempts), 0) INTO v_attempts
  FROM auth_rate_limits
  WHERE phone = p_phone
    AND action_type = p_action_type
    AND window_start > NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  -- If exceeded, block for 1 hour
  IF v_attempts >= p_max_attempts THEN
    INSERT INTO auth_rate_limits (phone, action_type, attempts, blocked_until)
    VALUES (p_phone, p_action_type, 0, NOW() + INTERVAL '1 hour');
    RETURN false;
  END IF;

  -- Record this attempt
  INSERT INTO auth_rate_limits (phone, action_type, attempts)
  VALUES (p_phone, p_action_type, 1);

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Step 6: RLS policies for new tables
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access these tables (not users)
CREATE POLICY "Service role only" ON verification_codes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON auth_rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- Step 7: Update the handle_new_user function to work with phone auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, phone, phone_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE((NEW.raw_user_meta_data->>'phone_verified')::BOOLEAN, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE verification_codes IS 'Stores magic codes for phone-based authentication. Codes expire after 10 minutes.';
COMMENT ON TABLE auth_rate_limits IS 'Tracks authentication attempts to prevent abuse. Blocks users for 1 hour after too many attempts.';
COMMENT ON COLUMN profiles.phone_verified IS 'Indicates if the phone number has been verified via SMS code.';
