import { Request, Response, NextFunction } from 'express';
import { supabaseClient } from '../config/supabase';
import { ProfileService } from '../services/profileService';
import { Profile } from '../types/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    [key: string]: any;
  };
  profile?: Profile;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('Auth header:', authHeader);
    console.log('Parsed token:', token ? `${token.substring(0, 20)}...` : 'null');

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Get user directly from JWT token without setting session
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      console.error('Token validation error:', error);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Get the user profile
    const profileService = new ProfileService();
    const profile = await profileService.getProfileById(user.id);

    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    req.user = user;
    req.profile = profile;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);

      if (!error && user) {
        const profileService = new ProfileService();
        const profile = await profileService.getProfileById(user.id);

        req.user = user;
        req.profile = profile || undefined;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Don't fail the request if optional auth fails
    next();
  }
};