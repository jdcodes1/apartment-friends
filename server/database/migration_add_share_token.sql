-- Add share_token field to listings table for sharing functionality
ALTER TABLE listings 
ADD COLUMN share_token TEXT UNIQUE;

-- Create index for share_token for better performance on shared listing lookups
CREATE INDEX idx_listings_share_token ON listings(share_token) WHERE share_token IS NOT NULL;

-- Add RLS policy to allow public access to shared listings
CREATE POLICY "Allow public access to shared listings" ON listings
  FOR SELECT USING (
    share_token IS NOT NULL AND 
    is_active = true AND 
    share_token = ANY(
      SELECT unnest(string_to_array(current_setting('request.headers', true)::json->>'x-share-token', ','))
    )
  );

-- Alternative simpler policy for shared listings (bypasses RLS for shared tokens)
-- This will be used instead of the complex policy above
DROP POLICY IF EXISTS "Allow public access to shared listings" ON listings;

-- Note: The public shared endpoint will use the service role key to bypass RLS
-- This is more secure and simpler than creating complex RLS policies