-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase auth will handle basic auth, but we need additional fields)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_picture TEXT,
  phone TEXT,
  facebook_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friend connections table
CREATE TABLE friend_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  requested_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1, user2)
);

-- Listings table
CREATE TABLE listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL CHECK (LENGTH(title) <= 100),
  description TEXT NOT NULL CHECK (LENGTH(description) <= 2000),
  listing_type TEXT CHECK (listing_type IN ('apartment', 'room', 'looking_for')) NOT NULL,
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
  
  -- Room details (JSON for flexibility)
  room_details JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_facebook_id ON profiles(facebook_id) WHERE facebook_id IS NOT NULL;

CREATE INDEX idx_friend_connections_user1_status ON friend_connections(user1, status);
CREATE INDEX idx_friend_connections_user2_status ON friend_connections(user2, status);

CREATE INDEX idx_listings_owner ON listings(owner_id);
CREATE INDEX idx_listings_type ON listings(listing_type);
CREATE INDEX idx_listings_location ON listings(city, state);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_available_date ON listings(available_date);
CREATE INDEX idx_listings_active ON listings(is_active);

-- RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of friends within 3 degrees" ON profiles
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
        
        -- Friends of friends (up to 3rd degree)
        SELECT 
          CASE 
            WHEN fc.user1 = fn.friend_id THEN fc.user2
            ELSE fc.user1
          END as friend_id,
          fn.degree + 1
        FROM friend_connections fc
        JOIN friend_network fn ON (fc.user1 = fn.friend_id OR fc.user2 = fn.friend_id)
        WHERE fc.status = 'accepted' 
          AND fn.degree < 3
          AND CASE 
            WHEN fc.user1 = fn.friend_id THEN fc.user2
            ELSE fc.user1
          END != auth.uid()
      )
      SELECT 1 FROM friend_network WHERE friend_id = profiles.id
    )
  );

-- Friend connections policies
CREATE POLICY "Users can manage their friend connections" ON friend_connections
  FOR ALL USING (user1 = auth.uid() OR user2 = auth.uid());

-- Listings policies
CREATE POLICY "Users can manage their own listings" ON listings
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Users can view listings from friends within 3 degrees" ON listings
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
        
        -- Friends of friends (up to 3rd degree)
        SELECT 
          CASE 
            WHEN fc.user1 = fn.friend_id THEN fc.user2
            ELSE fc.user1
          END as friend_id,
          fn.degree + 1
        FROM friend_connections fc
        JOIN friend_network fn ON (fc.user1 = fn.friend_id OR fc.user2 = fn.friend_id)
        WHERE fc.status = 'accepted' 
          AND fn.degree < 3
          AND CASE 
            WHEN fc.user1 = fn.friend_id THEN fc.user2
            ELSE fc.user1
          END != auth.uid()
      )
      SELECT 1 FROM friend_network WHERE friend_id = listings.owner_id
    )
  );

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_connections_updated_at BEFORE UPDATE ON friend_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();