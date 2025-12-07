-- ===================================
-- APARTMENT FRIENDS - SIMPLIFIED SCHEMA V2
-- Phone-based, 2-degree friend network
-- ===================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- PROFILES TABLE
-- ===================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- Required fields
  phone_number TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,

  -- Profile completion
  profile_complete BOOLEAN DEFAULT false,

  -- Current address (used as default for new listings)
  current_address TEXT,
  current_city TEXT,
  current_state TEXT CHECK (current_state IS NULL OR LENGTH(current_state) = 2),
  current_zip TEXT,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),

  -- Optional
  profile_picture TEXT,
  contacts_uploaded BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- FRIEND CONNECTIONS TABLE
-- Phone-based friend requests
-- ===================================
CREATE TABLE friend_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  requested_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1, user2),
  CHECK (user1 < user2) -- Ensure consistent ordering
);

-- ===================================
-- CONTACT UPLOADS TABLE
-- Store user's uploaded contacts to find friends
-- ===================================
CREATE TABLE uploaded_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  matched_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, phone_number)
);

-- ===================================
-- LISTINGS TABLE
-- Apartments and rooms only (no "looking for")
-- All listings visible to friends only (no public/link-only)
-- ===================================
CREATE TABLE listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL CHECK (LENGTH(title) <= 100),
  description TEXT NOT NULL CHECK (LENGTH(description) <= 2000),

  -- Type: apartment or room only
  listing_type TEXT CHECK (listing_type IN ('apartment', 'room')) NOT NULL,
  property_type TEXT CHECK (property_type IN ('studio', '1br', '2br', '3br', '4br+')),

  price INTEGER CHECK (price >= 0) NOT NULL,

  -- Location fields
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL CHECK (LENGTH(state) = 2),
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  amenities TEXT[],
  images TEXT[],
  available_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Room details (for room listings)
  room_details JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- PHONE VERIFICATION CODES TABLE
-- For passwordless SMS authentication
-- ===================================
CREATE TABLE phone_verification_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

-- Profiles indexes
CREATE INDEX idx_profiles_phone ON profiles(phone_number);
CREATE INDEX idx_profiles_complete ON profiles(profile_complete);

-- Friend connections indexes
CREATE INDEX idx_friend_connections_user1_status ON friend_connections(user1, status);
CREATE INDEX idx_friend_connections_user2_status ON friend_connections(user2, status);

-- Contact uploads indexes
CREATE INDEX idx_uploaded_contacts_user ON uploaded_contacts(user_id);
CREATE INDEX idx_uploaded_contacts_phone ON uploaded_contacts(phone_number);
CREATE INDEX idx_uploaded_contacts_matched ON uploaded_contacts(matched_user_id) WHERE matched_user_id IS NOT NULL;

-- Listings indexes
CREATE INDEX idx_listings_owner ON listings(owner_id);
CREATE INDEX idx_listings_type ON listings(listing_type);
CREATE INDEX idx_listings_location ON listings(city, state);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_available_date ON listings(available_date);
CREATE INDEX idx_listings_active ON listings(is_active);
CREATE INDEX idx_listings_coordinates ON listings(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Phone verification codes indexes
CREATE INDEX idx_phone_codes_phone ON phone_verification_codes(phone_number);
CREATE INDEX idx_phone_codes_expires ON phone_verification_codes(expires_at);

-- ===================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- ====================
-- PROFILES POLICIES
-- ====================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Users can view profiles of friends within 2 degrees
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
          END NOT IN (SELECT friend_id FROM friend_network) -- Prevent duplicates
      )
      SELECT 1 FROM friend_network WHERE friend_id = profiles.id
    )
  );

-- ====================
-- FRIEND CONNECTIONS POLICIES
-- ====================

-- Users can view their friend connections
CREATE POLICY "Users can view their connections" ON friend_connections
  FOR SELECT USING (
    user1 = auth.uid() OR user2 = auth.uid()
  );

-- Users can create friend requests
CREATE POLICY "Users can send friend requests" ON friend_connections
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND
    (user1 = auth.uid() OR user2 = auth.uid())
  );

-- Users can accept/update connections where they are involved
CREATE POLICY "Users can update their connections" ON friend_connections
  FOR UPDATE USING (
    user1 = auth.uid() OR user2 = auth.uid()
  );

-- Users can delete their connections
CREATE POLICY "Users can delete their connections" ON friend_connections
  FOR DELETE USING (
    user1 = auth.uid() OR user2 = auth.uid()
  );

-- ====================
-- UPLOADED CONTACTS POLICIES
-- ====================

-- Users can only manage their own contacts
CREATE POLICY "Users can manage their contacts" ON uploaded_contacts
  FOR ALL USING (user_id = auth.uid());

-- ====================
-- LISTINGS POLICIES
-- ====================

-- Users can view their own listings
CREATE POLICY "Users can view their own listings" ON listings
  FOR ALL USING (owner_id = auth.uid());

-- Users can view listings from friends within 2 degrees
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

-- Users can only create listings for themselves
CREATE POLICY "Users can create their own listings" ON listings
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can only update their own listings
CREATE POLICY "Users can update their own listings" ON listings
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can only delete their own listings
CREATE POLICY "Users can delete their own listings" ON listings
  FOR DELETE USING (owner_id = auth.uid());

-- ====================
-- PHONE VERIFICATION CODES POLICIES
-- ====================

-- Anyone can create verification codes (for signup)
CREATE POLICY "Anyone can create verification codes" ON phone_verification_codes
  FOR INSERT WITH CHECK (true);

-- Anyone can read their own verification codes
CREATE POLICY "Users can read their verification codes" ON phone_verification_codes
  FOR SELECT USING (true);

-- ===================================
-- FUNCTIONS
-- ===================================

-- Function to match uploaded contacts with existing users
CREATE OR REPLACE FUNCTION match_contacts_with_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Update matched_user_id if a user with this phone number exists
  UPDATE uploaded_contacts
  SET matched_user_id = (
    SELECT id FROM profiles WHERE phone_number = NEW.phone_number LIMIT 1
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-match contacts when uploaded
CREATE TRIGGER trigger_match_contacts
AFTER INSERT ON uploaded_contacts
FOR EACH ROW
EXECUTE FUNCTION match_contacts_with_users();

-- Function to update profile updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_connections_updated_at
BEFORE UPDATE ON friend_connections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- INITIAL DATA / SETUP
-- ===================================

-- You can add any initial data here if needed
