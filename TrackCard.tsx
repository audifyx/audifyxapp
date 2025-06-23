import React, { useState } from 'react';
import { View, Text, Image, Pressable, Modal, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useMusicStore, Track } from '../state/music';
import { useSocialStore } from '../state/social';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { useNotificationsStore } from '../state/notifications';
import { useNavigation } from '@react-navigation/native';
import CommentsModal from './CommentsModal';
import ShareModal from './ShareModal';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TrackCardProps {
  track: Track;
  showPlaylistButton?: boolean;
  showStats?: boolean;
}

export default function TrackCard({ track, showPlaylistButton, showStats }: TrackCardProps) {
  const { 
    setCurrentTrack, 
    togglePlayback, 
    incrementStreamCount, 
    currentTrack, 
    isPlaying, 
    playlists, 
    addToPlaylist,
    deleteTrack,
    updateTrackImage 
  } = useMusicStore();
  
  const { 
    toggleLike, 
    shareTrack, 
    isLiked, 
    getLikesCount, 
    getCommentsCount, 
    getSharesCount,
    deleteTrackData 
  } = useSocialStore();
  
  const { user } = useAuthStore();
  const { getUserById } = useUsersStore();
  const { addNotification } = useNotificationsStore();
  
  // Get uploader user data
  const uploaderUser = getUserById(track.uploadedBy);
  const navigation = useNavigation();
  
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const isOwnTrack = user?.id === track.uploadedBy;
  
  const liked = user ? isLiked(user.id, track.id) : false;
  const likesCount = getLikesCount(track.id);
  const commentsCount = getCommentsCount(track.id);
  const sharesCount = getSharesCount(track.id);
  
  // Animation for like button
  const likeScale = useSharedValue(1);
  const [showFloatingHeart, setShowFloatingHeart] = useState(false);
  
  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));
  
  const isCurrentTrack = currentTrack?.id === track.id;
  
  const handlePlay = () => {
    try {
      if (isCurrentTrack) {
        togglePlayback();
      } else {
        setCurrentTrack(track);
        incrementStreamCount(track.id);
      }
    } catch (error) {
      console.error('Error handling play:', error);
    }
  };
  
  const handleAddToPlaylist = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    addToPlaylist(playlistId, track.id);
    setShowPlaylistModal(false);
    
    // Show success feedback
    if (playlist) {
      Alert.alert(
        'Added to Playlist',
        `"${track.title}" has been added to "${playlist.name}"`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };
  
  const handleLike = () => {
    if (user) {
      const wasLiked = isLiked(user.id, track.id);
      
      // Animate the like button
      likeScale.value = withSequence(
        withSpring(1.3, { duration: 200 }),
        withSpring(1, { duration: 200 })
      );
      
      toggleLike(user.id, track.id);
      
      // Show floating heart animation for new likes
      if (!wasLiked) {
        setShowFloatingHeart(true);
        setTimeout(() => setShowFloatingHeart(false), 1000);
        
        // Create notification for track owner
        if (track.uploadedBy !== user.id) {
          addNotification({
            type: 'like',
            fromUserId: user.id,
            toUserId: track.uploadedBy,
            trackId: track.id
          });
        }
      }
    }
  };
  
  const handleShare = () => {
    setShowShareModal(true);
  };
  
  const handleComments = () => {
    setShowCommentsModal(true);
  };
  
  const handleUserPress = () => {
    if (track.uploadedBy && track.uploadedBy !== user?.id) {
      (navigation as any).navigate('UserProfile', { userId: track.uploadedBy });
    }
  };
  
  const handleDelete = () => {
    // Clean up social data first
    deleteTrackData(track.id);
    // Then delete the track
    deleteTrack(track.id);
    setShowDeleteModal(false);
    
    Alert.alert(
      'Track Deleted',
      `"${track.title}" has been deleted successfully`,
      [{ text: 'OK', style: 'default' }]
    );
  };
  
  const changeCoverImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to change cover image');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateTrackImage(track.id, result.assets[0].uri);
        Alert.alert('Success', 'Cover image updated successfully');
      }
    } catch (error) {
      console.error('Error changing cover image:', error);
      Alert.alert('Error', 'Failed to update cover image');
    }
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  const getSourceIcon = () => {
    switch (track.source) {
      case 'soundcloud':
        return <MaterialIcons name="cloud" size={16} color="#FF5500" />;
      case 'youtube':
        return <MaterialIcons name="play-arrow" size={16} color="#FF0000" />;
      case 'spotify':
        return <MaterialIcons name="library-music" size={16} color="#1DB954" />;
      default:
        return <Ionicons name="musical-note" size={16} color="#A855F7" />;
    }
  };
  
  return (
    <View className="bg-black border-b border-gray-800 px-4 py-3">
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <Pressable onPress={handleUserPress} className="flex-row items-center flex-1">
          <View className="w-8 h-8 bg-purple-600 rounded-full items-center justify-center mr-3">
            <Text className="text-white text-sm font-bold">
              {track.artist[0]?.toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-white font-semibold">{track.artist}</Text>
              {uploaderUser?.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#3B82F6" className="ml-1" />
              )}
            </View>
            <View className="flex-row items-center">
              {getSourceIcon()}
              <Text className="text-gray-400 text-sm ml-1">
                {new Date(track.uploadedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Pressable>
        <View className="flex-row items-center space-x-3">
          <Pressable 
            onPress={() => setShowPlaylistModal(true)}
            className="bg-purple-600 rounded-full w-8 h-8 items-center justify-center"
          >
            <Ionicons name="add" size={16} color="white" />
          </Pressable>
          <Pressable onPress={() => setShowDeleteModal(true)}>
            <Ionicons 
              name={isOwnTrack ? "trash-outline" : "ellipsis-horizontal"} 
              size={20} 
              color={isOwnTrack ? "#EF4444" : "#6B7280"} 
            />
          </Pressable>
        </View>
      </View>
      
      {/* Track Image and Info */}
      <View className="relative mb-3">
        <Pressable 
          onLongPress={isOwnTrack ? changeCoverImage : undefined}
        >
          {track.imageUrl ? (
            <Image
              source={{ uri: track.imageUrl }}
              className="w-full h-80 rounded-2xl"
            />
          ) : (
            <View className="w-full h-80 rounded-2xl bg-gray-800 items-center justify-center">
              <Ionicons name="musical-notes" size={80} color="#6B7280" />
              <Text className="text-gray-400 text-sm mt-2">No cover art</Text>
            </View>
          )}
          
          {/* Change Cover Hint for Own Tracks */}
          {isOwnTrack && (
            <View className="absolute top-3 left-3 bg-black/60 rounded-lg px-2 py-1">
              <Text className="text-white text-xs">Hold to change cover</Text>
            </View>
          )}
        </Pressable>
        
        {/* Play Button Overlay */}
        <View className="absolute inset-0 items-center justify-center">
          <Pressable
            onPress={handlePlay}
            className="w-16 h-16 bg-black/70 rounded-full items-center justify-center"
          >
            <Ionicons
              name={isCurrentTrack && isPlaying ? 'pause' : 'play'}
              size={28}
              color="white"
            />
          </Pressable>
        </View>
        
        {/* Duration Badge */}
        <View className="absolute bottom-3 right-3 bg-black/70 rounded-lg px-2 py-1">
          <Text className="text-white text-xs font-medium">
            {formatDuration(track.duration)}
          </Text>
        </View>
        
        {/* Floating Heart Animation */}
        {showFloatingHeart && (
          <Animated.View 
            entering={FadeInDown.duration(300)}
            className="absolute inset-0 items-center justify-center pointer-events-none"
          >
            <Ionicons name="heart" size={60} color="#EF4444" />
          </Animated.View>
        )}
      </View>
      
      {/* Track Title */}
      <Text className="text-white text-lg font-bold mb-2">{track.title}</Text>
      
      {/* Action Buttons */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-4">
          <Pressable onPress={handleLike}>
            <Animated.View style={likeAnimatedStyle}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={24}
                color={liked ? '#EF4444' : 'white'}
              />
            </Animated.View>
          </Pressable>
          
          <Pressable onPress={handleComments}>
            <View className="relative">
              <Ionicons name="chatbubble-outline" size={24} color="white" />
              {commentsCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-blue-500 rounded-full min-w-[16px] h-4 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {commentsCount > 9 ? '9+' : commentsCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
          
          <Pressable onPress={handleShare}>
            <Ionicons name="paper-plane-outline" size={24} color="white" />
          </Pressable>
          
          {/* Always show playlist button */}
          <Pressable 
            onPress={() => setShowPlaylistModal(true)}
            className="flex-row items-center bg-purple-600/20 rounded-full px-3 py-1"
          >
            <Ionicons name="add" size={16} color="#A855F7" />
            <Text className="text-purple-400 text-xs ml-1 font-medium">Playlist</Text>
          </Pressable>
        </View>
        
        <Pressable>
          <Ionicons name="bookmark-outline" size={24} color="white" />
        </Pressable>
      </View>
      
      {/* Stats */}
      <View className="mt-3">
        {(likesCount > 0 || commentsCount > 0) && (
          <View className="flex-row items-center mb-2">
            {likesCount > 0 && (
              <Text className="text-gray-400 text-sm">
                {formatNumber(likesCount)} {likesCount === 1 ? 'like' : 'likes'}
              </Text>
            )}
            {likesCount > 0 && commentsCount > 0 && (
              <Text className="text-gray-400 text-sm mx-2">•</Text>
            )}
            {commentsCount > 0 && (
              <Text className="text-gray-400 text-sm">
                {formatNumber(commentsCount)} {commentsCount === 1 ? 'comment' : 'comments'}
              </Text>
            )}
          </View>
        )}
        
        <View className="flex-row items-center">
          <Text className="text-gray-400 text-sm">
            {formatNumber(track.streamCount)} streams
          </Text>
          {showStats && sharesCount > 0 && (
            <>
              <Text className="text-gray-400 text-sm mx-2">•</Text>
              <Text className="text-gray-400 text-sm">
                {formatNumber(sharesCount)} shares
              </Text>
            </>
          )}
        </View>
      </View>
      
      {/* Add to Playlist Modal */}
      <Modal
        visible={showPlaylistModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <Animated.View
            entering={FadeInDown}
            className="bg-gray-900 rounded-t-3xl p-6 max-h-96"
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Add to Playlist</Text>
              <Pressable 
                onPress={() => setShowPlaylistModal(false)}
                className="w-8 h-8 bg-gray-700 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={16} color="white" />
              </Pressable>
            </View>
            
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-3">
                Adding "{track.title}" by {track.artist}
              </Text>
            </View>
            
            {playlists.length > 0 ? (
              playlists.map((playlist) => (
                <Pressable
                  key={playlist.id}
                  onPress={() => handleAddToPlaylist(playlist.id)}
                  className="flex-row items-center py-4 border-b border-gray-700 last:border-b-0"
                >
                  <View className="w-12 h-12 bg-purple-600 rounded-xl items-center justify-center mr-4">
                    <Ionicons name="musical-notes" size={20} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-base">{playlist.name}</Text>
                    <Text className="text-gray-400 text-sm mt-1">
                      {playlist.tracks.length} songs
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#A855F7" />
                </Pressable>
              ))
            ) : (
              <View className="items-center py-8">
                <Ionicons name="library-outline" size={48} color="#6B7280" />
                <Text className="text-gray-400 text-center mt-4">No playlists yet</Text>
                <Text className="text-gray-500 text-center mt-2 text-sm">
                  Create a playlist first to add tracks
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <Animated.View 
            entering={FadeInDown}
            className="bg-gray-900 w-full rounded-2xl p-6"
          >
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="trash" size={32} color="#EF4444" />
              </View>
              <Text className="text-white text-xl font-bold mb-2">Delete Track</Text>
              <Text className="text-gray-400 text-center leading-6">
                Are you sure you want to delete "{track.title}"? This action cannot be undone.
              </Text>
            </View>
            
            <View className="space-y-3">
              <Pressable
                onPress={handleDelete}
                className="bg-red-600 rounded-xl py-4"
              >
                <Text className="text-white text-center font-semibold text-base">
                  Delete Track
                </Text>
              </Pressable>
              
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                className="bg-gray-700 rounded-xl py-4"
              >
                <Text className="text-white text-center font-semibold text-base">
                  Cancel
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
      
      {/* Comments Modal */}
      <CommentsModal
        visible={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        track={track}
      />
      
      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        track={track}
      />
    </View>
  );
}