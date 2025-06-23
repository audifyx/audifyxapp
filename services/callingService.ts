import { supabase } from '../config/supabase';
import { supabaseDatabase } from '../api/supabaseDatabase';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export interface CallData {
  id: string;
  from_user_id: string;
  to_user_id: string;
  call_type: 'audio' | 'video';
  status: 'calling' | 'ringing' | 'connected' | 'ended' | 'missed' | 'declined';
  created_at: string;
  connected_at?: string;
  ended_at?: string;
  duration?: number;
}

export interface CallSignal {
  type: 'offer' | 'answer' | 'ice-candidate' | 'end-call' | 'mute' | 'unmute' | 'video-on' | 'video-off';
  data?: any;
  from_user_id: string;
  to_user_id: string;
}

class CallingService {
  private currentCall: CallData | null = null;
  private audioRecording: Audio.Recording | null = null;
  private audioPlayer: Audio.Sound | null = null;
  private callListeners: ((call: CallData) => void)[] = [];
  private signalListeners: ((signal: CallSignal) => void)[] = [];
  private isListening = false;
  private currentUserId: string | null = null;

  // Initialize the calling service
  async initialize(userId: string) {
    if (this.isListening) return;
    
    this.currentUserId = userId;
    
    try {
      // Set up audio mode for calls
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Listen for incoming calls
      this.setupCallListener(userId);
      
      // Listen for call signals
      this.setupSignalListener(userId);
      
      this.isListening = true;
      console.log('📞 Calling service initialized for user:', userId);
    } catch (error) {
      console.error('❌ Failed to initialize calling service:', error);
    }
  }

  // Set up listener for incoming calls
  private setupCallListener(userId: string) {
    const channel = supabase
      .channel(`calls:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          const call = payload.new as CallData;
          if (call.status === 'calling') {
            this.handleIncomingCall(call);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          const call = payload.new as CallData;
          this.notifyCallListeners(call);
        }
      )
      .subscribe();
  }

  // Set up listener for call signals (mute, video toggle, etc.)
  private setupSignalListener(userId: string) {
    const channel = supabase
      .channel(`signals:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          const signal = payload.new as CallSignal;
          this.handleSignal(signal);
        }
      )
      .subscribe();
  }

  // Start an outgoing call
  async initiateCall(toUserId: string, callType: 'audio' | 'video'): Promise<CallData> {
    try {
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const callData: Omit<CallData, 'created_at'> = {
        id: callId,
        from_user_id: this.currentUserId!,
        to_user_id: toUserId,
        call_type: callType,
        status: 'calling'
      };

      // Create call record in database
      const data = await supabaseDatabase.createCall(callData);
      if (!data) throw new Error('Failed to create call record');

      this.currentCall = data;
      
      // Start audio recording simulation
      if (callType === 'audio' || callType === 'video') {
        await this.startAudioRecording();
      }

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      console.log('📞 Call initiated:', callId);
      return data;
    } catch (error) {
      console.error('❌ Failed to initiate call:', error);
      throw error;
    }
  }

  // Answer an incoming call
  async answerCall(callId: string): Promise<void> {
    try {
      const result = await supabaseDatabase.updateCall(callId, {
        status: 'connected',
        connected_at: new Date().toISOString()
      });

      if (!result) throw new Error('Failed to answer call');

      // Start audio recording
      await this.startAudioRecording();
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      console.log('✅ Call answered:', callId);
    } catch (error) {
      console.error('❌ Failed to answer call:', error);
      throw error;
    }
  }

  // Decline/End a call
  async endCall(callId: string, reason: 'ended' | 'declined' | 'missed' = 'ended'): Promise<void> {
    try {
      const endTime = new Date().toISOString();
      let duration = 0;

      if (this.currentCall?.connected_at) {
        const connectedTime = new Date(this.currentCall.connected_at).getTime();
        const endTimeMs = new Date(endTime).getTime();
        duration = Math.floor((endTimeMs - connectedTime) / 1000);
      }

      const result = await supabaseDatabase.updateCall(callId, {
        status: reason,
        ended_at: endTime,
        duration: duration > 0 ? duration : undefined
      });

      if (!result) throw new Error('Failed to end call');

      // Stop audio recording
      await this.stopAudioRecording();
      
      // Reset current call
      this.currentCall = null;

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      console.log('📵 Call ended:', callId);
    } catch (error) {
      console.error('❌ Failed to end call:', error);
      throw error;
    }
  }

  // Send call signal (mute, video toggle, etc.)
  async sendSignal(signal: Omit<CallSignal, 'from_user_id'>): Promise<void> {
    try {
      const signalData = {
        ...signal,
        from_user_id: this.currentUserId!
      };

      const result = await supabaseDatabase.createCallSignal(signalData);
      if (!result) throw new Error('Failed to send signal');

      console.log('📡 Signal sent:', signal.type);
    } catch (error) {
      console.error('❌ Failed to send signal:', error);
      throw error;
    }
  }

  // Handle incoming call
  private handleIncomingCall(call: CallData) {
    this.currentCall = call;
    
    // Play ringtone (using system sound)
    this.playRingtone();
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Notify listeners
    this.notifyCallListeners(call);
    
    console.log('📞 Incoming call from:', call.from_user_id);
  }

  // Handle call signals
  private handleSignal(signal: CallSignal) {
    this.notifySignalListeners(signal);
    console.log('📡 Signal received:', signal.type);
  }

  // Start audio recording (simulated)
  private async startAudioRecording() {
    try {
      // Check permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ Audio recording permission denied');
        return;
      }

      // Create recording
      this.audioRecording = new Audio.Recording();
      await this.audioRecording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: 2, // MPEG_4
          audioEncoder: 3, // AAC
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: 'mp4',
          audioQuality: 1, // Medium quality
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await this.audioRecording.startAsync();
      console.log('🎤 Audio recording started');
    } catch (error) {
      console.error('❌ Failed to start audio recording:', error);
    }
  }

  // Stop audio recording
  private async stopAudioRecording() {
    try {
      if (this.audioRecording) {
        await this.audioRecording.stopAndUnloadAsync();
        this.audioRecording = null;
        console.log('🎤 Audio recording stopped');
      }

      if (this.audioPlayer) {
        await this.audioPlayer.unloadAsync();
        this.audioPlayer = null;
      }
    } catch (error) {
      console.error('❌ Failed to stop audio recording:', error);
    }
  }

  // Play ringtone
  private async playRingtone() {
    try {
      // Create a simple beeping sound as ringtone
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
        { shouldPlay: true, isLooping: true, volume: 0.8 }
      );
      
      this.audioPlayer = sound;
      
      // Stop ringtone after 30 seconds
      setTimeout(async () => {
        if (this.audioPlayer) {
          await this.audioPlayer.stopAsync();
          await this.audioPlayer.unloadAsync();
          this.audioPlayer = null;
        }
      }, 30000);
    } catch (error) {
      console.log('📱 Using system ringtone (audio file not accessible)');
      // Fallback to haptic feedback
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, i * 1000);
      }
    }
  }

  // Get call history
  async getCallHistory(userId: string): Promise<CallData[]> {
    try {
      return await supabaseDatabase.getCallHistory(userId);
    } catch (error) {
      console.error('❌ Failed to get call history:', error);
      return [];
    }
  }

  // Event listeners
  onCall(callback: (call: CallData) => void) {
    this.callListeners.push(callback);
    return () => {
      this.callListeners = this.callListeners.filter(cb => cb !== callback);
    };
  }

  onSignal(callback: (signal: CallSignal) => void) {
    this.signalListeners.push(callback);
    return () => {
      this.signalListeners = this.signalListeners.filter(cb => cb !== callback);
    };
  }

  private notifyCallListeners(call: CallData) {
    this.callListeners.forEach(callback => callback(call));
  }

  private notifySignalListeners(signal: CallSignal) {
    this.signalListeners.forEach(callback => callback(signal));
  }

  // Cleanup
  cleanup() {
    this.stopAudioRecording();
    this.callListeners = [];
    this.signalListeners = [];
    this.isListening = false;
    console.log('📞 Calling service cleaned up');
  }

  // Get current call
  getCurrentCall(): CallData | null {
    return this.currentCall;
  }
}

export const callingService = new CallingService();