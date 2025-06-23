import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useMessagesStore } from '../state/messages';
import { useVoiceChatStore } from '../state/voiceChat';
import { useChatStore } from '../state/chat';

import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import SearchScreen from '../screens/SearchScreen';
import MessagesScreen from '../screens/MessagesScreen';
import VoiceChatScreen from '../screens/VoiceChatScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReelsScreen from '../screens/ReelsScreen';
import LiveStreamScreen from '../screens/LiveStreamScreen';
import CreateContentScreen from '../screens/CreateContentScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { getUnreadCount } = useMessagesStore();
  const { isConnected } = useVoiceChatStore();
  const { adminUnreadCount } = useChatStore();
  const unreadCount = getUnreadCount();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialIcons.glyphMap;
          let IconComponent = Ionicons;
          
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Discover':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Reels':
              iconName = focused ? 'film' : 'film-outline';
              break;
            case 'Live':
              iconName = focused ? 'radio' : 'radio-outline';
              break;
            case 'Create':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            case 'Voice':
              iconName = focused ? 'mic' : 'mic-outline';
              break;
            case 'Insights':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return (
            <View className="items-center justify-center relative">
              <IconComponent name={iconName as any} size={size} color={color} />
              
              {/* Messages unread indicator */}
              {route.name === 'Messages' && unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
              
              {/* Voice chat connected indicator */}
              {route.name === 'Voice' && isConnected && (
                <View className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-black" />
              )}
              
              {/* Settings support unread indicator */}
              {route.name === 'Settings' && adminUnreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-blue-500 rounded-full min-w-[16px] h-4 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
                  </Text>
                </View>
              )}
            </View>
          );
        },
        tabBarActiveTintColor: '#A855F7',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#1F2937',
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 6,
          height: 85,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Reels" component={ReelsScreen} />
      <Tab.Screen name="Create" component={CreateContentScreen} />
      <Tab.Screen name="Live" component={LiveStreamScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}