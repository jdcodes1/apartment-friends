import express, { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { ProfileService } from "../services/profileService";
import { PhoneAuthService } from "../services/phoneAuthService";
import { GeocodingService } from "../services/geocodingService";
import { validateEmail, validatePassword } from "../utils/auth";
import { authenticateToken, authenticateTokenOnly, AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();
const authService = new AuthService();
const profileService = new ProfileService();
const phoneAuthService = new PhoneAuthService();
const geocodingService = new GeocodingService();

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

router.post(
  "/register",
  async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res
          .status(400)
          .json({ error: "All required fields must be provided" });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      if (!validatePassword(password)) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
      }

      // Check if user already exists by phone
      if (phone) {
        const { data: existingProfile } =
          await profileService.getProfileByPhone(phone);
        if (existingProfile) {
          return res
            .status(409)
            .json({ error: "User with this phone already exists" });
        }
      }

      const { user, profile } = await authService.signUp(
        email.toLowerCase(),
        password,
        firstName.trim(),
        lastName.trim()
      );

      // Update profile with phone if provided
      if (phone && profile) {
        await profileService.updateProfile(profile.id, { phone_number: phone.trim() });
      }

      console.log(
        "Registration success - User object keys:",
        Object.keys(user)
      );
      console.log("Access token exists:", !!user.access_token);

      res.status(201).json({
        message: "User created successfully",
        user: profile,
        token: user.access_token,
        session: user,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
);

router.post(
  "/login",
  async (req: Request<{}, {}, LoginBody>, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const { user, profile } = await authService.signIn(
        email.toLowerCase(),
        password
      );

      if (!user) {
        return res.status(401).json({ error: "Authentication failed" });
      }

      if (!profile) {
        console.error("Profile not found for user:", user.id);
        return res.status(401).json({ error: "Profile not found" });
      }

      console.log(
        "Login success - User object keys:",
        user ? Object.keys(user) : "null"
      );
      console.log("User object:", user);
      console.log("Access token exists:", !!(user && user.access_token));

      res.json({
        message: "Login successful",
        user: profile,
        token: user?.access_token || null,
        session: user,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(401).json({ error: error.message || "Invalid credentials" });
    }
  }
);

router.post("/logout", async (req: Request, res: Response) => {
  try {
    await authService.signOut();
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get(
  "/me",
  authenticateTokenOnly,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { user, profile } = req;
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // If no profile exists yet, return minimal user info
      if (!profile) {
        return res.json({
          user: {
            id: user.id,
            phoneNumber: user.phone,
            profileComplete: false,
          },
        });
      }

      // Transform snake_case to camelCase for frontend
      res.json({
        user: {
          id: profile.id,
          phoneNumber: profile.phone_number,
          firstName: profile.first_name,
          lastName: profile.last_name,
          profilePicture: profile.profile_picture,
          profileComplete: profile.profile_complete,
          currentAddress: profile.current_address,
          currentCity: profile.current_city,
          currentState: profile.current_state,
          currentZip: profile.current_zip,
          currentLatitude: profile.current_latitude,
          currentLongitude: profile.current_longitude,
          contactsUploaded: profile.contacts_uploaded,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    await authService.resetPassword(email);
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/update-password",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword || !validatePassword(newPassword)) {
        return res.status(400).json({ error: "Valid password is required" });
      }

      await authService.updatePassword(newPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

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
router.post(
  "/send-code",
  async (req: Request<{}, {}, SendCodeBody>, res: Response) => {
    console.log("[send-code] Request received:", req.body);
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      console.log("[send-code] Calling sendVerificationCode...");
      const result = await phoneAuthService.sendVerificationCode(phoneNumber);
      console.log("[send-code] Result:", result);

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      res.json({ message: result.message });
    } catch (error: any) {
      console.error("Send code error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * Verify code - verifies OTP and authenticates phone, creates profile for new users
 * POST /api/auth/verify-code
 */
router.post(
  "/verify-code",
  async (req: Request<{}, {}, VerifyCodeBody>, res: Response) => {
    try {
      const { phoneNumber, code } = req.body;

      if (!phoneNumber || !code) {
        return res
          .status(400)
          .json({ error: "Phone number and code are required" });
      }

      const result = await phoneAuthService.verifyCode(phoneNumber, code);

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      res.json({
        message: result.message,
        token: result.token,
        user: result.user,
      });
    } catch (error: any) {
      console.error("Verify code error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * Complete registration - creates/updates profile with full user details
 * POST /api/auth/complete-registration
 * Should only be called AFTER phone has been verified via verify-code
 */
interface CompleteRegistrationBody {
  phoneNumber: string;
  firstName: string;
  lastName: string;
}

router.post(
  "/complete-registration",
  async (req: Request<{}, {}, CompleteRegistrationBody>, res: Response) => {
    try {
      const { phoneNumber, firstName, lastName } = req.body;

      if (!phoneNumber || !firstName || !lastName) {
        return res.status(400).json({
          error: "Phone number, first name, and last name are required",
        });
      }

      const result = await phoneAuthService.completeRegistration(
        phoneNumber,
        firstName,
        lastName
      );

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      res.json({
        message: result.message,
        user: result.profile,
        token: result.session?.access_token,
        session: result.session,
      });
    } catch (error: any) {
      console.error("Complete registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * Check if phone number is already registered
 * POST /api/auth/check-phone
 */
router.post("/check-phone", async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const { data: profile } = await profileService.getProfileByPhone(
      phoneNumber
    );

    res.json({
      exists: !!profile,
      requiresRegistration: !profile,
    });
  } catch (error) {
    console.error("Check phone error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Complete user profile after phone verification
 * PUT /api/auth/complete-profile
 */
interface CompleteProfileBody {
  firstName: string;
  lastName: string;
  currentAddress: string;
  currentCity: string;
  currentState: string;
  currentZip: string;
  profilePicture?: string;
}

router.put(
  "/complete-profile",
  authenticateTokenOnly,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { user, profile } = req;

      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const {
        firstName,
        lastName,
        currentAddress,
        currentCity,
        currentState,
        currentZip,
        profilePicture,
      } = req.body as CompleteProfileBody;

      // Validate required fields
      if (
        !firstName ||
        !lastName ||
        !currentAddress ||
        !currentCity ||
        !currentState ||
        !currentZip
      ) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Validate state format (2 letters)
      if (currentState.length !== 2) {
        return res.status(400).json({ error: "State must be 2 letters" });
      }

      // Validate ZIP code format (5 digits)
      if (!/^\d{5}$/.test(currentZip)) {
        return res.status(400).json({ error: "ZIP code must be 5 digits" });
      }

      // Geocode the address to get coordinates
      const geocodeResult = await geocodingService.geocodeAddress(
        currentAddress,
        currentCity,
        currentState,
        currentZip
      );

      let updatedProfile;

      if (profile) {
        // Update existing profile
        updatedProfile = await profileService.updateProfile(profile.id, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          current_address: currentAddress.trim(),
          current_city: currentCity.trim(),
          current_state: currentState.toUpperCase().trim(),
          current_zip: currentZip.trim(),
          current_latitude: geocodeResult?.latitude || null,
          current_longitude: geocodeResult?.longitude || null,
          profile_picture: profilePicture || null,
          profile_complete: true,
        });
      } else {
        // Create new profile
        updatedProfile = await profileService.createProfile({
          id: user.id,
          phone_number: user.phone || "",
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          current_address: currentAddress.trim(),
          current_city: currentCity.trim(),
          current_state: currentState.toUpperCase().trim(),
          current_zip: currentZip.trim(),
          current_latitude: geocodeResult?.latitude || null,
          current_longitude: geocodeResult?.longitude || null,
          profile_picture: profilePicture || null,
          profile_complete: true,
        });
      }

      if (!updatedProfile) {
        return res.status(500).json({ error: "Failed to update profile" });
      }

      // Transform snake_case to camelCase for frontend
      res.json({
        message: "Profile completed successfully",
        user: {
          id: updatedProfile.id,
          phoneNumber: updatedProfile.phone_number,
          firstName: updatedProfile.first_name,
          lastName: updatedProfile.last_name,
          profilePicture: updatedProfile.profile_picture,
          profileComplete: updatedProfile.profile_complete,
          currentAddress: updatedProfile.current_address,
          currentCity: updatedProfile.current_city,
          currentState: updatedProfile.current_state,
          currentZip: updatedProfile.current_zip,
          currentLatitude: updatedProfile.current_latitude,
          currentLongitude: updatedProfile.current_longitude,
          contactsUploaded: updatedProfile.contacts_uploaded,
          createdAt: updatedProfile.created_at,
          updatedAt: updatedProfile.updated_at,
        },
      });
    } catch (error: any) {
      console.error("Complete profile error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
);

export default router;
