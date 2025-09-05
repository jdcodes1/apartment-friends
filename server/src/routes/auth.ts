import express, { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ProfileService } from '../services/profileService';
import { validateEmail, validatePassword } from '../utils/auth';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const authService = new AuthService();
const profileService = new ProfileService();

interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

router.post('/register', async (req: Request<{}, {}, RegisterBody>, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingProfile = await profileService.getProfileByEmail(email.toLowerCase());
    if (existingProfile) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const { user, profile } = await authService.signUp(
      email.toLowerCase(),
      password,
      firstName.trim(),
      lastName.trim()
    );

    // Update profile with phone if provided
    if (phone && profile) {
      await profileService.updateProfile(profile.id, { phone: phone.trim() });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: profile,
      token: user.access_token,
      session: user
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.post('/login', async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { user, profile } = await authService.signIn(email.toLowerCase(), password);

    if (!user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    if (!profile) {
      console.error('Profile not found for user:', user.id);
      return res.status(401).json({ error: 'Profile not found' });
    }

    res.json({
      message: 'Login successful',
      user: profile,
      token: user.access_token,
      session: user
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    await authService.signOut();
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user, profile } = req;
    if (!user || !profile) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: profile
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await authService.resetPassword(email);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/update-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || !validatePassword(newPassword)) {
      return res.status(400).json({ error: 'Valid password is required' });
    }

    await authService.updatePassword(newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;