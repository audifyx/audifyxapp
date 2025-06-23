import React, { useEffect } from 'react';
import { View, Text, Pressable, Image, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallingStore } from '../state/calling';
import { useUsersStore } from '../state/users';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withSequence,
  runOnJS 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function IncomingCallModal() {
  const navigation = useNavigation();
  const { getUserById } = useUsersStore();
  const { 
    incomingCall, 
    answerCall, 
    endCall 
  } = useCallingStore();

  // Animation values
  const pulseScale = useSharedValue(1);
  const slideY = useSharedValue(height);

  const caller = incomingCall ? getUserById(incomingCall.from_user_id) : null;

  // Animate modal appearance
  useEffect(() => {
    if (incomingCall) {
      // Slide up animation
      slideY.value = withSpring(0, { damping: 20, stiffness: 300 });
      
      // Pulse animation for avatar/buttons
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.05, { duration: 800 }),
          withSpring(1, { duration: 800 })
        ),
        -1,
        false
      );

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Auto-decline after 30 seconds
      const timeout = setTimeout(() => {
        handleDecline();
      }, 30000);

      return () => clearTimeout(timeout);
    } else {
      slideY.value = withSpring(height);
    }
  }, [incomingCall]);

  const handleAnswer = async () => {
    if (!incomingCall) return;
    
    try {
      await answerCall(incomingCall.id);
      
      // Navigate to call screen
      (navigation as any).navigate('VideoCall', {
        otherUserId: incomingCall.from_user_id,
        callType: incomingCall.call_type,
        isIncoming: true
      });
      
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to answer call:', error);
    }
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    
    try {
      await endCall(incomingCall.id, 'declined');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to decline call:', error);
    }
  };

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }]
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));

  if (!incomingCall || !caller) {
    return null;
  }

  return (
    <Modal
      visible={!!incomingCall}
      transparent
      statusBarTranslucent
      animationType="none"
    >
      <Animated.View 
        style={[{ flex: 1 }, animatedModalStyle]}
        className="bg-black"
      >
        <SafeAreaView className="flex-1">
          {/* Background Gradient */}
          <View className="absolute inset-0 bg-gradient-to-b from-purple-900/80 via-purple-800/60 to-black" />
          
          {/* Content */}
          <View className="flex-1 items-center justify-center px-8">
            {/* Incoming Call Label */}
            <Animated.Text 
              entering={FadeInUp.delay(200)}
              className="text-white/80 text-lg mb-4"
            >
              Incoming {incomingCall.call_type} call
            </Animated.Text>

            {/* Caller Avatar */}
            <Animated.View 
              style={pulseAnimatedStyle}
              entering={FadeInUp.delay(400)}
              className="mb-8"
            >
              <View className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/20">
                {caller.profileImage ? (
                  <Image
                    source={{ uri: caller.profileImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-purple-600 items-center justify-center">
                    <Text className="text-white text-6xl font-bold">
                      {caller.username[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Caller Info */}
            <Animated.View 
              entering={FadeInUp.delay(600)}
              className="items-center mb-12"
            >
              <Text className="text-white text-3xl font-bold mb-2">
                {caller.username}
              </Text>
              <View className="flex-row items-center">
                <Ionicons 
                  name={incomingCall.call_type === 'video' ? 'videocam' : 'call'} 
                  size={16} 
                  color="#A855F7" 
                />
                <Text className="text-purple-400 text-lg ml-2">
                  {incomingCall.call_type === 'video' ? 'Video Call' : 'Voice Call'}
                </Text>
              </View>
            </Animated.View>

            {/* Call Actions */}
            <Animated.View 
              entering={FadeInUp.delay(800)}
              className="flex-row items-center justify-center space-x-20"
            >
              {/* Decline Button */}
              <AnimatedPressable
                onPress={handleDecline}
                className="w-20 h-20 bg-red-600 rounded-full items-center justify-center shadow-lg"
                style={pulseAnimatedStyle}
              >
                <Ionicons 
                  name="call" 
                  size={32} 
                  color="white" 
                  style={{ transform: [{ rotate: '135deg' }] }} 
                />
              </AnimatedPressable>

              {/* Answer Button */}
              <AnimatedPressable
                onPress={handleAnswer}
                className="w-20 h-20 bg-green-600 rounded-full items-center justify-center shadow-lg"
                style={pulseAnimatedStyle}
              >
                <Ionicons name="call" size={32} color="white" />
              </AnimatedPressable>
            </Animated.View>

            {/* Action Labels */}
            <Animated.View 
              entering={FadeInUp.delay(1000)}
              className="flex-row items-center justify-center space-x-20 mt-4"
            >
              <Text className="text-red-400 text-sm font-medium">Decline</Text>
              <Text className="text-green-400 text-sm font-medium">Answer</Text>
            </Animated.View>
          </View>

          {/* Quick Actions Bar */}
          <Animated.View 
            entering={FadeInDown.delay(600)}
            className="px-8 pb-8"
          >
            <View className="flex-row items-center justify-center space-x-12">
              {/* Remind Me Later */}
              <Pressable className="items-center">
                <View className="w-12 h-12 bg-gray-700/80 rounded-full items-center justify-center mb-2">
                  <Ionicons name="time-outline" size={20} color="white" />
                </View>
                <Text className="text-white/60 text-xs">Remind</Text>
              </Pressable>

              {/* Message */}
              <Pressable className="items-center">
                <View className="w-12 h-12 bg-gray-700/80 rounded-full items-center justify-center mb-2">
                  <Ionicons name="chatbubble-outline" size={20} color="white" />
                </View>
                <Text className="text-white/60 text-xs">Message</Text>
              </Pressable>
            </View>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}