import { supabaseClient } from '../config/supabase';
import { ProfileService } from './profileService';
import { Profile } from '../types/database';

export class AuthService {
  private profileService = new ProfileService();

  async signUp(email: string, password: string, firstName: string, lastName: string): Promise<{ user: any; profile: Profile | null }> {
    const { data, error } = await supabaseClient.auth.signUp({
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
      
      // If profile doesn't exist, create it manually (fallback if trigger fails)
      if (!profile) {
        console.log('Profile not found after registration, creating manually for user:', data.user.id);
        profile = await this.profileService.createProfile({
          id: data.user.id,
          email: email.toLowerCase(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    return { user: data.user, profile };
  }

  async signIn(email: string, password: string): Promise<{ user: any; profile: Profile | null }> {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    let profile = null;
    if (data.user) {
      profile = await this.profileService.getProfileById(data.user.id);
      
      // If profile doesn't exist, create it from user metadata
      if (!profile && data.user.user_metadata) {
        console.log('Profile not found for user, creating from metadata:', data.user.id);
        const { first_name, last_name } = data.user.user_metadata;
        profile = await this.profileService.createProfile({
          id: data.user.id,
          email: data.user.email!,
          first_name: first_name || 'User',
          last_name: last_name || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    return { user: data.user, profile };
  }

  async signOut(): Promise<void> {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<any> {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    return user;
  }

  async getCurrentUserProfile(): Promise<Profile | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;
    return await this.profileService.getProfileById(user.id);
  }

  async verifyToken(token: string): Promise<{ user: any; profile: Profile | null }> {
    const { data, error } = await supabaseClient.auth.getUser(token);
    if (error) throw error;

    let profile = null;
    if (data.user) {
      profile = await this.profileService.getProfileById(data.user.id);
    }

    return { user: data.user, profile };
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });
    if (error) throw error;
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  async updateUserMetadata(updates: { email?: string; data?: Record<string, any> }): Promise<any> {
    const { data, error } = await supabaseClient.auth.updateUser(updates);
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