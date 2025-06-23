import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoiceChannel {
  id: string;
  name: string;
  description: string;
  category: 'music' | 'general' | 'gaming' | 'study' | 'party' | 'private';
  maxUsers: number;
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  userCount: number;
}

export interface VoiceUser {
  id: string;
  username: string;
  profileImage: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  volume: number;
  joinedAt: string;
  status: 'connected' | 'connecting' | 'disconnected';
}

export interface VoiceSession {
  channelId: string;
  users: VoiceUser[];
  startedAt: string;
  duration: number;
  isRecording: boolean;
  quality: 'low' | 'medium' | 'high';
}

interface VoiceState {
  // Channels
  channels: VoiceChannel[];
  activeChannels: VoiceChannel[];
  
  // Current session
  currentChannel: VoiceChannel | null;
  currentSession: VoiceSession | null;
  connectedUsers: VoiceUser[];
  
  // User state
  isMuted: boolean;
  isDeafened: boolean;
  isPushToTalk: boolean;
  volume: number;
  isConnected: boolean;
  isConnecting: boolean;
  
  // Voice settings
  inputDevice: string;
  outputDevice: string;
  noiseReduction: boolean;
  echoCancellation: boolean;
  voiceActivation: boolean;
  voiceThreshold: number;
  
  // Permissions
  hasAudioPermission: boolean;
  
  // Actions
  createChannel: (name: string, category: VoiceChannel['category'], description?: string, isPrivate?: boolean) => void;
  joinChannel: (channelId: string, userId: string, username: string, profileImage: string) => void;
  leaveChannel: (userId: string) => void;
  deleteChannel: (channelId: string, userId: string) => void;
  
  // Voice controls
  toggleMute: () => void;
  toggleDeafen: () => void;
  togglePushToTalk: () => void;
  setVolume: (volume: number) => void;
  setUserSpeaking: (userId: string, isSpeaking: boolean) => void;
  setUserMuted: (userId: string, isMuted: boolean) => void;
  
  // Settings
  updateVoiceSettings: (settings: Partial<VoiceState>) => void;
  checkAudioPermission: () => Promise<boolean>;
  
  // Channel management
  updateChannelUserCount: (channelId: string, count: number) => void;
  getChannelsByCategory: (category: VoiceChannel['category']) => VoiceChannel[];
  getActiveChannels: () => VoiceChannel[];
}

// Demo channels
const createDemoChannels = (): VoiceChannel[] => [
  {
    id: 'channel-general',
    name: '🎵 General Music Chat',
    description: 'Talk about your favorite music and discover new artists',
    category: 'music',
    maxUsers: 20,
    isPrivate: false,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    isActive: true,
    userCount: 3
  },
  {
    id: 'channel-hiphop',
    name: '🎤 Hip-Hop Lounge',
    description: 'Hip-hop heads unite! Discuss beats, bars, and culture',
    category: 'music',
    maxUsers: 15,
    isPrivate: false,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    isActive: true,
    userCount: 7
  },
  {
    id: 'channel-study',
    name: '📚 Study Session',
    description: 'Quiet space for studying with ambient music',
    category: 'study',
    maxUsers: 10,
    isPrivate: false,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    isActive: true,
    userCount: 2
  },
  {
    id: 'channel-party',
    name: '🎉 Party Vibes',
    description: 'Turn up the music and have fun!',
    category: 'party',
    maxUsers: 25,
    isPrivate: false,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    isActive: true,
    userCount: 12
  },
  {
    id: 'channel-gaming',
    name: '🎮 Gaming Music',
    description: 'Epic soundtracks and gaming music discussion',
    category: 'gaming',
    maxUsers: 12,
    isPrivate: false,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    isActive: true,
    userCount: 5
  }
];

export const useVoiceChatStore = create<VoiceState>()(
  persist(
    (set, get) => ({
      // Initial state
      channels: createDemoChannels(),
      activeChannels: [],
      currentChannel: null,
      currentSession: null,
      connectedUsers: [],
      
      // User state
      isMuted: false,
      isDeafened: false,
      isPushToTalk: false,
      volume: 80,
      isConnected: false,
      isConnecting: false,
      
      // Voice settings
      inputDevice: 'default',
      outputDevice: 'default',
      noiseReduction: true,
      echoCancellation: true,
      voiceActivation: true,
      voiceThreshold: 50,
      
      // Permissions
      hasAudioPermission: false,
      
      // Actions
      createChannel: (name: string, category: VoiceChannel['category'], description = '', isPrivate = false) => {
        const newChannel: VoiceChannel = {
          id: `channel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          description,
          category,
          maxUsers: category === 'private' ? 8 : 20,
          isPrivate,
          createdBy: 'user', // Should be actual user ID
          createdAt: new Date().toISOString(),
          isActive: true,
          userCount: 0
        };
        
        set(state => ({
          channels: [...state.channels, newChannel]
        }));
      },
      
      joinChannel: (channelId: string, userId: string, username: string, profileImage: string) => {
        const channel = get().channels.find(c => c.id === channelId);
        if (!channel) return;
        
        const newUser: VoiceUser = {
          id: userId,
          username,
          profileImage,
          isSpeaking: false,
          isMuted: false,
          isDeafened: false,
          volume: 80,
          joinedAt: new Date().toISOString(),
          status: 'connecting'
        };
        
        const newSession: VoiceSession = {
          channelId,
          users: [newUser],
          startedAt: new Date().toISOString(),
          duration: 0,
          isRecording: false,
          quality: 'medium'
        };
        
        set(state => ({
          currentChannel: channel,
          currentSession: newSession,
          connectedUsers: [newUser],
          isConnecting: true,
          channels: state.channels.map(c => 
            c.id === channelId 
              ? { ...c, userCount: c.userCount + 1 }
              : c
          )
        }));
        
        // Simulate connection
        setTimeout(() => {
          set(state => ({
            isConnecting: false,
            isConnected: true,
            connectedUsers: state.connectedUsers.map(u => 
              u.id === userId ? { ...u, status: 'connected' as const } : u
            )
          }));
        }, 2000);
      },
      
      leaveChannel: (userId: string) => {
        const { currentChannel } = get();
        if (!currentChannel) return;
        
        set(state => ({
          currentChannel: null,
          currentSession: null,
          connectedUsers: [],
          isConnected: false,
          isConnecting: false,
          channels: state.channels.map(c => 
            c.id === currentChannel.id 
              ? { ...c, userCount: Math.max(0, c.userCount - 1) }
              : c
          )
        }));
      },
      
      deleteChannel: (channelId: string, userId: string) => {
        const channel = get().channels.find(c => c.id === channelId);
        if (!channel || channel.createdBy !== userId) return;
        
        set(state => ({
          channels: state.channels.filter(c => c.id !== channelId),
          currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
          currentSession: state.currentSession?.channelId === channelId ? null : state.currentSession,
          connectedUsers: state.currentSession?.channelId === channelId ? [] : state.connectedUsers,
          isConnected: state.currentChannel?.id === channelId ? false : state.isConnected
        }));
      },
      
      // Voice controls
      toggleMute: () => {
        set(state => ({ isMuted: !state.isMuted }));
      },
      
      toggleDeafen: () => {
        set(state => ({ 
          isDeafened: !state.isDeafened,
          isMuted: !state.isDeafened || state.isMuted // Auto-mute when deafening
        }));
      },
      
      togglePushToTalk: () => {
        set(state => ({ isPushToTalk: !state.isPushToTalk }));
      },
      
      setVolume: (volume: number) => {
        set({ volume: Math.max(0, Math.min(100, volume)) });
      },
      
      setUserSpeaking: (userId: string, isSpeaking: boolean) => {
        set(state => ({
          connectedUsers: state.connectedUsers.map(user => 
            user.id === userId ? { ...user, isSpeaking } : user
          )
        }));
      },
      
      setUserMuted: (userId: string, isMuted: boolean) => {
        set(state => ({
          connectedUsers: state.connectedUsers.map(user => 
            user.id === userId ? { ...user, isMuted } : user
          )
        }));
      },
      
      updateVoiceSettings: (settings: Partial<VoiceState>) => {
        set(state => ({ ...state, ...settings }));
      },
      
      checkAudioPermission: async () => {
        // This would use actual audio permissions in a real app
        set({ hasAudioPermission: true });
        return true;
      },
      
      updateChannelUserCount: (channelId: string, count: number) => {
        set(state => ({
          channels: state.channels.map(c => 
            c.id === channelId ? { ...c, userCount: count } : c
          )
        }));
      },
      
      getChannelsByCategory: (category: VoiceChannel['category']) => {
        return get().channels.filter(c => c.category === category);
      },
      
      getActiveChannels: () => {
        return get().channels.filter(c => c.isActive && c.userCount > 0);
      }
    }),
    {
      name: 'voice-chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist connection state
      partialize: (state) => ({
        channels: state.channels,
        isMuted: state.isMuted,
        isDeafened: state.isDeafened,
        isPushToTalk: state.isPushToTalk,
        volume: state.volume,
        inputDevice: state.inputDevice,
        outputDevice: state.outputDevice,
        noiseReduction: state.noiseReduction,
        echoCancellation: state.echoCancellation,
        voiceActivation: state.voiceActivation,
        voiceThreshold: state.voiceThreshold,
      })
    }
  )
);