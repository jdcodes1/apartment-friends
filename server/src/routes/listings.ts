import express, { Request, Response } from 'express';
import { ListingService } from '../services/listingService';
import { FriendService } from '../services/friendService';
import { ProfileService } from '../services/profileService';
import { ListingType, ListingPermission } from '../types/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const listingService = new ListingService();
const friendService = new FriendService();
const profileService = new ProfileService();

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      title,
      description,
      listingType,
      propertyType,
      price,
      location,
      latitude,
      longitude,
      amenities,
      images,
      availableDate,
      roomDetails
    } = req.body;

    // Extract address fields from location object if nested, or use top-level fields
    const address = location?.address || req.body.address;
    const city = location?.city || req.body.city;
    const state = location?.state || req.body.state;
    const zipCode = location?.zipCode || req.body.zipCode;

    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!listingType) missingFields.push('listingType');
    if (price === undefined) missingFields.push('price');
    if (!address) missingFields.push('address');
    if (!city) missingFields.push('city');
    if (!state) missingFields.push('state');
    if (!zipCode) missingFields.push('zipCode');
    if (!availableDate) missingFields.push('availableDate');

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      console.log('Request body:', req.body);
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields,
        received: Object.keys(req.body)
      });
    }

    // Validate listingType is one of the allowed values
    if (!Object.values(ListingType).includes(listingType as ListingType)) {
      return res.status(400).json({ 
        error: 'Invalid listing type',
        validTypes: Object.values(ListingType),
        received: listingType
      });
    }

    const listingData = {
      title,
      description,
      listing_type: listingType,
      property_type: propertyType,
      price: Number(price),
      address,
      city,
      state: state.toUpperCase(),
      zip_code: zipCode,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      amenities: amenities || [],
      images: images || [],
      available_date: availableDate,
      room_details: roomDetails || null,
      owner_id: user.id
    };

    const listing = await listingService.createListing(listingData);

    res.status(201).json({
      message: 'Listing created successfully',
      listing
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { type, city, state, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    
    const filters: any = {};
    
    if (type && Object.values(ListingType).includes(type as ListingType)) {
      filters.listingType = type;
    }

    if (city) {
      filters.city = city as string;
    }

    if (state) {
      filters.state = (state as string).toUpperCase();
    }

    if (minPrice) {
      filters.minPrice = Number(minPrice);
    }

    if (maxPrice) {
      filters.maxPrice = Number(maxPrice);
    }

    // Get listings - RLS will automatically filter to friend network
    const listings = await listingService.getActiveListings(filters);

    // Simple pagination for now (can be improved with proper offset/limit)
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedListings = listings.slice(startIndex, endIndex);

    res.json({
      listings: paginatedListings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: listings.length,
        pages: Math.ceil(listings.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/my-listings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const listings = await listingService.getListingsByOwner(user.id);
    res.json({ listings });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public endpoint to browse all public listings (no auth required)
router.get('/public', async (req: Request, res: Response) => {
  try {
    const { type, city, state, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    
    const filters: any = {};
    
    if (type && Object.values(ListingType).includes(type as ListingType)) {
      filters.listingType = type;
    }

    if (city) {
      filters.city = city as string;
    }

    if (state) {
      filters.state = (state as string).toUpperCase();
    }

    if (minPrice) {
      filters.minPrice = Number(minPrice);
    }

    if (maxPrice) {
      filters.maxPrice = Number(maxPrice);
    }

    // Get only public listings (permission = 'public')
    const listings = await listingService.getPublicListings(filters);

    // Simple pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedListings = listings.slice(startIndex, endIndex);

    res.json({
      listings: paginatedListings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: listings.length,
        pages: Math.ceil(listings.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Get public listings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public endpoint to view shared listing (no auth required)
router.get('/shared/:shareToken', async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;

    const listing = await listingService.getSharedListing(shareToken);

    if (!listing) {
      return res.status(404).json({ error: 'Shared listing not found or no longer available' });
    }

    res.json({ listing });
  } catch (error) {
    console.error('Get shared listing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const listing = await listingService.getListingById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // RLS will automatically enforce friend network access
    res.json({ listing });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const listing = await listingService.getListingById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.owner_id !== user.id) {
      return res.status(403).json({ error: 'You can only update your own listings' });
    }

    const updates: any = { ...req.body };
    // Convert frontend field names to database field names
    if (updates.listingType) {
      updates.listing_type = updates.listingType;
      delete updates.listingType;
    }
    if (updates.propertyType) {
      updates.property_type = updates.propertyType;
      delete updates.propertyType;
    }
    if (updates.availableDate) {
      updates.available_date = updates.availableDate;
      delete updates.availableDate;
    }
    if (updates.roomDetails) {
      updates.room_details = updates.roomDetails;
      delete updates.roomDetails;
    }

    const updatedListing = await listingService.updateListing(req.params.id, updates);

    res.json({
      message: 'Listing updated successfully',
      listing: updatedListing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const listing = await listingService.getListingById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.owner_id !== user.id) {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }

    await listingService.deleteListing(req.params.id);

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate share token for a listing (owner only)
router.post('/:id/share', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const listing = await listingService.getListingById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.owner.id !== user.id) {
      return res.status(403).json({ error: 'You can only share your own listings' });
    }

    const shareToken = await listingService.generateShareToken(req.params.id);
    
    // Generate frontend URL, not backend API URL
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:5173';
    
    const shareUrl = `${frontendUrl}/shared/${shareToken}`;

    res.json({
      message: 'Share link generated successfully',
      shareToken,
      shareUrl
    });
  } catch (error) {
    console.error('Generate share token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke share token for a listing (owner only)
router.delete('/:id/share', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const listing = await listingService.getListingById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.owner.id !== user.id) {
      return res.status(403).json({ error: 'You can only manage sharing for your own listings' });
    }

    await listingService.revokeShareToken(req.params.id);

    res.json({ message: 'Share link revoked successfully' });
  } catch (error) {
    console.error('Revoke share token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update listing permission (owner only)
router.patch('/:id/permission', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { permission } = req.body;

    if (!permission || !Object.values(ListingPermission).includes(permission as ListingPermission)) {
      return res.status(400).json({ 
        error: 'Invalid permission value',
        validPermissions: Object.values(ListingPermission)
      });
    }

    const listing = await listingService.getListingById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.owner.id !== user.id) {
      return res.status(403).json({ error: 'You can only change permissions for your own listings' });
    }

    const updatedListing = await listingService.updateListingPermission(
      req.params.id, 
      permission as ListingPermission
    );

    res.json({
      message: 'Listing permission updated successfully',
      listing: updatedListing
    });
  } catch (error) {
    console.error('Update listing permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update listing (owner only)
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const updateData = req.body;

    // First check if listing exists and user is the owner
    const existingListing = await listingService.getListingById(id);
    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (existingListing.owner_id !== user.id) {
      return res.status(403).json({ error: 'You can only edit your own listings' });
    }

    // Update the listing
    const updatedListing = await listingService.updateListing(id, updateData);
    
    res.status(200).json({
      message: 'Listing updated successfully',
      listing: updatedListing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete listing (owner only)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    // First check if listing exists and user is the owner
    const existingListing = await listingService.getListingById(id);
    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (existingListing.owner_id !== user.id) {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }

    // Delete the listing
    await listingService.deleteListing(id);
    
    res.status(200).json({
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;