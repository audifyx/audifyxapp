import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/auth';
import { useVoiceChatStore, VoiceChannel, VoiceUser } from '../state/voiceChat';
import Animated, { 
  FadeInUp, 
  FadeInRight, 
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface ChannelCardProps {
  channel: VoiceChannel;
  onJoin: () => void;
  onSettings?: () => void;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel, onJoin, onSettings }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'music': return 'musical-notes';
      case 'gaming': return 'game-controller';
      case 'study': return 'library';
      case 'party': return 'wine';
      case 'general': return 'chatbubbles';
      case 'private': return 'lock-closed';
      default: return 'chatbubbles-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'music': return '#A855F7';
      case 'gaming': return '#EF4444';
      case 'study': return '#10B981';
      case 'party': return '#F59E0B';
      case 'general': return '#06B6D4';
      case 'private': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  return (
    <Animated.View entering={FadeInUp} className="bg-gray-800 rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <View 
              className="w-8 h-8 rounded-lg items-center justify-center mr-3"
              style={{ backgroundColor: `${getCategoryColor(channel.category)}20` }}
            >
              <Ionicons 
                name={getCategoryIcon(channel.category) as keyof typeof Ionicons.glyphMap} 
                size={16} 
                color={getCategoryColor(channel.category)} 
              />
            </View>
            <Text className="text-white font-semibold text-base flex-1" numberOfLines={1}>
              {channel.name}
            </Text>
            {channel.isPrivate && (
              <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
            )}
          </View>
          
          {channel.description && (
            <Text className="text-gray-400 text-sm mb-3" numberOfLines={2}>
              {channel.description}
            </Text>
          )}
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="people" size={14} color="#9CA3AF" />
              <Text className="text-gray-400 text-sm ml-1">
                {channel.userCount}/{channel.maxUsers}
              </Text>
            </View>
            
            <View className="flex-row items-center">
              {channel.userCount > 0 && (
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              )}
              <Text className="text-gray-500 text-xs capitalize">
                {channel.category}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View className="flex-row space-x-2">
        <Pressable
          onPress={onJoin}
          disabled={channel.userCount >= channel.maxUsers}
          className={`flex-1 py-3 rounded-xl items-center ${
            channel.userCount >= channel.maxUsers 
              ? 'bg-gray-700' 
              : 'bg-purple-600'
          }`}
        >
          <Text className={`font-semibold ${
            channel.userCount >= channel.maxUsers 
              ? 'text-gray-400' 
              : 'text-white'
          }`}>
            {channel.userCount >= channel.maxUsers ? 'Full' : 'Join'}
          </Text>
        </Pressable>
        
        {onSettings && (
          <Pressable
            onPress={onSettings}
            className="w-12 h-12 bg-gray-700 rounded-xl items-center justify-center"
          >
            <Ionicons name="settings" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

interface VoiceUserCardProps {
  user: VoiceUser;
  isCurrentUser: boolean;
}

const VoiceUserCard: React.FC<VoiceUserCardProps> = ({ user, isCurrentUser }) => {
  const speakingAnimation = useSharedValue(0);

  useEffect(() => {
    if (user.isSpeaking) {
      speakingAnimation.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1,
        true
      );
    } else {
      speakingAnimation.value = withTiming(0, { duration: 300 });
    }
  }, [user.isSpeaking]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(speakingAnimation.value, [0, 1], [1, 1.1]);
    const opacity = interpolate(speakingAnimation.value, [0, 1], [0.8, 1]);
    
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View 
      entering={FadeInRight}
      exiting={FadeOut}
      className={`items-center mx-2 mb-4 ${isCurrentUser ? 'bg-purple-600/20 rounded-xl p-2' : ''}`}
    >
      <Animated.View 
        style={animatedStyle}
        className="relative mb-2"
      >
        <View className={`w-16 h-16 rounded-full border-2 ${
          user.isSpeaking 
            ? 'border-green-400' 
            : user.status === 'connected' 
              ? 'border-gray-600' 
              : 'border-red-400'
        }`}>
          <Image
            source={{ uri: user.profileImage }}
            className="w-full h-full rounded-full"
          />
        </View>
        
        {/* Status indicators */}
        <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-800 rounded-full items-center justify-center">
          {user.isMuted ? (
            <Ionicons name="mic-off" size={12} color="#EF4444" />
          ) : user.isDeafened ? (
            <Ionicons name="volume-mute" size={12} color="#EF4444" />
          ) : user.isSpeaking ? (
            <Ionicons name="mic" size={12} color="#10B981" />
          ) : (
            <Ionicons name="mic" size={12} color="#6B7280" />
          )}
        </View>
      </Animated.View>
      
      <Text className={`text-sm font-medium text-center ${
        isCurrentUser ? 'text-purple-300' : 'text-white'
      }`} numberOfLines={1}>
        {user.username}
        {isCurrentUser && ' (You)'}
      </Text>
      
      <Text className={`text-xs ${
        user.status === 'connected' 
          ? 'text-green-400' 
          : user.status === 'connecting' 
            ? 'text-yellow-400' 
            : 'text-red-400'
      }`}>
        {user.status}
      </Text>
    </Animated.View>
  );
};

export default function VoiceChatScreen() {
  const { user } = useAuthStore();
  const {
    channels,
    currentChannel,
    connectedUsers,
    isMuted,
    isDeafened,
    isPushToTalk,
    volume,
    isConnected,
    isConnecting,
    createChannel,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    togglePushToTalk,
    setVolume,
    getChannelsByCategory,
    checkAudioPermission,
  } = useVoiceChatStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelCategory, setNewChannelCategory] = useState<VoiceChannel['category']>('general');
  const [selectedCategory, setSelectedCategory] = useState<VoiceChannel['category'] | 'all'>('all');

  useEffect(() => {
    checkAudioPermission();
  }, []);

  // Simulate speaking for demo
  useEffect(() => {
    if (isConnected && connectedUsers.length > 0) {
      const interval = setInterval(() => {
        // Randomly make users speak
        connectedUsers.forEach(user => {
          if (Math.random() < 0.1) { // 10% chance per second
            // This would be handled by actual voice detection
            console.log(`${user.username} is speaking:`, Math.random() < 0.5);
          }
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isConnected, connectedUsers]);

  const handleJoinChannel = async (channel: VoiceChannel) => {
    if (!user) return;
    
    const hasPermission = await checkAudioPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant microphone access to use voice chat.');
      return;
    }

    joinChannel(channel.id, user.id, user.username, user.profileImage || '');
  };

  const handleLeaveChannel = () => {
    if (user) {
      leaveChannel(user.id);
    }
  };

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;
    
    createChannel(newChannelName.trim(), newChannelCategory, newChannelDescription.trim());
    setNewChannelName('');
    setNewChannelDescription('');
    setNewChannelCategory('general');
    setShowCreateModal(false);
  };

  const categories = [
    { key: 'all' as const, label: 'All Channels', icon: 'apps' },
    { key: 'music' as const, label: 'Music', icon: 'musical-notes' },
    { key: 'gaming' as const, label: 'Gaming', icon: 'game-controller' },
    { key: 'study' as const, label: 'Study', icon: 'library' },
    { key: 'party' as const, label: 'Party', icon: 'wine' },
    { key: 'general' as const, label: 'General', icon: 'chatbubbles' },
  ];

  const createCategories: Array<{ value: VoiceChannel['category']; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { value: 'general', label: 'General Chat', icon: 'chatbubbles' },
    { value: 'music', label: 'Music Discussion', icon: 'musical-notes' },
    { value: 'gaming', label: 'Gaming', icon: 'game-controller' },
    { value: 'study', label: 'Study Session', icon: 'library' },
    { value: 'party', label: 'Party Vibes', icon: 'wine' },
    { value: 'private', label: 'Private Room', icon: 'lock-closed' },
  ];

  const filteredChannels = selectedCategory === 'all' 
    ? channels 
    : getChannelsByCategory(selectedCategory);

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
        <View className="flex-1">
          <Text className="text-white text-2xl font-bold">Voice Chat</Text>
          <Text className="text-gray-400 text-sm">
            {isConnected ? `Connected to ${currentChannel?.name}` : 'Join a voice channel'}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Pressable
            onPress={() => setShowVoiceSettings(true)}
            className="w-10 h-10 bg-gray-800 rounded-full items-center justify-center mr-3"
          >
            <Ionicons name="settings" size={20} color="#9CA3AF" />
          </Pressable>
          
          <Pressable
            onPress={() => setShowCreateModal(true)}
            className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={20} color="white" />
          </Pressable>
        </View>
      </View>

      {/* Voice Connection Panel */}
      {isConnected && currentChannel && (
        <Animated.View entering={FadeInUp} className="bg-gray-900 border-b border-gray-800">
          <View className="px-4 py-3">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">
                  {currentChannel.name}
                </Text>
                <Text className="text-gray-400 text-sm">
                  {connectedUsers.length} user{connectedUsers.length !== 1 ? 's' : ''} connected
                </Text>
              </View>
              
              <Pressable
                onPress={handleLeaveChannel}
                className="bg-red-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Leave</Text>
              </Pressable>
            </View>
            
            {/* Connected Users */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="mb-3"
            >
              <View className="flex-row">
                {connectedUsers.map((voiceUser) => (
                  <VoiceUserCard
                    key={voiceUser.id}
                    user={voiceUser}
                    isCurrentUser={voiceUser.id === user?.id}
                  />
                ))}
              </View>
            </ScrollView>
            
            {/* Voice Controls */}
            <View className="flex-row items-center justify-center space-x-4">
              <Pressable
                onPress={toggleMute}
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  isMuted ? 'bg-red-600' : 'bg-gray-700'
                }`}
              >
                <Ionicons 
                  name={isMuted ? "mic-off" : "mic"} 
                  size={20} 
                  color="white" 
                />
              </Pressable>
              
              <Pressable
                onPress={toggleDeafen}
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  isDeafened ? 'bg-red-600' : 'bg-gray-700'
                }`}
              >
                <Ionicons 
                  name={isDeafened ? "volume-mute" : "volume-high"} 
                  size={20} 
                  color="white" 
                />
              </Pressable>
              
              <View className="flex-1 mx-4">
                <View className="flex-row items-center">
                  <Ionicons name="volume-low" size={16} color="#9CA3AF" />
                  <View className="flex-1 mx-3 h-1 bg-gray-700 rounded-full">
                    <View 
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${volume}%` }}
                    />
                  </View>
                  <Ionicons name="volume-high" size={16} color="#9CA3AF" />
                </View>
              </View>
              
              <Pressable
                onPress={togglePushToTalk}
                className={`px-3 py-2 rounded-lg ${
                  isPushToTalk ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                <Text className="text-white text-xs font-medium">PTT</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Category Filter */}
      <View className="py-4">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <View className="flex-row space-x-2">
            {categories.map((category) => (
              <Pressable
                key={category.key}
                onPress={() => setSelectedCategory(category.key)}
                className={`flex-row items-center px-4 py-2 rounded-full border ${
                  selectedCategory === category.key
                    ? 'bg-purple-600 border-purple-600'
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                <Ionicons 
                  name={category.icon as keyof typeof Ionicons.glyphMap} 
                  size={16} 
                  color={selectedCategory === category.key ? 'white' : '#9CA3AF'} 
                />
                <Text className={`ml-2 font-medium ${
                  selectedCategory === category.key ? 'text-white' : 'text-gray-300'
                }`}>
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Channels List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {filteredChannels.length > 0 ? (
          filteredChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onJoin={() => handleJoinChannel(channel)}
              onSettings={channel.createdBy === user?.id ? () => {
                Alert.alert('Channel Settings', 'Channel management coming soon!');
              } : undefined}
            />
          ))
        ) : (
          <View className="items-center py-12">
            <View className="w-16 h-16 bg-gray-800 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubbles-outline" size={32} color="#6B7280" />
            </View>
            <Text className="text-gray-400 text-lg mb-2">No channels found</Text>
            <Text className="text-gray-500 text-center">
              Create a new channel or try a different category
            </Text>
          </View>
        )}
        
        <View className="h-20" />
      </ScrollView>

      {/* Create Channel Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
            <Pressable onPress={() => setShowCreateModal(false)}>
              <Text className="text-purple-500 text-base font-medium">Cancel</Text>
            </Pressable>
            <Text className="text-white text-lg font-semibold">Create Channel</Text>
            <Pressable
              onPress={handleCreateChannel}
              disabled={!newChannelName.trim()}
            >
              <Text className={`text-base font-medium ${
                newChannelName.trim() ? 'text-purple-500' : 'text-gray-500'
              }`}>
                Create
              </Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="mb-6">
              <Text className="text-white text-base font-medium mb-2">Channel Name</Text>
              <TextInput
                value={newChannelName}
                onChangeText={setNewChannelName}
                placeholder="Enter channel name"
                placeholderTextColor="#6B7280"
                className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
              />
            </View>

            <View className="mb-6">
              <Text className="text-white text-base font-medium mb-2">Description (Optional)</Text>
              <TextInput
                value={newChannelDescription}
                onChangeText={setNewChannelDescription}
                placeholder="Describe what this channel is for..."
                placeholderTextColor="#6B7280"
                className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View className="mb-6">
              <Text className="text-white text-base font-medium mb-3">Category</Text>
              <View className="space-y-2">
                {createCategories.map((category) => (
                  <Pressable
                    key={category.value}
                    onPress={() => setNewChannelCategory(category.value)}
                    className={`flex-row items-center p-3 rounded-xl border ${
                      newChannelCategory === category.value 
                        ? 'bg-purple-600/20 border-purple-600' 
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <Ionicons 
                      name={category.icon} 
                      size={20} 
                      color={newChannelCategory === category.value ? '#A855F7' : '#9CA3AF'} 
                    />
                    <Text className={`ml-3 font-medium ${
                      newChannelCategory === category.value ? 'text-purple-400' : 'text-white'
                    }`}>
                      {category.label}
                    </Text>
                    {newChannelCategory === category.value && (
                      <Ionicons name="checkmark-circle" size={20} color="#A855F7" className="ml-auto" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Voice Settings Modal */}
      <Modal
        visible={showVoiceSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVoiceSettings(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
            <Pressable onPress={() => setShowVoiceSettings(false)}>
              <Text className="text-purple-500 text-base font-medium">Done</Text>
            </Pressable>
            <Text className="text-white text-lg font-semibold">Voice Settings</Text>
            <View className="w-12" />
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="bg-gray-800 rounded-2xl p-4 mb-4">
              <Text className="text-white text-lg font-semibold mb-4">🎤 Audio Quality</Text>
              <View className="space-y-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-300">Noise Reduction</Text>
                  <Text className="text-green-400 font-medium">Enabled</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-300">Echo Cancellation</Text>
                  <Text className="text-green-400 font-medium">Enabled</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-300">Voice Activation</Text>
                  <Text className="text-green-400 font-medium">Enabled</Text>
                </View>
              </View>
            </View>

            <View className="bg-gray-800 rounded-2xl p-4 mb-4">
              <Text className="text-white text-lg font-semibold mb-4">🔊 Audio Devices</Text>
              <View className="space-y-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-300">Microphone</Text>
                  <Text className="text-white font-medium">Built-in Microphone</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-300">Speaker</Text>
                  <Text className="text-white font-medium">Built-in Speaker</Text>
                </View>
              </View>
            </View>

            <View className="bg-gray-800 rounded-2xl p-4">
              <Text className="text-white text-lg font-semibold mb-4">⚙️ Advanced</Text>
              <View className="space-y-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-300">Push to Talk</Text>
                  <Text className={`font-medium ${isPushToTalk ? 'text-green-400' : 'text-gray-400'}`}>
                    {isPushToTalk ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-300">Voice Threshold</Text>
                  <Text className="text-white font-medium">50%</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-300">Audio Codec</Text>
                  <Text className="text-white font-medium">Opus</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}