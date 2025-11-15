import express, { Request, Response } from 'express';
import { FriendService } from '../services/friendService';
import { ProfileService } from '../services/profileService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { friendRequestLimiter } from '../middleware/rateLimiter';

const router = express.Router();
const friendService = new FriendService();
const profileService = new ProfileService();

router.post('/send-request', authenticateToken, friendRequestLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (userId === user.id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    const targetUser = await profileService.getProfileById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingConnection = await friendService.getFriendConnection(user.id, userId);
    if (existingConnection) {
      return res.status(409).json({ error: 'Friend request already exists or users are already friends' });
    }

    const connection = await friendService.sendFriendRequest(user.id, userId);

    res.status(201).json({
      message: 'Friend request sent successfully',
      connection
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/accept-request/:connectionId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { connectionId } = req.params;

    const connection = await friendService.acceptFriendRequest(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    res.json({
      message: 'Friend request accepted',
      connection
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/reject-request/:connectionId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { connectionId } = req.params;

    await friendService.rejectFriendRequest(connectionId);

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/requests', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const requests = await friendService.getFriendRequests(user.id);

    res.json({ requests });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/list', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const friends = await friendService.getFriends(user.id);

    res.json({ friends });
  } catch (error) {
    console.error('Get friends list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/network', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const degree = 3; // Default to 3 degrees
    const network = await friendService.getFriendNetworkUpToDegree(user.id, degree);

    res.json({
      network,
      count: network.length,
      degree
    });
  } catch (error) {
    console.error('Get friend network error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/network/:degree', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const degree = parseInt(req.params.degree);
    if (isNaN(degree) || degree < 1 || degree > 6) {
      return res.status(400).json({ error: 'Degree must be between 1 and 6' });
    }

    const network = await friendService.getFriendNetworkUpToDegree(user.id, degree);

    res.json({
      network,
      count: network.length,
      degree
    });
  } catch (error) {
    console.error('Get friend network error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/remove/:friendId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { friendId } = req.params;

    await friendService.removeFriend(user.id, friendId);

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/block/:userId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { userId } = req.params;

    if (userId === user.id) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const connection = await friendService.blockUser(user.id, userId);

    res.json({
      message: 'User blocked successfully',
      connection
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;