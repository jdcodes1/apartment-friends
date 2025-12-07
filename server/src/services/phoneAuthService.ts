import { supabase } from "../config/supabase";
import crypto from "crypto";

export class PhoneAuthService {
  /**
   * Send verification code to phone number using Supabase Auth + Twilio
   * Supabase will use Twilio to send the SMS code
   */
  async sendVerificationCode(
    phoneNumber: string
  ): Promise<{ success: boolean; message: string }> {
    console.log(
      "[PhoneAuthService] sendVerificationCode called with:",
      phoneNumber
    );
    try {
      // Supabase Auth phone auth with Twilio
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        console.error("[PhoneAuthService] Error sending OTP:", error);
        return {
          success: false,
          message: error.message || "Failed to send verification code",
        };
      }

      console.log("[PhoneAuthService] OTP sent successfully");
      return {
        success: true,
        message: `Verification code sent to ${phoneNumber}`,
      };
    } catch (error: any) {
      console.error("Send verification code error:", error);
      return {
        success: false,
        message: "An error occurred. Please try again.",
      };
    }
  }

  /**
   * Verify the OTP code - confirms the phone number and creates/logs in the user
   * For new users, creates a basic profile so they can be authenticated
   */
  async verifyCode(
    phoneNumber: string,
    code: string
  ): Promise<{
    success: boolean;
    message: string;
    token?: string;
    user?: any;
    profile?: any;
  }> {
    try {
      console.log("[PhoneAuthService] Verifying OTP for phone:", phoneNumber);

      // Verify OTP with Supabase Auth
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: code,
        type: "sms",
      });

      if (error) {
        console.error("[PhoneAuthService] OTP verification error:", error);
        return {
          success: false,
          message: error.message || "Invalid or expired code",
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          message: "Failed to authenticate",
        };
      }

      console.log("[PhoneAuthService] OTP verified, user ID:", data.user.id);

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      const isProfileComplete = existingProfile?.profile_complete ?? false;
      console.log("[PhoneAuthService] Profile exists:", !!existingProfile, "Profile complete:", isProfileComplete);

      return {
        success: true,
        message: isProfileComplete ? "Welcome back!" : "Phone verified! Please complete your profile.",
        token: data.session.access_token,
        user: {
          id: data.user.id,
          phoneNumber: phoneNumber,
          profileComplete: isProfileComplete,
          ...(existingProfile || {}),
        },
        profile: existingProfile,
      };
    } catch (error: any) {
      console.error("Verify code error:", error);
      return {
        success: false,
        message: "An error occurred during verification. Please try again.",
      };
    }
  }

  /**
   * Complete registration - creates/updates profile with user details
   * Called AFTER phone has been verified via verifyCode()
   * If new user, creates profile; if existing user, updates it
   */
  async completeRegistration(
    phoneNumber: string,
    firstName: string,
    lastName: string
  ): Promise<{
    success: boolean;
    message: string;
    session?: any;
    profile?: any;
  }> {
    try {
      console.log(
        "[PhoneAuthService] Starting registration for phone:",
        phoneNumber
      );

      // Get current authenticated user from Supabase Auth
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error("[PhoneAuthService] Auth user not found:", authError);
        return {
          success: false,
          message: "User not authenticated. Please verify phone first.",
        };
      }

      const userId = authUser.id;
      console.log("[PhoneAuthService] Authenticated user ID:", userId);

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (existingProfile) {
        // Update existing profile
        console.log("[PhoneAuthService] Updating existing profile");
        const { data: updatedProfile, error: updateError } = await supabase
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
          .select()
          .single();

        if (updateError) {
          console.error(
            "[PhoneAuthService] Profile update error:",
            updateError
          );
          return {
            success: false,
            message: `Failed to update profile: ${updateError.message}`,
          };
        }

        console.log("[PhoneAuthService] Profile updated successfully");

        // Get session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        return {
          success: true,
          message: "Profile updated successfully!",
          session: session,
          profile: updatedProfile,
        };
      } else {
        // Create new profile
        console.log("[PhoneAuthService] Creating new profile");
        console.log("[PhoneAuthService] Registration details:", {
          firstName,
          lastName,
          phone: phoneNumber,
          timestamp: new Date().toISOString(),
        });

        const { data: newProfile, error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            phone_number: phoneNumber,
            first_name: firstName,
            last_name: lastName,
            profile_complete: false,
          })
          .select()
          .single();

        if (profileError) {
          console.error("[PhoneAuthService] Profile creation error:", {
            message: profileError.message,
            code: (profileError as any).code,
            details: (profileError as any).details,
          });
          return {
            success: false,
            message: `Failed to create profile: ${profileError.message}`,
          };
        }

        console.log("[PhoneAuthService] Profile created successfully:", {
          id: newProfile.id,
          phone: newProfile.phone,
        });

        // Get session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        return {
          success: true,
          message: "Account created successfully!",
          session: session,
          profile: newProfile,
        };
      }
    } catch (error: any) {
      console.error("Complete registration error:", error);
      console.error("Complete registration error stack:", error.stack);
      return {
        success: false,
        message: "An error occurred during registration. Please try again.",
      };
    }
  }
}
