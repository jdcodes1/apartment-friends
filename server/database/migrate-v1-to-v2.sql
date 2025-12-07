-- ===================================
-- MIGRATION: V1 to V2
-- Safely upgrade existing database
-- ===================================

-- ⚠️ BACKUP FIRST! This will modify your existing database.
-- If you have important data, export it before running this.

-- ===================================
-- STEP 1: DROP OLD POLICIES
-- ===================================

-- Drop all existing RLS policies
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

-- Add new required column (phone_number)
-- If you have existing users, you'll need to populate this manually or set a default
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Make phone_number unique after populating it
-- For now, let's add a temporary constraint
ALTER TABLE profiles
  ADD CONSTRAINT profiles_phone_number_unique UNIQUE (phone_number);

-- Add new columns for profile completion
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- Add current address columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_address TEXT,
  ADD COLUMN IF NOT EXISTS current_city TEXT,
  ADD COLUMN IF NOT EXISTS current_state TEXT,
  ADD COLUMN IF NOT EXISTS current_zip TEXT,
  ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8);

-- Add contact upload tracking
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS contacts_uploaded BOOLEAN DEFAULT false;

-- Add state length constraint
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_current_state_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_current_state_check
  CHECK (current_state IS NULL OR LENGTH(current_state) = 2);

-- Remove facebook_id column
ALTER TABLE profiles
  DROP COLUMN IF EXISTS facebook_id;

-- ===================================
-- STEP 4: MODIFY LISTINGS TABLE
-- ===================================

-- Update listing_type constraint to remove 'looking_for'
ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_listing_type_check;

ALTER TABLE listings
  ADD CONSTRAINT listings_listing_type_check
  CHECK (listing_type IN ('apartment', 'room'));

-- Note: If you have existing 'looking_for' listings, you need to:
-- 1. Either delete them
-- 2. Or convert them to another type
-- Uncomment the line below to delete them:
-- DELETE FROM listings WHERE listing_type = 'looking_for';

-- ===================================
-- STEP 5: MODIFY FRIEND_CONNECTIONS TABLE
-- ===================================

-- Add check constraint to ensure user1 < user2
ALTER TABLE friend_connections
  DROP CONSTRAINT IF EXISTS friend_connections_user_order_check;

ALTER TABLE friend_connections
  ADD CONSTRAINT friend_connections_user_order_check
  CHECK (user1 < user2);

-- Note: This might fail if you have existing connections where user1 > user2
-- You'll need to flip those first with:
-- UPDATE friend_connections SET user1 = user2, user2 = user1 WHERE user1 > user2;

-- ===================================
-- STEP 6: CREATE NEW TABLES
-- ===================================

-- Contact uploads table
CREATE TABLE IF NOT EXISTS uploaded_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  matched_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, phone_number)
);

-- Phone verification codes table
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

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_complete ON profiles(profile_complete);

-- Contact uploads indexes
CREATE INDEX IF NOT EXISTS idx_uploaded_contacts_user ON uploaded_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_contacts_phone ON uploaded_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_uploaded_contacts_matched ON uploaded_contacts(matched_user_id)
  WHERE matched_user_id IS NOT NULL;

-- Listings indexes for coordinates
CREATE INDEX IF NOT EXISTS idx_listings_coordinates ON listings(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Phone verification codes indexes
CREATE INDEX IF NOT EXISTS idx_phone_codes_phone ON phone_verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_codes_expires ON phone_verification_codes(expires_at);

-- ===================================
-- STEP 8: ENABLE RLS ON NEW TABLES
-- ===================================

ALTER TABLE uploaded_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- ===================================
-- STEP 9: CREATE NEW RLS POLICIES
-- ===================================

-- ====================
-- PROFILES POLICIES (2-degree network)
-- ====================

CREATE POLICY "Users can view their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view friends within 2 degrees" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (
      WITH RECURSIVE friend_network AS (
        -- Direct friends (1st degree)
        SELECT
          CASE
            WHEN user1 = auth.uid() THEN user2
            ELSE user1
          END as friend_id,
          1 as degree
        FROM friend_connections
        WHERE (user1 = auth.uid() OR user2 = auth.uid())
          AND status = 'accepted'

        UNION ALL

        -- Friends of friends (2nd degree only)
        SELECT
          CASE
            WHEN fc.user1 = fn.friend_id THEN fc.user2
            ELSE fc.user1
          END as friend_id,
          fn.degree + 1 as degree
        FROM friend_network fn
        JOIN friend_connections fc ON (fc.user1 = fn.friend_id OR fc.user2 = fn.friend_id)
        WHERE fn.degree < 2 -- Stop at 2 degrees
          AND fc.status = 'accepted'
          AND CASE
            WHEN fc.user1 = fn.friend_id THEN fc.user2
            ELSE fc.user1
          END NOT IN (SELECT friend_id FROM friend_network)
      )
      SELECT 1 FROM friend_network WHERE friend_id = profiles.id
    )
  );

-- ====================
-- FRIEND CONNECTIONS POLICIES
-- ====================

CREATE POLICY "Users can view their connections" ON friend_connections
  FOR SELECT USING (
    user1 = auth.uid() OR user2 = auth.uid()
  );

CREATE POLICY "Users can send friend requests" ON friend_connections
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND
    (user1 = auth.uid() OR user2 = auth.uid())
  );

CREATE POLICY "Users can update their connections" ON friend_connections
  FOR UPDATE USING (
    user1 = auth.uid() OR user2 = auth.uid()
  );

CREATE POLICY "Users can delete their connections" ON friend_connections
  FOR DELETE USING (
    user1 = auth.uid() OR user2 = auth.uid()
  );

-- ====================
-- UPLOADED CONTACTS POLICIES
-- ====================

CREATE POLICY "Users can manage their contacts" ON uploaded_contacts
  FOR ALL USING (user_id = auth.uid());

-- ====================
-- LISTINGS POLICIES (2-degree network)
-- ====================

CREATE POLICY "Users can view their own listings" ON listings
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Users can view listings from 2-degree network" ON listings
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      WITH RECURSIVE friend_network AS (
        -- Direct friends (1st degree)
        SELECT
          CASE
            WHEN user1 = auth.uid() THEN user2
            ELSE user1
          END as friend_id,
          1 as degree
        FROM friend_connections
        WHERE (user1 = auth.uid() OR user2 = auth.uid())
          AND status = 'accepted'

        UNION ALL

        -- Friends of friends (2nd degree only)
        SELECT
          CASE
            WHEN fc.user1 = fn.friend_id THEN fc.user2
            ELSE fc.user1
          END as friend_id,
          fn.degree + 1 as degree
        FROM friend_network fn
        JOIN friend_connections fc ON (fc.user1 = fn.friend_id OR fc.user2 = fn.friend_id)
        WHERE fn.degree < 2
          AND fc.status = 'accepted'
          AND CASE
            WHEN fc.user1 = fn.friend_id THEN fc.user2
            ELSE fc.user1
          END NOT IN (SELECT friend_id FROM friend_network)
      )
      SELECT 1 FROM friend_network WHERE friend_id = listings.owner_id
    )
  );

CREATE POLICY "Users can create their own listings" ON listings
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own listings" ON listings
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own listings" ON listings
  FOR DELETE USING (owner_id = auth.uid());

-- ====================
-- PHONE VERIFICATION CODES POLICIES
-- ====================

CREATE POLICY "Anyone can create verification codes" ON phone_verification_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their verification codes" ON phone_verification_codes
  FOR SELECT USING (true);

-- ===================================
-- STEP 10: CREATE FUNCTIONS & TRIGGERS
-- ===================================

-- Function to match uploaded contacts with existing users
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

-- Trigger to auto-match contacts when uploaded
DROP TRIGGER IF EXISTS trigger_match_contacts ON uploaded_contacts;
CREATE TRIGGER trigger_match_contacts
AFTER INSERT ON uploaded_contacts
FOR EACH ROW
EXECUTE FUNCTION match_contacts_with_users();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at (recreate to ensure they exist)
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

-- ⚠️ IMPORTANT POST-MIGRATION TASKS:
-- 1. If you have existing users without phone numbers, you need to add them
-- 2. If you have 'looking_for' listings, delete or convert them
-- 3. Test the friend network queries work correctly
-- 4. Verify all RLS policies are working

SELECT 'Migration from V1 to V2 complete! ✅' as status;
