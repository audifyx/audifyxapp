import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'share' | 'message';
  fromUserId: string;
  toUserId: string;
  trackId?: string;
  messageId?: string;
  text?: string;
  timestamp: Date;
  isRead: boolean;
}

interface NotificationsState {
  notifications: Notification[];
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  clearNotifications: (userId: string) => void;
  
  // Getters
  getUserNotifications: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      
      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          isRead: false
        };
        
        set(state => ({
          notifications: [notification, ...state.notifications]
        }));
      },
      
      markAsRead: (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(notif =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        }));
      },
      
      markAllAsRead: (userId) => {
        set(state => ({
          notifications: state.notifications.map(notif =>
            notif.toUserId === userId ? { ...notif, isRead: true } : notif
          )
        }));
      },
      
      clearNotifications: (userId) => {
        set(state => ({
          notifications: state.notifications.filter(notif => notif.toUserId !== userId)
        }));
      },
      
      getUserNotifications: (userId) => {
        const { notifications } = get();
        return notifications
          .filter(notif => notif.toUserId === userId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },
      
      getUnreadCount: (userId) => {
        const { notifications } = get();
        return notifications.filter(notif => 
          notif.toUserId === userId && !notif.isRead
        ).length;
      }
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);