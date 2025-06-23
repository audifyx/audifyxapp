import React from 'react';
import { View, Text, Modal, Pressable, Alert, Share } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSocialStore } from '../state/social';
import { useAuthStore } from '../state/auth';
import { useNotificationsStore } from '../state/notifications';
import { Track } from '../state/music';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  track: Track;
}

const APP_LINK = 'https://www.vibecodeapp.com/projects/8b58184e-cf3b-4bdb-b33f-8c67011de4d4';

export default function ShareModal({ visible, onClose, track }: ShareModalProps) {
  const { shareTrack } = useSocialStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationsStore();
  
  const handleExternalShare = async () => {
    if (!user) return;
    
    const shareContent = {
      title: `Check out "${track.title}" by ${track.artist}`,
      message: `🎵 Listen to "${track.title}" by ${track.artist} on Audifyx!\n\n${APP_LINK}`,
      url: APP_LINK,
    };
    
    try {
      await Share.share(shareContent);
      
      // Record the share
      shareTrack(user.id, track.id, 'external');
      
      // Create notification for track owner
      if (track.uploadedBy !== user.id) {
        addNotification({
          type: 'share',
          fromUserId: user.id,
          toUserId: track.uploadedBy,
          trackId: track.id
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  const handleInternalShare = () => {
    if (!user) return;
    
    // Record internal share
    shareTrack(user.id, track.id, 'internal');
    
    // Create notification for track owner
    if (track.uploadedBy !== user.id) {
      addNotification({
        type: 'share',
        fromUserId: user.id,
        toUserId: track.uploadedBy,
        trackId: track.id
      });
    }
    
    Alert.alert(
      'Shared!',
      `"${track.title}" has been shared within the app`,
      [{ text: 'OK', style: 'default' }]
    );
    
    onClose();
  };
  
  const handleCopyLink = async () => {
    if (!user) return;
    
    const shareText = `🎵 Check out "${track.title}" by ${track.artist} on Audifyx! ${APP_LINK}`;
    
    try {
      // For React Native, we'll use the Share API to copy
      await Share.share({
        message: shareText,
        title: `${track.title} - Audifyx`
      });
      
      // Record the share
      shareTrack(user.id, track.id, 'external');
      
      onClose();
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <Animated.View
          entering={FadeInDown}
          className="bg-gray-900 rounded-t-3xl p-6"
        >
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-xl font-bold">Share Track</Text>
            <Pressable 
              onPress={onClose}
              className="w-8 h-8 bg-gray-700 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={16} color="white" />
            </Pressable>
          </View>
          
          {/* Track Info */}
          <View className="mb-6 p-4 bg-gray-800 rounded-xl">
            <Text className="text-white font-semibold text-base">"{track.title}"</Text>
            <Text className="text-gray-400 text-sm mt-1">by {track.artist}</Text>
          </View>
          
          {/* Share Options */}
          <View className="space-y-3">
            <AnimatedPressable
              entering={FadeInUp.delay(100)}
              onPress={handleExternalShare}
              className="flex-row items-center p-4 bg-gray-800 rounded-xl"
            >
              <View className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center mr-4">
                <Ionicons name="share-outline" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">Share Externally</Text>
                <Text className="text-gray-400 text-sm">Share to social media, messages, etc.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </AnimatedPressable>
            
            <AnimatedPressable
              entering={FadeInUp.delay(200)}
              onPress={handleInternalShare}
              className="flex-row items-center p-4 bg-gray-800 rounded-xl"
            >
              <View className="w-12 h-12 bg-purple-600 rounded-xl items-center justify-center mr-4">
                <Ionicons name="people" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">Share in App</Text>
                <Text className="text-gray-400 text-sm">Share within Audifyx community</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </AnimatedPressable>
            
            <AnimatedPressable
              entering={FadeInUp.delay(300)}
              onPress={handleCopyLink}
              className="flex-row items-center p-4 bg-gray-800 rounded-xl"
            >
              <View className="w-12 h-12 bg-green-600 rounded-xl items-center justify-center mr-4">
                <Ionicons name="link" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">Copy Link</Text>
                <Text className="text-gray-400 text-sm">Copy Audifyx app link</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </AnimatedPressable>
            
            <AnimatedPressable
              entering={FadeInUp.delay(400)}
              onPress={onClose}
              className="bg-gray-700 rounded-xl py-4 mt-4"
            >
              <Text className="text-white text-center font-semibold">Cancel</Text>
            </AnimatedPressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}