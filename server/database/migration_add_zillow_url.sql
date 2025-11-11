-- Migration to add Zillow URL field to listings table
-- This allows users to link their listings to Zillow and import data from Zillow

-- Add zillow_url column to listings table
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS zillow_url TEXT;

-- Create index for Zillow URL lookups
CREATE INDEX IF NOT EXISTS idx_listings_zillow_url ON listings(zillow_url) WHERE zillow_url IS NOT NULL;

-- Add unique constraint to prevent duplicate imports
-- Comment this out if you want to allow multiple users to create listings from the same Zillow URL
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_zillow_url_unique ON listings(zillow_url) WHERE zillow_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN listings.zillow_url IS 'URL to the Zillow listing. Used for importing listing details and linking back to Zillow.';
