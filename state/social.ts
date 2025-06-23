import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationsStore } from './notifications';

export interface Like {
  id: string;
  userId: string;
  trackId: string;
  timestamp: Date;
}

export interface Comment {
  id: string;
  userId: string;
  trackId: string;
  text: string;
  timestamp: Date;
  replyTo?: string; // For nested comments
}

export interface Share {
  id: string;
  userId: string;
  trackId: string;
  timestamp: Date;
  platform?: 'internal' | 'external';
}

interface SocialState {
  likes: Like[];
  comments: Comment[];
  shares: Share[];
  
  // Actions
  toggleLike: (userId: string, trackId: string) => void;
  addComment: (userId: string, trackId: string, text: string, replyTo?: string) => void;
  shareTrack: (userId: string, trackId: string, platform?: 'internal' | 'external') => void;
  
  // Getters
  isLiked: (userId: string, trackId: string) => boolean;
  getLikesCount: (trackId: string) => number;
  getCommentsCount: (trackId: string) => number;
  getSharesCount: (trackId: string) => number;
  getTrackComments: (trackId: string) => Comment[];
  getUserLikes: (userId: string) => Like[];
  deleteTrackData: (trackId: string) => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      likes: [],
      comments: [],
      shares: [],
      
      toggleLike: (userId: string, trackId: string) => {
        const { likes } = get();
        const existingLike = likes.find(like => 
          like.userId === userId && like.trackId === trackId
        );
        
        if (existingLike) {
          // Remove like
          set({
            likes: likes.filter(like => like.id !== existingLike.id)
          });
        } else {
          // Add like and create notification
          const newLike: Like = {
            id: `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            trackId,
            timestamp: new Date()
          };
          set({
            likes: [...likes, newLike]
          });
          
          // Create notification for track owner (get from track data in a real app)
          // For now, we'll skip automatic notifications to avoid circular dependencies
        }
      },
      
      addComment: (userId: string, trackId: string, text: string, replyTo?: string) => {
        const newComment: Comment = {
          id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          trackId,
          text: text.trim(),
          timestamp: new Date(),
          replyTo
        };
        
        set(state => ({
          comments: [...state.comments, newComment]
        }));
      },
      
      shareTrack: (userId: string, trackId: string, platform = 'internal') => {
        const newShare: Share = {
          id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          trackId,
          timestamp: new Date(),
          platform
        };
        
        set(state => ({
          shares: [...state.shares, newShare]
        }));
      },
      
      isLiked: (userId: string, trackId: string) => {
        const { likes } = get();
        return likes.some(like => like.userId === userId && like.trackId === trackId);
      },
      
      getLikesCount: (trackId: string) => {
        const { likes } = get();
        return likes.filter(like => like.trackId === trackId).length;
      },
      
      getCommentsCount: (trackId: string) => {
        const { comments } = get();
        return comments.filter(comment => comment.trackId === trackId).length;
      },
      
      getSharesCount: (trackId: string) => {
        const { shares } = get();
        return shares.filter(share => share.trackId === trackId).length;
      },
      
      getTrackComments: (trackId: string) => {
        const { comments } = get();
        return comments
          .filter(comment => comment.trackId === trackId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },
      
      getUserLikes: (userId: string) => {
        const { likes } = get();
        return likes.filter(like => like.userId === userId);
      },
      
      deleteTrackData: (trackId: string) => {
        set(state => ({
          likes: state.likes.filter(like => like.trackId !== trackId),
          comments: state.comments.filter(comment => comment.trackId !== trackId),
          shares: state.shares.filter(share => share.trackId !== trackId)
        }));
      }
    }),
    {
      name: 'social-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);