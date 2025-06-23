// Supabase Authentication Service for Audifyx
import { supabase } from '../config/supabase';
import { supabaseDatabase } from './supabaseDatabase';

export interface AuthUser {
  id: string;
  email: string;
  profileId?: string;
}

export class SupabaseAuthService {
  // Sign up with email and password
  async signUp(email: string, password: string, username: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      console.log('🔐 Creating Supabase Auth account for:', email);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError.message);
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: 'Failed to create user account' };
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Create profile linked to auth user
      const profile = await supabaseDatabase.createUser({
        id: authData.user.id, // Use auth user ID as profile ID
        username,
        email,
        full_name: username,
        bio: '',
        studio_name: username + ' Studio',
        experience: 'beginner',
        profile_photo_url: '',
        banner_photo_url: '',
        avatar_url: '',
        user_role: 'artist',
        is_online: true,
        last_seen: new Date().toISOString(),
        followers_count: 0,
        following_count: 0,
        banner_gradient: '',
        onboarding_completed: true,
        has_beta_access: false // Default to false, admin can grant access
      });

      if (!profile) {
        // If profile creation fails, clean up auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { user: null, error: 'Failed to create user profile' };
      }

      console.log('✅ Profile created and linked to auth user');

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          profileId: profile.id
        },
        error: null
      };

    } catch (error) {
      console.error('Signup error:', error);
      return { user: null, error: 'Failed to create account' };
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      console.log('🔐 Signing in with Supabase Auth:', email);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth signin error:', authError.message);
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: 'Sign in failed' };
      }

      console.log('✅ Successfully signed in:', authData.user.id);

      // Get the linked profile
      const profile = await supabaseDatabase.getUserById(authData.user.id);
      
      if (!profile) {
        // If no profile exists, this might be an existing auth user without a profile
        console.log('No profile found for auth user, creating one...');
        
        const newProfile = await supabaseDatabase.createUser({
          id: authData.user.id,
          username: authData.user.email!.split('@')[0],
          email: authData.user.email!,
          full_name: authData.user.email!.split('@')[0],
          bio: '',
          studio_name: authData.user.email!.split('@')[0] + ' Studio',
          experience: 'beginner',
          profile_photo_url: '',
          banner_photo_url: '',
          avatar_url: '',
          user_role: 'artist',
          is_online: true,
          last_seen: new Date().toISOString(),
          followers_count: 0,
          following_count: 0,
          banner_gradient: '',
          onboarding_completed: true,
          has_beta_access: false
        });

        if (!newProfile) {
          return { user: null, error: 'Failed to create user profile' };
        }
      }

      // Update online status
      await supabaseDatabase.updateUser(authData.user.id, {
        is_online: true,
        last_seen: new Date().toISOString()
      });

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          profileId: profile?.id || authData.user.id
        },
        error: null
      };

    } catch (error) {
      console.error('Signin error:', error);
      return { user: null, error: 'Sign in failed' };
    }
  }

  // Sign out
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error) {
      console.error('Signout error:', error);
      return { error: 'Sign out failed' };
    }
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email!,
        profileId: user.id
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is admin
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const profile = await supabaseDatabase.getUserById(userId);
      return profile?.user_role === 'admin' || profile?.email === 'audifyx@gmail.com';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Admin function to grant beta access
  async grantBetaAccess(userId: string): Promise<boolean> {
    try {
      const updated = await supabaseDatabase.updateUser(userId, {
        has_beta_access: true
      });
      return !!updated;
    } catch (error) {
      console.error('Error granting beta access:', error);
      return false;
    }
  }

  // Listen for auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          profileId: session.user.id
        };
        callback(authUser);
      } else {
        callback(null);
      }
    });
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthService();