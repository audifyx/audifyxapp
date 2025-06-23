import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { useCallingStore } from '../state/calling';
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function VideoCallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { otherUserId, callType } = route.params as { otherUserId: string, callType: 'audio' | 'video' };
  
  const { user } = useAuthStore();
  const { getUserById } = useUsersStore();
  const otherUser = getUserById(otherUserId);
  
  const { 
    currentCall, 
    incomingCall, 
    isCallActive, 
    isMuted, 
    isVideoOff, 
    isSpeakerOn,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    answerCall,
    endCall
  } = useCallingStore();
  
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [isIncomingCall, setIsIncomingCall] = useState(!!incomingCall);

  // Animation values
  const pulseScale = useSharedValue(1);
  const connectingOpacity = useSharedValue(1);

  // Handle call state changes
  useEffect(() => {
    if (currentCall) {
      if (currentCall.status === 'connected') {
        setCallStatus('connected');
        startCallTimer();
      } else if (currentCall.status === 'calling') {
        setCallStatus('calling');
      }
    }
    
    if (incomingCall) {
      setIsIncomingCall(true);
      setCallStatus('calling');
    }
  }, [currentCall, incomingCall]);
  
  // Start animations
  useEffect(() => {
    // Start pulse animation
    pulseScale.value = withRepeat(withSequence(
      withSpring(1.1, { duration: 1000 }),
      withSpring(1, { duration: 1000 })
    ), -1, false);

    // Connecting text animation
    connectingOpacity.value = withRepeat(withSequence(
      withSpring(0.3, { duration: 800 }),
      withSpring(1, { duration: 800 })
    ), -1, false);
  }, []);
  
  // Simulate call connection for demo purposes
  useEffect(() => {
    if (callStatus === 'calling' && !isIncomingCall) {
      const timer = setTimeout(() => {
        if (Math.random() > 0.2) { // 80% chance of answering
          setCallStatus('connected');
          startCallTimer();
        } else {
          Alert.alert('Call Failed', 'The user is not available right now.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [callStatus, isIncomingCall]);

  const startCallTimer = () => {
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Auto-end call after 30 seconds for demo
    setTimeout(() => {
      clearInterval(interval);
      endCall('ended');
    }, 30000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    const callToEnd = currentCall || incomingCall;
    if (callToEnd) {
      try {
        await endCall(callToEnd.id);
        setCallStatus('ended');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } catch (error) {
        console.error('Failed to end call:', error);
        navigation.goBack();
      }
    } else {
      navigation.goBack();
    }
  };

  // These are now handled by the calling store
  // const toggleMute, toggleVideo, toggleSpeaker are from useCallingStore

  const handleAnswerCall = async () => {
    if (incomingCall) {
      try {
        await answerCall(incomingCall.id);
        setIsIncomingCall(false);
        setCallStatus('connected');
        startCallTimer();
      } catch (error) {
        console.error('Failed to answer call:', error);
        Alert.alert('Error', 'Failed to answer call');
      }
    }
  };

  const handleDeclineCall = async () => {
    if (incomingCall) {
      try {
        await endCall(incomingCall.id, 'declined');
      } catch (error) {
        console.error('Failed to decline call:', error);
      }
    }
    navigation.goBack();
  };

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const connectingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: connectingOpacity.value,
  }));

  if (!otherUser) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">User not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Background - Video or Audio Call */}
        <View className="absolute inset-0">
          {callType === 'video' && callStatus === 'connected' && !isVideoOff ? (
            // Mock video feed background
            <View className="flex-1 bg-gradient-to-b from-purple-900 via-purple-800 to-black">
              <View className="absolute inset-0 bg-black/30" />
            </View>
          ) : (
            // Audio call or video off background
            <View className="flex-1 bg-gradient-to-b from-gray-900 via-gray-800 to-black" />
          )}
        </View>

        {/* Status Bar */}
        <View className="items-center pt-4 pb-2">
          {callStatus === 'calling' && (
            <Animated.Text 
              style={connectingAnimatedStyle}
              className="text-white text-sm"
            >
              {isIncomingCall ? 'Incoming call...' : 'Calling...'}
            </Animated.Text>
          )}
          {callStatus === 'connected' && (
            <Text className="text-white text-sm">
              {formatDuration(callDuration)}
            </Text>
          )}
          {callStatus === 'ended' && (
            <Text className="text-white text-sm">Call ended</Text>
          )}
        </View>

        {/* User Info Section */}
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View 
            style={callStatus === 'calling' ? pulseAnimatedStyle : {}}
            entering={FadeInUp}
            className="items-center"
          >
            {/* Profile Picture */}
            <View className="w-40 h-40 rounded-full mb-6 overflow-hidden">
              {otherUser.profileImage ? (
                <Image
                  source={{ uri: otherUser.profileImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-purple-600 items-center justify-center">
                  <Text className="text-white text-4xl font-bold">
                    {otherUser.username[0]?.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* User Name */}
            <Text className="text-white text-3xl font-bold mb-2">
              {otherUser.username}
            </Text>

            {/* Call Status */}
            <Text className="text-gray-300 text-lg">
              {callStatus === 'calling' && !isIncomingCall && 'Ringing...'}
              {callStatus === 'calling' && isIncomingCall && 'Incoming call'}
              {callStatus === 'connected' && (callType === 'video' ? 'Video call' : 'Voice call')}
              {callStatus === 'ended' && 'Call ended'}
            </Text>
          </Animated.View>

          {/* Small self video preview for video calls */}
          {callType === 'video' && callStatus === 'connected' && !isVideoOff && (
            <Animated.View 
              entering={FadeInDown}
              className="absolute top-20 right-6 w-24 h-32 bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20"
            >
              <View className="flex-1 bg-purple-600 items-center justify-center">
                <Text className="text-white text-sm font-bold">
                  {user?.username[0]?.toUpperCase()}
                </Text>
              </View>
            </Animated.View>
          )}
        </View>

        {/* Call Controls */}
        <View className="pb-12 px-8">
          {isIncomingCall ? (
            // Incoming call controls
            <Animated.View 
              entering={FadeInUp.delay(300)}
              className="flex-row items-center justify-center space-x-12"
            >
              {/* Decline */}
              <AnimatedPressable
                onPress={handleDeclineCall}
                className="w-16 h-16 bg-red-600 rounded-full items-center justify-center"
              >
                <Ionicons name="call" size={28} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
              </AnimatedPressable>

              {/* Answer */}
              <AnimatedPressable
                onPress={handleAnswerCall}
                className="w-16 h-16 bg-green-600 rounded-full items-center justify-center"
              >
                <Ionicons name="call" size={28} color="white" />
              </AnimatedPressable>
            </Animated.View>
          ) : callStatus === 'connected' ? (
            // Active call controls
            <Animated.View 
              entering={FadeInUp.delay(300)}
              className="space-y-6"
            >
              {/* Main Controls Row */}
              <View className="flex-row items-center justify-center space-x-6">
                {/* Mute */}
                <AnimatedPressable
                  onPress={toggleMute}
                  className={`w-14 h-14 rounded-full items-center justify-center ${
                    isMuted ? 'bg-red-600' : 'bg-gray-700'
                  }`}
                >
                  <Ionicons 
                    name={isMuted ? 'mic-off' : 'mic'} 
                    size={24} 
                    color="white" 
                  />
                </AnimatedPressable>

                {/* End Call */}
                <AnimatedPressable
                  onPress={handleEndCall}
                  className="w-16 h-16 bg-red-600 rounded-full items-center justify-center"
                >
                  <Ionicons name="call" size={28} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                </AnimatedPressable>

                {/* Speaker/Video Toggle */}
                <AnimatedPressable
                  onPress={callType === 'video' ? toggleVideo : toggleSpeaker}
                  className={`w-14 h-14 rounded-full items-center justify-center ${
                    (callType === 'video' && isVideoOff) || (callType === 'audio' && isSpeakerOn) 
                      ? 'bg-yellow-600' 
                      : 'bg-gray-700'
                  }`}
                >
                  <Ionicons 
                    name={callType === 'video' 
                      ? (isVideoOff ? 'videocam-off' : 'videocam')
                      : (isSpeakerOn ? 'volume-high' : 'volume-medium')
                    } 
                    size={24} 
                    color="white" 
                  />
                </AnimatedPressable>
              </View>

              {/* Secondary Controls Row */}
              {callType === 'video' && (
                <View className="flex-row items-center justify-center space-x-6">
                  {/* Speaker Toggle for Video Calls */}
                  <AnimatedPressable
                    onPress={toggleSpeaker}
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      isSpeakerOn ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    <Ionicons 
                      name={isSpeakerOn ? 'volume-high' : 'volume-medium'} 
                      size={20} 
                      color="white" 
                    />
                  </AnimatedPressable>

                  {/* Camera Flip */}
                  <AnimatedPressable
                    className="w-12 h-12 bg-gray-700 rounded-full items-center justify-center"
                  >
                    <Ionicons name="camera-reverse" size={20} color="white" />
                  </AnimatedPressable>
                </View>
              )}
            </Animated.View>
          ) : (
            // Calling controls
            <Animated.View 
              entering={FadeInUp.delay(300)}
              className="flex-row items-center justify-center"
            >
              <AnimatedPressable
                onPress={handleEndCall}
                className="w-16 h-16 bg-red-600 rounded-full items-center justify-center"
              >
                <Ionicons name="call" size={28} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
              </AnimatedPressable>
            </Animated.View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}