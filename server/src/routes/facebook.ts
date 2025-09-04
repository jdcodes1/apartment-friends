import express, { Request, Response } from 'express';
import User from '../models/User';
import FriendConnection from '../models/FriendConnection';
import { generateToken } from '../utils/auth';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

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

router.post('/import-friends', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Facebook access token is required' });
    }

    const facebookApiUrl = `https://graph.facebook.com/me/friends?access_token=${accessToken}&fields=id,name,email`;
    
    try {
      const response = await fetch(facebookApiUrl);
      const data = await response.json() as FacebookFriendsResponse;

      if (!response.ok) {
        return res.status(400).json({ 
          message: 'Failed to fetch Facebook friends',
          error: data
        });
      }

      let friendsConnected = 0;
      const errors: string[] = [];

      for (const fbFriend of data.data) {
        try {
          const existingUser = await User.findOne({ facebookId: fbFriend.id });
          
          if (existingUser && existingUser._id.toString() !== user._id.toString()) {
            const existingConnection = await FriendConnection.findOne({
              $or: [
                { user1: user._id, user2: existingUser._id },
                { user1: existingUser._id, user2: user._id }
              ]
            });

            if (!existingConnection) {
              const friendConnection = new FriendConnection({
                user1: user._id,
                user2: existingUser._id,
                requestedBy: user._id,
                status: 'pending'
              });

              await friendConnection.save();
              friendsConnected++;
            }
          }
        } catch (error) {
          errors.push(`Failed to connect with ${fbFriend.name}: ${error}`);
        }
      }

      res.json({
        message: `Successfully sent ${friendsConnected} friend requests`,
        friendsConnected,
        totalFacebookFriends: data.data.length,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (fetchError) {
      return res.status(500).json({ 
        message: 'Failed to connect to Facebook API',
        error: fetchError 
      });
    }

  } catch (error) {
    console.error('Import Facebook friends error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/connect-account', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Facebook access token is required' });
    }

    const facebookApiUrl = `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,first_name,last_name`;
    
    try {
      const response = await fetch(facebookApiUrl);
      const fbUser = await response.json() as FacebookUser;

      if (!response.ok) {
        return res.status(400).json({ 
          message: 'Failed to verify Facebook account',
          error: fbUser
        });
      }

      const existingUserWithFbId = await User.findOne({ facebookId: fbUser.id });
      if (existingUserWithFbId && existingUserWithFbId._id.toString() !== user._id.toString()) {
        return res.status(409).json({ 
          message: 'This Facebook account is already connected to another user' 
        });
      }

      user.facebookId = fbUser.id;
      await user.save();

      res.json({
        message: 'Facebook account connected successfully',
        facebookName: fbUser.name
      });

    } catch (fetchError) {
      return res.status(500).json({ 
        message: 'Failed to connect to Facebook API',
        error: fetchError 
      });
    }

  } catch (error) {
    console.error('Connect Facebook account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/disconnect-account', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    user.facebookId = undefined;
    await user.save();

    res.json({ message: 'Facebook account disconnected successfully' });

  } catch (error) {
    console.error('Disconnect Facebook account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;