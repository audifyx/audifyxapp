import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUsersStore } from './users';
import { supabaseDatabase } from '../api/supabaseDatabase';
import { supabaseAuth } from '../api/supabaseAuth';

export interface ProfileLink {
  id: string;
  title: string;
  url: string;
  type: 'website' | 'social' | 'music' | 'custom';
  icon?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  links?: ProfileLink[];
  followers: number;
  following: number;
  isVerified?: boolean;
  paypalLink?: string;
  cashAppLink?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (updates: Partial<User>) => void;
  addLink: (link: Omit<ProfileLink, 'id'>) => void;
  updateLink: (linkId: string, updates: Partial<ProfileLink>) => void;
  deleteLink: (linkId: string) => void;
  autoSyncAllData: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      signUp: async (username: string, email: string, password: string) => {
        try {
          console.log('🎨 Local Demo Signup:', { username, email });
          
          // Create local user account
          const newUser: User = {
            id: `user-${Date.now()}`,
            username,
            email,
            profileImage: `https://picsum.photos/300/300?random=${Math.random()}`,
            bio: `New user ${username} - welcome to Audifyx!`,
            location: 'Your City',
            website: '',
            links: [],
            followers: 0,
            following: 0,
            isVerified: false,
            paypalLink: '',
            cashAppLink: ''
          };
          
          // Add to users store
          useUsersStore.getState().addUser(newUser);
          
          // Set as authenticated user
          set({ user: newUser, isAuthenticated: true });
          
          console.log('✅ Local signup complete');
        } catch (error) {
          console.error('Local signup failed:', error);
          throw error;
        }
      },
      
      signIn: async (email: string, password: string) => {
        try {
          console.log('🎨 Local Demo Sign In:', email);
          
          // Find existing user in local store
          const existingUser = useUsersStore.getState().allUsers.find(u => 
            u.email.toLowerCase() === email.toLowerCase()
          );
          
          if (existingUser) {
            // Sign in existing user
            set({ user: existingUser, isAuthenticated: true });
            console.log('✅ Signed in as existing user:', existingUser.username);
          } else {
            // Create demo admin user for first login
            const adminUser: User = {
              id: 'admin-user',
              username: 'Admin',
              email: email,
              profileImage: 'https://picsum.photos/300/300?random=admin',
              bio: 'Administrator & Music Platform Creator 🎵 | Full access to all features',
              location: 'Global',
              website: 'audifyx.com',
              links: [],
              followers: 10000,
              following: 500,
              isVerified: true,
              paypalLink: '',
              cashAppLink: ''
            };
            
            useUsersStore.getState().addUser(adminUser);
            set({ user: adminUser, isAuthenticated: true });
            console.log('✅ Created admin user account');
          }
          
        } catch (error) {
          console.error('Local signin failed:', error);
          throw error;
        }
      },
      
      signOut: async () => {
        try {
          // Sign out from Supabase Auth
          await supabaseAuth.signOut();
          
          // Update local state
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('Sign out error:', error);
          // Still clear local state even if sign out fails
          set({ user: null, isAuthenticated: false });
        }
      },
      
      updateProfile: (updates: Partial<User>) => {
        set(state => {
          if (!state.user) {
            return state;
          }
          
          const updatedUser = { ...state.user, ...updates };
          
          // Also update the user in the global users store
          useUsersStore.getState().addUser(updatedUser);
          
          return { user: updatedUser };
        });
      },
      
      addLink: (linkData: Omit<ProfileLink, 'id'>) => {
        const newLink: ProfileLink = {
          ...linkData,
          id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        set(state => ({
          user: state.user ? {
            ...state.user,
            links: [...(state.user.links || []), newLink]
          } : null
        }));
      },
      
      updateLink: (linkId: string, updates: Partial<ProfileLink>) => {
        set(state => ({
          user: state.user ? {
            ...state.user,
            links: (state.user.links || []).map(link =>
              link.id === linkId ? { ...link, ...updates } : link
            )
          } : null
        }));
      },
      
      deleteLink: (linkId: string) => {
        set(state => ({
          user: state.user ? {
            ...state.user,
            links: (state.user.links || []).filter(link => link.id !== linkId)
          } : null
        }));
      },

      autoSyncAllData: async (userId: string) => {
        try {
          console.log('🎨 Local Demo - Data already synced');
          // In demo mode, all data is already loaded locally
          // No need for database sync
        } catch (error) {
          console.log('Demo mode - no sync needed');
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);