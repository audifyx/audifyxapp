import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from './auth';

interface UsersState {
  allUsers: User[];
  followingRelationships: Record<string, string[]>; // currentUserId -> [followedUserIds]
  version: number; // Add version control like music store
  addUser: (user: User) => void;
  getUserById: (id: string) => User | undefined;
  followUser: (userId: string, currentUserId: string) => void;
  unfollowUser: (userId: string, currentUserId: string) => void;
  isFollowing: (userId: string, currentUserId: string) => boolean;
  clearAllUsers: () => void;
  syncFromDatabase: (users: User[]) => void;
}

const CURRENT_USER_VERSION = 3; // Increment to force clear old data and test fresh state

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      allUsers: [],
      followingRelationships: {},
      version: CURRENT_USER_VERSION,
      
      addUser: (user: User) => {
        const { allUsers } = get();
        console.log('UsersStore.addUser called with:', user.username, user.email);
        console.log('Current users before adding:', allUsers.length);
        
        const existingUser = allUsers.find(u => u.email === user.email);
        
        if (!existingUser) {
          // Ensure new users have required fields
          const userWithDefaults = {
            ...user,
            links: user.links || [],
            isVerified: user.isVerified || false
          };
          console.log('Adding new user to store:', userWithDefaults.username);
          set({ allUsers: [...allUsers, userWithDefaults] });
          
          // Verify it was added
          const newAllUsers = get().allUsers;
          console.log('Users after adding:', newAllUsers.length);
          console.log('All usernames:', newAllUsers.map(u => u.username));
        } else {
          // Update existing user info
          console.log('Updating existing user:', user.username);
          set({
            allUsers: allUsers.map(u => 
              u.email === user.email ? { ...u, ...user, links: user.links || u.links || [] } : u
            )
          });
        }
      },
      
      getUserById: (id: string) => {
        const { allUsers } = get();
        return allUsers.find(user => user.id === id);
      },
      
      followUser: (userId: string, currentUserId: string) => {
        const { allUsers, followingRelationships } = get();
        const currentFollowing = followingRelationships[currentUserId] || [];
        
        if (!currentFollowing.includes(userId)) {
          set({
            followingRelationships: {
              ...followingRelationships,
              [currentUserId]: [...currentFollowing, userId]
            },
            allUsers: allUsers.map(user => {
              if (user.id === userId) {
                return { ...user, followers: user.followers + 1 };
              }
              if (user.id === currentUserId) {
                return { ...user, following: user.following + 1 };
              }
              return user;
            })
          });
        }
      },
      
      unfollowUser: (userId: string, currentUserId: string) => {
        const { allUsers, followingRelationships } = get();
        const currentFollowing = followingRelationships[currentUserId] || [];
        
        if (currentFollowing.includes(userId)) {
          set({
            followingRelationships: {
              ...followingRelationships,
              [currentUserId]: currentFollowing.filter(id => id !== userId)
            },
            allUsers: allUsers.map(user => {
              if (user.id === userId) {
                return { ...user, followers: Math.max(0, user.followers - 1) };
              }
              if (user.id === currentUserId) {
                return { ...user, following: Math.max(0, user.following - 1) };
              }
              return user;
            })
          });
        }
      },
      
      isFollowing: (userId: string, currentUserId: string) => {
        const { followingRelationships } = get();
        const currentFollowing = followingRelationships[currentUserId] || [];
        return currentFollowing.includes(userId);
      },
      
      clearAllUsers: () => {
        set({ allUsers: [], followingRelationships: {}, version: CURRENT_USER_VERSION });
      },
      
      syncFromDatabase: (users: User[]) => {
        console.log('UsersStore.syncFromDatabase called with:', users.length, 'users');
        console.log('Database users:', users.map(u => ({ username: u.username, email: u.email, verified: u.isVerified })));
        
        // Replace all users with database users
        set({ allUsers: users });
        
        // Verify sync
        const { allUsers } = get();
        console.log('Users after database sync:', allUsers.length);
        console.log('Synced usernames:', allUsers.map(u => u.username));
      }
    }),
    {
      name: 'users-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: CURRENT_USER_VERSION,
      migrate: (persistedState: any, version: number) => {
        // If version doesn't match, return fresh state
        if (version !== CURRENT_USER_VERSION) {
          return {
            allUsers: [],
            followingRelationships: {},
            version: CURRENT_USER_VERSION
          };
        }
        return persistedState;
      }
    }
  )
);