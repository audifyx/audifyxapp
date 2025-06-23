import React from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUsersStore } from '../state/users';
import { useMusicStore } from '../state/music';
import { useSocialStore } from '../state/social';
import { useAuthStore } from '../state/auth';
import { useMessagesStore } from '../state/messages';
import TrackCard from '../components/TrackCard';
import AudioPlayer from '../components/AudioPlayer';
import Animated, { FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params as { userId: string };
  
  const { getUserById, followUser, unfollowUser, isFollowing } = useUsersStore();
  const { tracks, currentTrack } = useMusicStore();
  const { getUserLikes } = useSocialStore();
  const { user: currentUser } = useAuthStore();
  const { createConversation } = useMessagesStore();
  
  const profileUser = getUserById(userId);
  const userTracks = tracks.filter(track => track.uploadedBy === userId);
  const userLikes = getUserLikes(userId);
  const totalStreams = userTracks.reduce((sum, track) => sum + track.streamCount, 0);
  
  const isCurrentUser = currentUser?.id === userId;
  const following = currentUser ? isFollowing(userId, currentUser.id) : false;
  
  const handleFollow = () => {
    if (!currentUser) return;
    
    if (following) {
      unfollowUser(userId, currentUser.id);
    } else {
      followUser(userId, currentUser.id);
    }
  };
  
  const handleMessage = () => {
    if (!currentUser) return;
    
    const conversationId = createConversation([currentUser.id, userId]);
    (navigation as any).navigate('Chat', { 
      conversationId, 
      otherUserId: userId 
    });
  };
  
  if (!profileUser) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">User not found</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          
          <Text className="text-lg font-semibold text-white">{profileUser.username}</Text>
          
          <Pressable>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </Pressable>
        </View>
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Profile Info */}
          <Animated.View entering={FadeInUp} className="items-center py-6 px-4">
            <View className="w-24 h-24 bg-purple-600 rounded-full items-center justify-center mb-4">
              {profileUser.profileImage ? (
                <Image
                  source={{ uri: profileUser.profileImage }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Text className="text-white text-2xl font-bold">
                  {profileUser.username[0]?.toUpperCase()}
                </Text>
              )}
            </View>
            
            <View className="flex-row items-center justify-center">
              <Text className="text-white text-xl font-bold">{profileUser.username}</Text>
              {profileUser.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" className="ml-2" />
              )}
            </View>
            <Text className="text-gray-400 text-sm mt-1">{profileUser.email}</Text>
            
            {/* Bio */}
            {profileUser.bio && (
              <Text className="text-gray-300 text-center mt-3 px-4 leading-5">
                {profileUser.bio}
              </Text>
            )}
            
            {/* Location and Website */}
            <View className="flex-row items-center justify-center mt-2 space-x-4">
              {profileUser.location && (
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text className="text-gray-400 text-sm ml-1">{profileUser.location}</Text>
                </View>
              )}
              {profileUser.website && (
                <Pressable 
                  onPress={() => Linking.openURL(profileUser.website!)}
                  className="flex-row items-center"
                >
                  <Ionicons name="globe-outline" size={14} color="#A855F7" />
                  <Text className="text-purple-400 text-sm ml-1">Website</Text>
                </Pressable>
              )}
            </View>
            
            {/* Stats */}
            <View className="flex-row items-center justify-center mt-6 space-x-8">
              <View className="items-center">
                <Text className="text-white text-xl font-bold">{userTracks.length}</Text>
                <Text className="text-gray-400 text-sm">Tracks</Text>
              </View>
              
              <View className="items-center">
                <Text className="text-white text-xl font-bold">{totalStreams.toLocaleString()}</Text>
                <Text className="text-gray-400 text-sm">Streams</Text>
              </View>
              
              <View className="items-center">
                <Text className="text-white text-xl font-bold">{profileUser.followers || 0}</Text>
                <Text className="text-gray-400 text-sm">Followers</Text>
              </View>
              
              <View className="items-center">
                <Text className="text-white text-xl font-bold">{profileUser.following || 0}</Text>
                <Text className="text-gray-400 text-sm">Following</Text>
              </View>
            </View>
            
            {/* Custom Links */}
            {profileUser.links && profileUser.links.length > 0 && (
              <View className="w-full mt-6 px-4">
                <View className="flex-row flex-wrap justify-center gap-3">
                  {profileUser.links.map((link, index) => (
                    <AnimatedPressable
                      key={link.id}
                      entering={FadeInUp.delay(400 + index * 100)}
                      onPress={() => Linking.openURL(link.url)}
                      className="bg-gray-800 rounded-xl px-4 py-3 flex-row items-center"
                    >
                      <Ionicons name="link-outline" size={16} color="#A855F7" />
                      <Text className="text-white ml-2 font-medium">{link.title}</Text>
                    </AnimatedPressable>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            {!isCurrentUser && (
              <View className="flex-row space-x-3 mt-6 w-full px-4">
                <AnimatedPressable
                  entering={FadeInUp.delay(200)}
                  onPress={handleFollow}
                  className={`flex-1 rounded-xl py-3 ${
                    following ? 'bg-gray-800' : 'bg-purple-600'
                  }`}
                >
                  <Text className="text-white text-center font-semibold">
                    {following ? 'Following' : 'Follow'}
                  </Text>
                </AnimatedPressable>
                
                <AnimatedPressable
                  entering={FadeInUp.delay(300)}
                  onPress={handleMessage}
                  className="flex-1 bg-gray-800 rounded-xl py-3"
                >
                  <Text className="text-white text-center font-semibold">Message</Text>
                </AnimatedPressable>
              </View>
            )}
          </Animated.View>
          
          {/* User's Tracks */}
          <View className="px-4 pb-32">
            <Text className="text-white text-lg font-bold mb-4">
              {isCurrentUser ? 'Your Tracks' : `${profileUser.username}'s Tracks`}
            </Text>
            
            {userTracks.length > 0 ? (
              userTracks.map((track, index) => (
                <Animated.View 
                  key={track.id}
                  entering={FadeInUp.delay(index * 100)}
                >
                  <TrackCard track={track} showStats />
                </Animated.View>
              ))
            ) : (
              <View className="items-center justify-center py-20">
                <Ionicons name="musical-notes-outline" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-lg mt-4">
                  {isCurrentUser ? 'No tracks uploaded yet' : 'No tracks from this user'}
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                  {isCurrentUser 
                    ? 'Start sharing your music with the world'
                    : 'Check back later for new uploads'
                  }
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Fixed Audio Player */}
        {currentTrack && <AudioPlayer />}
      </View>
    </SafeAreaView>
  );
}