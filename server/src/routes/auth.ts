import express, { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ProfileService } from '../services/profileService';
import { PhoneAuthService } from '../services/phoneAuthService';
import { validateEmail, validatePassword } from '../utils/auth';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const authService = new AuthService();
const profileService = new ProfileService();
const phoneAuthService = new PhoneAuthService();

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

    console.log('Registration success - User object keys:', Object.keys(user));
    console.log('Access token exists:', !!user.access_token);

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

    console.log('Login success - User object keys:', user ? Object.keys(user) : 'null');
    console.log('User object:', user);
    console.log('Access token exists:', !!(user && user.access_token));

    res.json({
      message: 'Login successful',
      user: profile,
      token: user?.access_token || null,
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

// ========================================
// PHONE AUTHENTICATION ENDPOINTS
// ========================================

interface SendCodeBody {
  phoneNumber: string;
}

interface VerifyCodeBody {
  phoneNumber: string;
  code: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Send verification code to phone number
 * POST /api/auth/send-code
 */
router.post('/send-code', async (req: Request<{}, {}, SendCodeBody>, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const result = await phoneAuthService.sendVerificationCode(phoneNumber);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json({ message: result.message });
  } catch (error: any) {
    console.error('Send code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Verify code and login/register
 * POST /api/auth/verify-code
 */
router.post('/verify-code', async (req: Request<{}, {}, VerifyCodeBody>, res: Response) => {
  try {
    const { phoneNumber, code, firstName, lastName } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and code are required' });
    }

    const result = await phoneAuthService.verifyCode(phoneNumber, code, firstName, lastName);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json({
      message: result.message,
      user: result.profile,
      token: result.session?.access_token || result.session?.user_id,
      session: result.session,
      isNewUser: result.isNewUser
    });
  } catch (error: any) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Check if phone number is already registered
 * POST /api/auth/check-phone
 */
router.post('/check-phone', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const { data: profile } = await profileService.getProfileByPhone(phoneNumber);

    res.json({
      exists: !!profile,
      requiresRegistration: !profile
    });
  } catch (error) {
    console.error('Check phone error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;