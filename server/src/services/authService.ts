import { supabase } from '../config/supabase';
import { ProfileService } from './profileService';
import { Profile } from '../types/database';

export class AuthService {
  private profileService = new ProfileService();

  async signUp(email: string, password: string, firstName: string, lastName: string): Promise<{ user: any; profile: Profile | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) throw error;

    // The profile should be automatically created by the database trigger
    let profile = null;
    if (data.user) {
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      profile = await this.profileService.getProfileById(data.user.id);
    }

    return { user: data.user, profile };
  }

  async signIn(email: string, password: string): Promise<{ user: any; profile: Profile | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    let profile = null;
    if (data.user) {
      profile = await this.profileService.getProfileById(data.user.id);
    }

    return { user: data.user, profile };
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<any> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  async getCurrentUserProfile(): Promise<Profile | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;
    return await this.profileService.getProfileById(user.id);
  }

  async verifyToken(token: string): Promise<{ user: any; profile: Profile | null }> {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;

    let profile = null;
    if (data.user) {
      profile = await this.profileService.getProfileById(data.user.id);
    }

    return { user: data.user, profile };
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });
    if (error) throw error;
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  async updateUserMetadata(updates: { email?: string; data?: Record<string, any> }): Promise<any> {
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw error;
    return data.user;
  }

  async deleteUser(): Promise<void> {
    // This requires admin privileges - typically handled by a separate admin service
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    // Delete the profile (which will cascade to delete related data)
    await this.profileService.deleteProfile(user.id);
    
    // Note: Deleting the auth user requires admin privileges
    // This should be handled by a separate admin API or webhook
  }
}