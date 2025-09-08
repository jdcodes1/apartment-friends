-- Add permission field to listings table
ALTER TABLE listings 
ADD COLUMN permission TEXT 
CHECK (permission IN ('private', 'link_only', 'public')) 
DEFAULT 'private';

-- Create index for permission field for better performance
CREATE INDEX idx_listings_permission ON listings(permission);

-- Update existing listings to have appropriate permissions
-- Listings with share_token will be set to 'link_only'
-- All others will remain 'private' (default)
UPDATE listings 
SET permission = 'link_only' 
WHERE share_token IS NOT NULL;

-- Update RLS policies to handle the new permission system
-- Drop the existing complex shared listing policy
DROP POLICY IF EXISTS "Allow public access to shared listings" ON listings;

-- Update the main listing policy to include permission-based access
DROP POLICY IF EXISTS "Users can view listings from friends within 3 degrees" ON listings;

CREATE POLICY "Users can view listings based on permissions and network" ON listings
  FOR SELECT USING (
    owner_id = auth.uid() OR
    permission = 'public' OR
    (permission = 'link_only' AND share_token IS NOT NULL) OR
    (permission = 'private' AND EXISTS (
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
    ))
  );