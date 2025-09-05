import express, { Request, Response } from 'express';
import { ProfileService } from '../services/profileService';
import { FriendService } from '../services/friendService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const profileService = new ProfileService();
const friendService = new FriendService();

interface FacebookUser {
  id: string;
  name: string;
  email?: string;
  first_name: string;
  last_name: string;
}

interface FacebookFriendsResponse {
  data: {
    id: string;
    name: string;
  }[];
}

// Note: Facebook's friend list API is heavily restricted since 2018
// This endpoint exists for future use when proper permissions are available
router.post('/import-friends', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Facebook access token is required' });
    }

    // Note: This API requires special permissions from Facebook that are difficult to obtain
    // For now, return a message about the limitation
    res.json({
      message: 'Facebook friend import is currently limited due to Facebook API restrictions',
      note: 'Users can manually send friend requests to people they know on the platform',
      friendsConnected: 0,
      totalFacebookFriends: 0
    });

  } catch (error) {
    console.error('Import Facebook friends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/connect-account', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Facebook access token is required' });
    }

    const facebookApiUrl = `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,first_name,last_name`;
    
    try {
      const response = await fetch(facebookApiUrl);
      const fbUser = await response.json() as FacebookUser;

      if (!response.ok) {
        return res.status(400).json({ 
          error: 'Failed to verify Facebook account',
          details: fbUser
        });
      }

      // Check if this Facebook ID is already connected to another user
      const existingUserWithFbId = await profileService.getProfileByFacebookId(fbUser.id);
      if (existingUserWithFbId && existingUserWithFbId.id !== user.id) {
        return res.status(409).json({ 
          error: 'This Facebook account is already connected to another user' 
        });
      }

      // Update user profile with Facebook ID
      await profileService.updateProfile(user.id, { facebook_id: fbUser.id });

      res.json({
        message: 'Facebook account connected successfully',
        facebookName: fbUser.name
      });

    } catch (fetchError) {
      return res.status(500).json({ 
        error: 'Failed to connect to Facebook API',
        details: fetchError 
      });
    }

  } catch (error) {
    console.error('Connect Facebook account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/disconnect-account', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Remove Facebook ID from user profile
    await profileService.updateProfile(user.id, { facebook_id: null });

    res.json({ message: 'Facebook account disconnected successfully' });

  } catch (error) {
    console.error('Disconnect Facebook account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;