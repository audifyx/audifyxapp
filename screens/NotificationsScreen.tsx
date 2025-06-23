import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotificationsStore } from '../state/notifications';
import { useUsersStore } from '../state/users';
import { useMusicStore } from '../state/music';
import { useAuthStore } from '../state/auth';
import Animated, { FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { getUserNotifications, markAsRead, markAllAsRead } = useNotificationsStore();
  const { getUserById } = useUsersStore();
  const { tracks } = useMusicStore();
  
  const notifications = user ? getUserNotifications(user.id) : [];
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Ionicons name="heart" size={20} color="#EF4444" />;
      case 'comment':
        return <Ionicons name="chatbubble" size={20} color="#3B82F6" />;
      case 'follow':
        return <Ionicons name="person-add" size={20} color="#10B981" />;
      case 'share':
        return <Ionicons name="paper-plane" size={20} color="#8B5CF6" />;
      case 'message':
        return <Ionicons name="mail" size={20} color="#F59E0B" />;
      default:
        return <Ionicons name="notifications" size={20} color="#6B7280" />;
    }
  };
  
  const getNotificationText = (notification: any) => {
    const fromUser = getUserById(notification.fromUserId);
    const track = notification.trackId ? tracks.find(t => t.id === notification.trackId) : null;
    
    if (!fromUser) return 'Unknown user interacted with your content';
    
    switch (notification.type) {
      case 'like':
        return `${fromUser.username} liked your track "${track?.title || 'Unknown'}"`;
      case 'comment':
        return `${fromUser.username} commented on your track "${track?.title || 'Unknown'}"`;
      case 'follow':
        return `${fromUser.username} started following you`;
      case 'share':
        return `${fromUser.username} shared your track "${track?.title || 'Unknown'}"`;
      case 'message':
        return `${fromUser.username} sent you a message`;
      default:
        return `${fromUser.username} interacted with your content`;
    }
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  };
  
  const handleNotificationPress = (notification: any) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'follow':
        (navigation as any).navigate('UserProfile', { userId: notification.fromUserId });
        break;
      case 'message':
        // Navigate to chat
        break;
      case 'like':
      case 'comment':
      case 'share':
        // Could navigate to track detail or user profile
        break;
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          
          <Text className="text-lg font-semibold text-white">Notifications</Text>
          
          {notifications.length > 0 && (
            <Pressable onPress={() => user && markAllAsRead(user.id)}>
              <Text className="text-purple-400 text-sm">Mark all read</Text>
            </Pressable>
          )}
        </View>
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {notifications.length > 0 ? (
            <View className="p-4">
              {notifications.map((notification, index) => {
                const fromUser = getUserById(notification.fromUserId);
                
                return (
                  <AnimatedPressable
                    key={notification.id}
                    entering={FadeInUp.delay(index * 50)}
                    onPress={() => handleNotificationPress(notification)}
                    className={`flex-row items-center p-4 rounded-xl mb-3 ${
                      notification.isRead ? 'bg-gray-900' : 'bg-gray-800'
                    }`}
                  >
                    {/* User Avatar */}
                    <View className="w-12 h-12 bg-purple-600 rounded-full items-center justify-center mr-3">
                      {fromUser?.profileImage ? (
                        <Image
                          source={{ uri: fromUser.profileImage }}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <Text className="text-white text-sm font-bold">
                          {fromUser?.username?.[0]?.toUpperCase() || '?'}
                        </Text>
                      )}
                    </View>
                    
                    {/* Notification Content */}
                    <View className="flex-1">
                      <Text className={`text-sm ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
                        {getNotificationText(notification)}
                      </Text>
                      <Text className="text-gray-500 text-xs mt-1">
                        {formatTime(notification.timestamp)}
                      </Text>
                    </View>
                    
                    {/* Notification Icon */}
                    <View className="ml-3">
                      {getNotificationIcon(notification.type)}
                    </View>
                    
                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <View className="w-2 h-2 bg-purple-500 rounded-full ml-2" />
                    )}
                  </AnimatedPressable>
                );
              })}
            </View>
          ) : (
            <View className="items-center justify-center py-20 px-6">
              <Ionicons name="notifications-outline" size={80} color="#6B7280" />
              <Text className="text-white text-xl font-semibold mt-6 text-center">
                No Notifications
              </Text>
              <Text className="text-gray-400 text-center mt-2 leading-6">
                When people interact with your tracks or profile, you'll see notifications here
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}