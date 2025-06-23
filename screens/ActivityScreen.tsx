import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMusicStore } from '../state/music';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function ActivityScreen() {
  const { tracks } = useMusicStore();
  
  // Activity data - will be populated as users interact
  const activities: any[] = [];
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Ionicons name="heart" size={20} color="#EF4444" />;
      case 'play':
        return <Ionicons name="play" size={20} color="#10B981" />;
      case 'follow':
        return <Ionicons name="person-add" size={20} color="#3B82F6" />;
      default:
        return <Ionicons name="musical-note" size={20} color="#A855F7" />;
    }
  };
  
  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case 'like':
        return `${activity.user} liked your track "${activity.track?.title}"`;
      case 'play':
        return `${activity.user} played your track "${activity.track?.title}"`;
      case 'follow':
        return `${activity.user} started following you`;
      default:
        return `${activity.user} interacted with your content`;
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-800">
          <Text className="text-2xl font-bold text-white">Activity</Text>
          <Text className="text-gray-400 mt-1">Recent interactions with your music</Text>
        </View>
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            {activities.map((activity, index) => (
              <Animated.View
                key={activity.id}
                entering={FadeInUp.delay(index * 100)}
                className="flex-row items-center bg-gray-900 rounded-xl p-4 mb-3"
              >
                <View className="w-10 h-10 bg-gray-800 rounded-full items-center justify-center mr-3">
                  {getActivityIcon(activity.type)}
                </View>
                
                <View className="flex-1">
                  <Text className="text-white text-sm">
                    {getActivityText(activity)}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    {activity.timestamp}
                  </Text>
                </View>
                
                {activity.track && (
                  <Image
                    source={{ uri: activity.track.imageUrl || 'https://picsum.photos/100/100' }}
                    className="w-12 h-12 rounded-lg"
                  />
                )}
              </Animated.View>
            ))}
            
            {/* Empty state if no activities */}
            {activities.length === 0 && (
              <View className="items-center justify-center py-20">
                <Ionicons name="heart-outline" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-lg mt-4">No activity yet</Text>
                <Text className="text-gray-500 text-center mt-2">
                  When people interact with your music, you will see it here
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}