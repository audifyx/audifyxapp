import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Dimensions,
  Pressable,
  FlatList,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useContentStore } from '../state/content';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { Reel } from '../types/content';
import Animated, { 
  FadeInUp, 
  FadeInRight, 
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ReelPlayerProps {
  reel: Reel;
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onProfilePress: () => void;
}

const ReelPlayer: React.FC<ReelPlayerProps> = ({
  reel,
  isActive,
  onLike,
  onComment,
  onShare,
  onProfilePress,
}) => {
  const { user } = useAuthStore();
  const { allUsers } = useUsersStore();
  const { interactions } = useContentStore();
  
  const creator = allUsers?.find(u => u.id === reel.creatorId);
  const isLiked = interactions.some(i => i.contentId === reel.id && i.userId === user?.id);
  
  const likeScale = useSharedValue(1);
  const heartOpacity = useSharedValue(0);
  
  const animatedLikeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));
  
  const animatedHeartStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
    transform: [{ scale: heartOpacity.value }],
  }));
  
  const handleLike = () => {
    likeScale.value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
    
    if (!isLiked) {
      heartOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 300 })
      );
    }
    
    runOnJS(onLike)();
  };
  
  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    }
  };
  
  return (
    <View style={{ width, height: height - 100 }} className="relative">
      {/* Video/Image Background */}
      <Pressable 
        onPress={handleDoubleTap}
        className="absolute inset-0"
      >
        <Image
          source={{ uri: reel.thumbnailUrl || 'https://picsum.photos/400/800?random=' + reel.id }}
          className="w-full h-full"
          resizeMode="cover"
        />
        
        {/* Gradient Overlay */}
        <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        
        {/* Flying Heart Animation */}
        <Animated.View 
          style={[animatedHeartStyle]}
          className="absolute inset-0 items-center justify-center"
        >
          <Ionicons name="heart" size={100} color="#FF1744" />
        </Animated.View>
      </Pressable>
      
      {/* Content Info */}
      <View className="absolute bottom-0 left-0 right-16 p-4">
        <Animated.View entering={FadeInUp.delay(200)}>
          {/* Creator Info */}
          <Pressable 
            onPress={onProfilePress}
            className="flex-row items-center mb-3"
          >
            <Image
              source={{ uri: creator?.profileImage || 'https://via.placeholder.com/40' }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-white font-semibold text-base">{creator?.username || 'Unknown'}</Text>
                {creator?.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#A855F7" className="ml-1" />
                )}
              </View>
              <Text className="text-white/70 text-sm">2 hours ago</Text>
            </View>
            <Pressable className="px-4 py-1 border border-white rounded-full">
              <Text className="text-white text-sm font-medium">Follow</Text>
            </Pressable>
          </Pressable>
          
          {/* Description */}
          <Text className="text-white text-base mb-2" numberOfLines={2}>
            {reel.title}
          </Text>
          
          {/* Hashtags */}
          <View className="flex-row flex-wrap mb-3">
            {reel.hashtags.map((hashtag, index) => (
              <Text key={index} className="text-blue-400 text-sm mr-2">
                {hashtag}
              </Text>
            ))}
          </View>
          
          {/* Background Music */}
          <View className="flex-row items-center">
            <Ionicons name="musical-notes" size={16} color="white" />
            <Text className="text-white text-sm ml-2">Original Sound</Text>
          </View>
        </Animated.View>
      </View>
      
      {/* Action Buttons */}
      <View className="absolute right-4 bottom-24">
        <Animated.View entering={FadeInRight.delay(300)} className="items-center space-y-6">
          {/* Like Button */}
          <AnimatedPressable
            style={[animatedLikeStyle]}
            onPress={handleLike}
            className="items-center"
          >
            <View className="w-12 h-12 bg-black/30 rounded-full items-center justify-center">
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={28} 
                color={isLiked ? "#FF1744" : "white"} 
              />
            </View>
            <Text className="text-white text-xs mt-1 font-medium">1.2K</Text>
          </AnimatedPressable>
          
          {/* Comment Button */}
          <Pressable onPress={onComment} className="items-center">
            <View className="w-12 h-12 bg-black/30 rounded-full items-center justify-center">
              <Ionicons name="chatbubble-outline" size={26} color="white" />
            </View>
            <Text className="text-white text-xs mt-1 font-medium">89</Text>
          </Pressable>
          
          {/* Share Button */}
          <Pressable onPress={onShare} className="items-center">
            <View className="w-12 h-12 bg-black/30 rounded-full items-center justify-center">
              <Ionicons name="arrow-redo-outline" size={26} color="white" />
            </View>
            <Text className="text-white text-xs mt-1 font-medium">Share</Text>
          </Pressable>
          
          {/* Music Disc */}
          <View className="items-center">
            <Animated.View 
              className="w-12 h-12 rounded-full border-2 border-white/50 overflow-hidden"
              entering={FadeInRight.delay(600)}
            >
              <Image
                source={{ uri: 'https://picsum.photos/50/50?random=music' + reel.id }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  reel: Reel;
}

const CommentModal: React.FC<CommentModalProps> = ({ visible, onClose, reel }) => {
  const [newComment, setNewComment] = useState('');
  const { comments, addComment } = useContentStore();
  const { user } = useAuthStore();
  
  const reelComments = comments[reel.id] || [];
  
  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;
    
    await addComment(reel.id, user.id, newComment.trim());
    setNewComment('');
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Text className="text-white text-lg font-semibold">Comments</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </View>
        
        {/* Comments List */}
        <FlatList
          data={reelComments}
          className="flex-1 px-4"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Animated.View entering={FadeInUp} className="py-3 border-b border-gray-800/50">
              <View className="flex-row">
                <Image
                  source={{ uri: 'https://via.placeholder.com/32' }}
                  className="w-8 h-8 rounded-full mr-3"
                />
                <View className="flex-1">
                  <Text className="text-white font-medium text-sm">{item.username}</Text>
                  <Text className="text-gray-300 text-sm mt-1">{item.text}</Text>
                  <Text className="text-gray-500 text-xs mt-1">2m ago</Text>
                </View>
                <Pressable className="p-1">
                  <Ionicons name="heart-outline" size={16} color="#666" />
                </Pressable>
              </View>
            </Animated.View>
          )}
          showsVerticalScrollIndicator={false}
        />
        
        {/* Comment Input */}
        <View className="flex-row items-center px-4 py-3 border-t border-gray-800">
          <Image
            source={{ uri: user?.profileImage || 'https://via.placeholder.com/32' }}
            className="w-8 h-8 rounded-full mr-3"
          />
          <View className="flex-1 bg-gray-800 rounded-full px-4 py-2">
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor="#666"
              className="text-white"
              multiline
            />
          </View>
          <Pressable 
            onPress={handleSubmit}
            disabled={!newComment.trim()}
            className="ml-3"
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newComment.trim() ? "#A855F7" : "#666"} 
            />
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default function ReelsScreen() {
  const { reels, likeContent, shareContent } = useContentStore();
  const { user } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    // Auto-scroll to next reel after 10 seconds (optional)
    const timer = setInterval(() => {
      if (currentIndex < reels.length - 1) {
        setCurrentIndex(prev => prev + 1);
        flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      }
    }, 10000);
    
    return () => clearInterval(timer);
  }, [currentIndex, reels.length]);
  
  const handleLike = async (reel: Reel) => {
    if (!user) return;
    await likeContent(reel.id, user.id, 'like');
  };
  
  const handleComment = (reel: Reel) => {
    setSelectedReel(reel);
    setShowComments(true);
  };
  
  const handleShare = async (reel: Reel) => {
    if (!user) return;
    
    Alert.alert(
      'Share Reel',
      'Choose how to share this reel',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Repost', 
          onPress: () => shareContent(reel.id, user.id, 'repost')
        },
        { 
          text: 'Quote Share', 
          onPress: () => shareContent(reel.id, user.id, 'quote_share', 'Check this out!')
        }
      ]
    );
  };
  
  const handleProfilePress = (creatorId: string) => {
    // Navigate to profile
    console.log('Navigate to profile:', creatorId);
  };
  
  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  };
  
  if (!reels || reels.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Ionicons name="film-outline" size={64} color="#666" />
        <Text className="text-gray-400 text-lg mt-4">No reels available</Text>
        <Text className="text-gray-500 text-sm mt-2">Check back later for new content!</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        renderItem={({ item, index }) => (
          <ReelPlayer
            reel={item}
            isActive={index === currentIndex}
            onLike={() => handleLike(item)}
            onComment={() => handleComment(item)}
            onShare={() => handleShare(item)}
            onProfilePress={() => handleProfilePress(item.creatorId)}
          />
        )}
      />
      
      {/* Top Navigation */}
      <View className="absolute top-12 left-0 right-0 flex-row justify-center">
        <View className="flex-row bg-black/20 rounded-full p-1">
          <Pressable className="px-4 py-2 bg-white rounded-full">
            <Text className="text-black font-medium">For You</Text>
          </Pressable>
          <Pressable className="px-4 py-2">
            <Text className="text-white font-medium">Following</Text>
          </Pressable>
        </View>
      </View>
      
      {/* Progress Indicator */}
      <View className="absolute top-20 right-4">
        <Text className="text-white/70 text-sm">
          {currentIndex + 1} / {reels.length}
        </Text>
      </View>
      
      {/* Comments Modal */}
      {selectedReel && (
        <CommentModal
          visible={showComments}
          onClose={() => {
            setShowComments(false);
            setSelectedReel(null);
          }}
          reel={selectedReel}
        />
      )}
    </SafeAreaView>
  );
}