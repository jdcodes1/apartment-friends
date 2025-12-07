-- ===================================
-- MIGRATION: V1 to V2 (FIXED)
-- Safely upgrade existing database
-- ===================================

-- ⚠️ BACKUP FIRST! This will modify your existing database.

-- ===================================
-- STEP 1: DROP OLD POLICIES
-- ===================================

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles of friends within 3 degrees" ON profiles;
DROP POLICY IF EXISTS "Users can view their connections" ON friend_connections;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_connections;
DROP POLICY IF EXISTS "Users can update their connections" ON friend_connections;
DROP POLICY IF EXISTS "Users can delete their connections" ON friend_connections;
DROP POLICY IF EXISTS "Users can view their own listings" ON listings;
DROP POLICY IF EXISTS "Users can view listings from friends within 3 degrees" ON listings;
DROP POLICY IF EXISTS "Users can create their own listings" ON listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON listings;

-- ===================================
-- STEP 2: DROP OLD INDEXES
-- ===================================

DROP INDEX IF EXISTS idx_profiles_facebook_id;

-- ===================================
-- STEP 3: MODIFY PROFILES TABLE
-- ===================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_zip TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contacts_uploaded BOOLEAN DEFAULT false;

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_phone_number_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_phone_number_unique UNIQUE (phone_number);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_current_state_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_current_state_check
    CHECK (current_state IS NULL OR LENGTH(current_state) = 2);
  END IF;
END $$;

-- Remove facebook_id
ALTER TABLE profiles DROP COLUMN IF EXISTS facebook_id;

-- ===================================
-- STEP 4: MODIFY LISTINGS TABLE
-- ===================================

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_listing_type_check;
ALTER TABLE listings ADD CONSTRAINT listings_listing_type_check
  CHECK (listing_type IN ('apartment', 'room'));

-- Delete any 'looking_for' listings
DELETE FROM listings WHERE listing_type = 'looking_for';

-- ===================================
-- STEP 5: MODIFY FRIEND_CONNECTIONS
-- ===================================

-- Fix any connections where user1 > user2
UPDATE friend_connections
SET user1 = user2, user2 = user1
WHERE user1 > user2;

-- Add check constraint
ALTER TABLE friend_connections DROP CONSTRAINT IF EXISTS friend_connections_user_order_check;
ALTER TABLE friend_connections ADD CONSTRAINT friend_connections_user_order_check
  CHECK (user1 < user2);

-- ===================================
-- STEP 6: CREATE NEW TABLES
-- ===================================

CREATE TABLE IF NOT EXISTS uploaded_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  matched_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, phone_number)
);

CREATE TABLE IF NOT EXISTS phone_verification_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- STEP 7: CREATE NEW INDEXES
-- ===================================

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_complete ON profiles(profile_complete);
CREATE INDEX IF NOT EXISTS idx_uploaded_contacts_user ON uploaded_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_contacts_phone ON uploaded_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_uploaded_contacts_matched ON uploaded_contacts(matched_user_id)
  WHERE matched_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_coordinates ON listings(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phone_codes_phone ON phone_verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_codes_expires ON phone_verification_codes(expires_at);

-- ===================================
-- STEP 8: ENABLE RLS ON NEW TABLES
-- ===================================

ALTER TABLE uploaded_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- ===================================
-- STEP 9: CREATE HELPER FUNCTION FOR 2-DEGREE NETWORK
-- ===================================

CREATE OR REPLACE FUNCTION get_friends_within_2_degrees(user_uuid UUID)
RETURNS TABLE(friend_id UUID, degree INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE friend_network AS (
    -- Base case: Direct friends (1st degree)
    SELECT
      CASE
        WHEN user1 = user_uuid THEN user2
        ELSE user1
      END as friend_id,
      1 as degree
    FROM friend_connections
    WHERE (user1 = user_uuid OR user2 = user_uuid)
      AND status = 'accepted'

    UNION

    -- Recursive case: Friends of friends (2nd degree)
    SELECT DISTINCT
      CASE
        WHEN fc.user1 = fn.friend_id THEN fc.user2
        ELSE fc.user1
      END as friend_id,
      2 as degree
    FROM friend_network fn
    JOIN friend_connections fc ON (fc.user1 = fn.friend_id OR fc.user2 = fn.friend_id)
    WHERE fn.degree = 1  -- Only expand from 1st degree
      AND fc.status = 'accepted'
      AND CASE
        WHEN fc.user1 = fn.friend_id THEN fc.user2
        ELSE fc.user1
      END != user_uuid  -- Don't include the original user
  )
  SELECT DISTINCT friend_network.friend_id, MIN(friend_network.degree) as degree
  FROM friend_network
  GROUP BY friend_network.friend_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ===================================
-- STEP 10: CREATE NEW RLS POLICIES
-- ===================================

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view friends within 2 degrees" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR
    id IN (SELECT friend_id FROM get_friends_within_2_degrees(auth.uid()))
  );

-- FRIEND CONNECTIONS POLICIES
CREATE POLICY "Users can view their connections" ON friend_connections
  FOR SELECT USING (user1 = auth.uid() OR user2 = auth.uid());

CREATE POLICY "Users can send friend requests" ON friend_connections
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND
    (user1 = auth.uid() OR user2 = auth.uid())
  );

CREATE POLICY "Users can update their connections" ON friend_connections
  FOR UPDATE USING (user1 = auth.uid() OR user2 = auth.uid());

CREATE POLICY "Users can delete their connections" ON friend_connections
  FOR DELETE USING (user1 = auth.uid() OR user2 = auth.uid());

-- UPLOADED CONTACTS POLICIES
CREATE POLICY "Users can manage their contacts" ON uploaded_contacts
  FOR ALL USING (user_id = auth.uid());

-- LISTINGS POLICIES
CREATE POLICY "Users can view their own listings" ON listings
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Users can view listings from 2-degree network" ON listings
  FOR SELECT USING (
    owner_id = auth.uid() OR
    owner_id IN (SELECT friend_id FROM get_friends_within_2_degrees(auth.uid()))
  );

CREATE POLICY "Users can create their own listings" ON listings
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own listings" ON listings
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own listings" ON listings
  FOR DELETE USING (owner_id = auth.uid());

-- PHONE VERIFICATION CODES POLICIES
CREATE POLICY "Anyone can create verification codes" ON phone_verification_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their verification codes" ON phone_verification_codes
  FOR SELECT USING (true);

-- ===================================
-- STEP 11: CREATE FUNCTIONS & TRIGGERS
-- ===================================

CREATE OR REPLACE FUNCTION match_contacts_with_users()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE uploaded_contacts
  SET matched_user_id = (
    SELECT id FROM profiles WHERE phone_number = NEW.phone_number LIMIT 1
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_match_contacts ON uploaded_contacts;
CREATE TRIGGER trigger_match_contacts
AFTER INSERT ON uploaded_contacts
FOR EACH ROW
EXECUTE FUNCTION match_contacts_with_users();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_friend_connections_updated_at ON friend_connections;
CREATE TRIGGER update_friend_connections_updated_at
BEFORE UPDATE ON friend_connections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- MIGRATION COMPLETE!
-- ===================================

SELECT 'Migration from V1 to V2 complete! ✅' as status;
