import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useContentStore } from '../state/content';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { Story } from '../types/content';
import Animated, { 
  FadeInUp, 
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StoryCircleProps {
  story?: Story;
  creator?: any;
  isAddStory?: boolean;
  onPress: () => void;
  index: number;
}

const StoryCircle: React.FC<StoryCircleProps> = ({ 
  story, 
  creator, 
  isAddStory, 
  onPress, 
  index 
}) => {
  const { user } = useAuthStore();
  
  const hasViewed = story && user && story.viewedBy.includes(user.id);
  const isOwnStory = story && user && story.creatorId === user.id;
  
  return (
    <AnimatedPressable
      entering={FadeInRight.delay(index * 50)}
      onPress={onPress}
      className="items-center mr-4"
    >
      <View className="relative">
        {/* Story Ring */}
        <View className={`w-16 h-16 rounded-full p-1 ${
          isAddStory 
            ? 'border-2 border-dashed border-gray-500' 
            : hasViewed
              ? 'border-2 border-gray-600'
              : 'border-2 border-purple-500'
        }`}>
          <View className="w-full h-full rounded-full overflow-hidden">
            {isAddStory ? (
              <View className="w-full h-full bg-gray-800 items-center justify-center">
                <Ionicons name="add" size={24} color="#A855F7" />
              </View>
            ) : (
              <Image
                source={{ 
                  uri: creator?.profileImage || story?.thumbnailUrl || 'https://via.placeholder.com/60' 
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            )}
          </View>
        </View>
        
        {/* Live Indicator */}
        {story?.contentType === 'story' && !hasViewed && (
          <View className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full items-center justify-center">
            <Text className="text-white text-xs font-bold">●</Text>
          </View>
        )}
        
        {/* Add Story Plus */}
        {isAddStory && (
          <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-full items-center justify-center">
            <Ionicons name="add" size={14} color="white" />
          </View>
        )}
      </View>
      
      <Text className="text-white text-xs mt-2 text-center" numberOfLines={1}>
        {isAddStory ? 'Your Story' : creator?.username || 'User'}
      </Text>
    </AnimatedPressable>
  );
};

interface StoryViewerProps {
  visible: boolean;
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  visible,
  stories,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { allUsers } = useUsersStore();
  const { markStoryAsViewed } = useContentStore();
  const { user } = useAuthStore();
  
  const progress = useSharedValue(0);
  const currentStory = stories[currentIndex];
  const creator = allUsers?.find(u => u.id === currentStory?.creatorId);
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  
  React.useEffect(() => {
    if (!currentStory) return;
    
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: (currentStory.duration * 1000) || 5000,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) {
        runOnJS(handleNext)();
      }
    });
    
    // Mark as viewed
    if (user) {
      markStoryAsViewed(currentStory.id, user.id);
    }
  }, [currentIndex, currentStory]);
  
  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  const handlePause = () => {
    progress.value = withTiming(progress.value, { duration: 0 });
  };
  
  const handleResume = () => {
    const remaining = 1 - progress.value;
    const duration = remaining * ((currentStory?.duration * 1000) || 5000);
    progress.value = withTiming(1, {
      duration,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) {
        runOnJS(handleNext)();
      }
    });
  };
  
  if (!currentStory) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {/* Progress Bars */}
        <View className="absolute top-12 left-4 right-4 z-10 flex-row">
          {stories.map((_, index) => (
            <View
              key={index}
              className="flex-1 h-0.5 bg-white/30 mx-0.5 rounded-full overflow-hidden"
            >
              {index === currentIndex && (
                <Animated.View
                  style={progressStyle}
                  className="h-full bg-white"
                />
              )}
              {index < currentIndex && (
                <View className="w-full h-full bg-white" />
              )}
            </View>
          ))}
        </View>
        
        {/* Header */}
        <View className="absolute top-16 left-4 right-4 z-10 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Image
              source={{ uri: creator?.profileImage || 'https://via.placeholder.com/32' }}
              className="w-8 h-8 rounded-full mr-3"
            />
            <View className="flex-1">
              <Text className="text-white font-semibold">{creator?.username}</Text>
              <Text className="text-white/70 text-xs">2h ago</Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <Pressable className="p-2">
              <Ionicons name="ellipsis-horizontal" size={20} color="white" />
            </Pressable>
            <Pressable onPress={onClose} className="p-2">
              <Ionicons name="close" size={20} color="white" />
            </Pressable>
          </View>
        </View>
        
        {/* Story Content */}
        <Pressable
          onPress={handleNext}
          onPressIn={handlePause}
          onPressOut={handleResume}
          className="flex-1"
        >
          <Image
            source={{ 
              uri: currentStory.thumbnailUrl || currentStory.fileUrl || 'https://picsum.photos/400/800?random=' + currentStory.id 
            }}
            className="w-full h-full"
            resizeMode="cover"
          />
          
          {/* Gradient Overlay */}
          <View className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        </Pressable>
        
        {/* Navigation Areas */}
        <Pressable
          onPress={handlePrevious}
          className="absolute left-0 top-0 bottom-0 w-1/3"
        />
        <Pressable
          onPress={handleNext}
          className="absolute right-0 top-0 bottom-0 w-1/3"
        />
        
        {/* Story Text/Title */}
        {currentStory.title && (
          <View className="absolute bottom-20 left-4 right-4">
            <Text className="text-white text-lg font-semibold">
              {currentStory.title}
            </Text>
            {currentStory.description && (
              <Text className="text-white/90 text-sm mt-1">
                {currentStory.description}
              </Text>
            )}
          </View>
        )}
        
        {/* Action Buttons */}
        <View className="absolute bottom-4 left-4 right-4 flex-row items-center">
          <View className="flex-1 bg-black/20 rounded-full px-4 py-2">
            <Text className="text-white/70 text-sm">Reply to story...</Text>
          </View>
          <Pressable className="ml-3 p-2">
            <Ionicons name="heart-outline" size={24} color="white" />
          </Pressable>
          <Pressable className="p-2">
            <Ionicons name="paper-plane-outline" size={24} color="white" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

interface StoriesBarProps {
  onAddStoryPress?: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ onAddStoryPress }) => {
  const { getActiveStories } = useContentStore();
  const { allUsers } = useUsersStore();
  const { user } = useAuthStore();
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  
  const activeStories = getActiveStories();
  
  // Group stories by creator
  const storiesByCreator = activeStories.reduce((acc, story) => {
    if (!acc[story.creatorId]) {
      acc[story.creatorId] = [];
    }
    acc[story.creatorId].push(story);
    return acc;
  }, {} as Record<string, Story[]>);
  
  const creators = Object.keys(storiesByCreator);
  
  const handleStoryPress = (creatorId: string) => {
    const creatorStories = storiesByCreator[creatorId];
    if (creatorStories && creatorStories.length > 0) {
      setSelectedStoryIndex(0);
      setShowStoryViewer(true);
    }
  };
  
  if (creators.length === 0 && !user) {
    return null;
  }
  
  return (
    <View className="py-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {/* Add Story Button */}
        {user && (
          <StoryCircle
            isAddStory
            onPress={onAddStoryPress || (() => console.log('Add story'))}
            index={0}
          />
        )}
        
        {/* Creator Stories */}
        {creators.map((creatorId, index) => {
          const creator = allUsers?.find(u => u.id === creatorId);
          const creatorStories = storiesByCreator[creatorId];
          const latestStory = creatorStories[0];
          
          return (
            <StoryCircle
              key={creatorId}
              story={latestStory}
              creator={creator}
              onPress={() => handleStoryPress(creatorId)}
              index={index + 1}
            />
          );
        })}
      </ScrollView>
      
      {/* Story Viewer */}
      {showStoryViewer && (
        <StoryViewer
          visible={showStoryViewer}
          stories={activeStories}
          initialIndex={selectedStoryIndex}
          onClose={() => setShowStoryViewer(false)}
        />
      )}
    </View>
  );
};

export default StoriesBar;