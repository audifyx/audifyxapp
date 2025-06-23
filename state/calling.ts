import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { callingService, CallData } from '../services/callingService';

export interface CallHistoryItem {
  id: string;
  userId: string;
  username: string;
  profileImage?: string;
  callType: 'audio' | 'video';
  status: 'missed' | 'answered' | 'declined';
  duration?: string;
  timestamp: Date;
}

interface CallingState {
  currentCall: CallData | null;
  incomingCall: CallData | null;
  callHistory: CallHistoryItem[];
  isCallActive: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  
  // Actions
  setCurrentCall: (call: CallData | null) => void;
  setIncomingCall: (call: CallData | null) => void;
  setCallActive: (active: boolean) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  addToCallHistory: (call: CallHistoryItem) => void;
  clearCallHistory: () => void;
  initializeCallService: (userId: string) => Promise<void>;
  startCall: (toUserId: string, callType: 'audio' | 'video') => Promise<CallData>;
  answerCall: (callId: string) => Promise<void>;
  endCall: (callId: string, reason?: 'ended' | 'declined' | 'missed') => Promise<void>;
}

export const useCallingStore = create<CallingState>()(
  persist(
    (set, get) => ({
      currentCall: null,
      incomingCall: null,
      callHistory: [],
      isCallActive: false,
      isMuted: false,
      isVideoOff: false,
      isSpeakerOn: false,
      
      setCurrentCall: (call) => {
        set({ currentCall: call });
      },
      
      setIncomingCall: (call) => {
        set({ incomingCall: call });
      },
      
      setCallActive: (active) => {
        set({ isCallActive: active });
      },
      
      toggleMute: async () => {
        const { isMuted, currentCall } = get();
        const newMuted = !isMuted;
        set({ isMuted: newMuted });
        
        // Send signal to other party
        if (currentCall) {
          try {
            await callingService.sendSignal({
              type: newMuted ? 'mute' : 'unmute',
              to_user_id: currentCall.from_user_id === callingService.getCurrentCall()?.from_user_id 
                ? currentCall.to_user_id 
                : currentCall.from_user_id
            });
          } catch (error) {
            console.error('Failed to send mute signal:', error);
          }
        }
      },
      
      toggleVideo: async () => {
        const { isVideoOff, currentCall } = get();
        const newVideoOff = !isVideoOff;
        set({ isVideoOff: newVideoOff });
        
        // Send signal to other party
        if (currentCall) {
          try {
            await callingService.sendSignal({
              type: newVideoOff ? 'video-off' : 'video-on',
              to_user_id: currentCall.from_user_id === callingService.getCurrentCall()?.from_user_id 
                ? currentCall.to_user_id 
                : currentCall.from_user_id
            });
          } catch (error) {
            console.error('Failed to send video signal:', error);
          }
        }
      },
      
      toggleSpeaker: () => {
        set(state => ({ isSpeakerOn: !state.isSpeakerOn }));
      },
      
      addToCallHistory: (call) => {
        set(state => ({
          callHistory: [call, ...state.callHistory.slice(0, 49)] // Keep last 50 calls
        }));
      },
      
      clearCallHistory: () => {
        set({ callHistory: [] });
      },
      
      initializeCallService: async (userId: string) => {
        try {
          await callingService.initialize(userId);
          
          // Set up call listeners
          callingService.onCall((call) => {
            if (call.status === 'calling') {
              set({ incomingCall: call });
            } else if (call.status === 'connected') {
              set({ 
                currentCall: call, 
                incomingCall: null, 
                isCallActive: true,
                isMuted: false,
                isVideoOff: false,
                isSpeakerOn: false
              });
            } else if (call.status === 'ended' || call.status === 'declined' || call.status === 'missed') {
              // Add to history
              const historyItem: CallHistoryItem = {
                id: call.id,
                userId: call.from_user_id === userId ? call.to_user_id : call.from_user_id,
                username: 'Unknown User', // This should be resolved from user data
                callType: call.call_type,
                status: call.status === 'ended' ? 'answered' : call.status,
                duration: call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : undefined,
                timestamp: new Date(call.created_at)
              };
              
              get().addToCallHistory(historyItem);
              
              // Clear current call state
              set({ 
                currentCall: null, 
                incomingCall: null, 
                isCallActive: false,
                isMuted: false,
                isVideoOff: false,
                isSpeakerOn: false
              });
            }
          });
          
          // Set up signal listeners
          callingService.onSignal((signal) => {
            switch (signal.type) {
              case 'mute':
                // Handle remote mute - could show indicator
                break;
              case 'unmute':
                // Handle remote unmute
                break;
              case 'video-off':
                // Handle remote video off
                break;
              case 'video-on':
                // Handle remote video on
                break;
            }
          });
          
          console.log('✅ Calling service initialized');
        } catch (error) {
          console.error('❌ Failed to initialize calling service:', error);
        }
      },
      
      startCall: async (toUserId: string, callType: 'audio' | 'video') => {
        try {
          const call = await callingService.initiateCall(toUserId, callType);
          set({ currentCall: call, isCallActive: false });
          return call;
        } catch (error) {
          console.error('❌ Failed to start call:', error);
          throw error;
        }
      },
      
      answerCall: async (callId: string) => {
        try {
          await callingService.answerCall(callId);
          const { incomingCall } = get();
          if (incomingCall) {
            set({ 
              currentCall: { ...incomingCall, status: 'connected' },
              incomingCall: null,
              isCallActive: true,
              isMuted: false,
              isVideoOff: false,
              isSpeakerOn: false
            });
          }
        } catch (error) {
          console.error('❌ Failed to answer call:', error);
          throw error;
        }
      },
      
      endCall: async (callId: string, reason = 'ended') => {
        try {
          await callingService.endCall(callId, reason);
          set({ 
            currentCall: null, 
            incomingCall: null, 
            isCallActive: false,
            isMuted: false,
            isVideoOff: false,
            isSpeakerOn: false
          });
        } catch (error) {
          console.error('❌ Failed to end call:', error);
          throw error;
        }
      }
    }),
    {
      name: 'calling-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        callHistory: state.callHistory 
      })
    }
  )
);