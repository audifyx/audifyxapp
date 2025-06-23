import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { useCallingStore } from '../state/calling';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CallScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { allUsers } = useUsersStore();
  const { callHistory, initializeCallService, startCall } = useCallingStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'contacts'>('recent');

  const otherUsers = allUsers.filter(u => u.id !== user?.id);
  const filteredUsers = otherUsers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize calling service when component mounts
  useEffect(() => {
    if (user?.id) {
      initializeCallService(user.id);
    }
  }, [user?.id]);

  const handleCall = async (userId: string, type: 'audio' | 'video') => {
    const targetUser = allUsers.find(u => u.id === userId);
    try {
      Alert.alert(
        `${type === 'video' ? 'Video' : 'Audio'} Call`,
        `Calling ${targetUser?.username}...`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: async () => {
            try {
              await startCall(userId, type);
              (navigation as any).navigate('VideoCall', { 
                otherUserId: userId, 
                callType: type 
              });
            } catch (error) {
              Alert.alert('Call Failed', 'Could not start the call. Please try again.');
            }
          }}
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate call');
    }
  };

  const formatCallTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderRecentTab = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {callHistory.length > 0 ? (
        <View className="px-4 py-2">
          {callHistory.map((call, index) => {
            const callUser = allUsers.find(u => u.id === call.userId);
            if (!callUser) return null;

            return (
              <AnimatedPressable
                key={call.id}
                entering={FadeInUp.delay(index * 100)}
                className="flex-row items-center py-4 border-b border-gray-800/50"
              >
                {/* Profile Picture */}
                <View className="relative">
                  <View className="w-12 h-12 bg-purple-600 rounded-full items-center justify-center mr-3">
                    {callUser.profileImage ? (
                      <Image
                        source={{ uri: callUser.profileImage }}
                        className="w-full h-full rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-white text-base font-bold">
                        {callUser.username[0]?.toUpperCase()}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Call Info */}
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-white font-semibold text-base mr-2">
                      {call.username || callUser.username}
                    </Text>
                    <Ionicons 
                      name={call.status === 'missed' ? 'call-outline' : 'call'} 
                      size={14} 
                      color={call.status === 'missed' ? '#EF4444' : '#10B981'} 
                    />
                  </View>
                  <View className="flex-row items-center mt-1">
                    <Ionicons 
                      name={call.callType === 'video' ? 'videocam' : 'call'} 
                      size={12} 
                      color="#6B7280" 
                    />
                    <Text className="text-gray-400 text-sm ml-1">
                      {call.status === 'missed' ? 'Missed' : call.duration || '0:00'} • {formatCallTime(call.timestamp)}
                    </Text>
                  </View>
                </View>

                {/* Call Actions */}
                <View className="flex-row space-x-2">
                  <Pressable
                    onPress={() => handleCall(callUser.id, 'audio')}
                    className="w-10 h-10 bg-green-600 rounded-full items-center justify-center"
                  >
                    <Ionicons name="call" size={18} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleCall(callUser.id, 'video')}
                    className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center"
                  >
                    <Ionicons name="videocam" size={18} color="white" />
                  </Pressable>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>
      ) : (
        <View className="items-center justify-center flex-1 px-6 py-20">
          <Ionicons name="call-outline" size={80} color="#6B7280" />
          <Text className="text-white text-xl font-semibold mt-6 text-center">
            No Recent Calls
          </Text>
          <Text className="text-gray-400 text-center mt-2 leading-6">
            Your call history will appear here. Make your first call from the Contacts tab!
          </Text>
          <Animated.View 
            entering={FadeInUp.delay(400)}
            className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 mt-6 w-full max-w-sm"
          >
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-white font-medium ml-2">Free Calling Features</Text>
            </View>
            <Text className="text-gray-400 text-sm leading-5">
              • High-quality audio calls 📞{"\n"}
              • Video calls with camera support 📹{"\n"}
              • Real-time connection via Supabase{"\n"}
              • Call history & missed call alerts{"\n"}
              • Works across all devices
            </Text>
          </Animated.View>
        </View>
      )}
    </ScrollView>
  );

  const renderContactsTab = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {filteredUsers.length > 0 ? (
        <View className="px-4 py-2">
          {filteredUsers.map((contact, index) => (
            <AnimatedPressable
              key={contact.id}
              entering={FadeInUp.delay(index * 50)}
              className="flex-row items-center py-4 border-b border-gray-800/50"
            >
              {/* Profile Picture */}
              <View className="w-12 h-12 bg-purple-600 rounded-full items-center justify-center mr-3">
                {contact.profileImage ? (
                  <Image
                    source={{ uri: contact.profileImage }}
                    className="w-full h-full rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-white text-base font-bold">
                    {contact.username[0]?.toUpperCase()}
                  </Text>
                )}
              </View>

              {/* Contact Info */}
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">
                  {contact.username}
                </Text>
                {contact.bio && (
                  <Text className="text-gray-400 text-sm mt-0.5" numberOfLines={1}>
                    {contact.bio}
                  </Text>
                )}
              </View>

              {/* Call Actions */}
              <View className="flex-row space-x-2">
                <Pressable
                  onPress={() => handleCall(contact.id, 'audio')}
                  className="w-10 h-10 bg-green-600 rounded-full items-center justify-center"
                >
                  <Ionicons name="call" size={18} color="white" />
                </Pressable>
                <Pressable
                  onPress={() => handleCall(contact.id, 'video')}
                  className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center"
                >
                  <Ionicons name="videocam" size={18} color="white" />
                </Pressable>
              </View>
            </AnimatedPressable>
          ))}
        </View>
      ) : (
        <View className="items-center justify-center flex-1 px-6 py-20">
          <Ionicons name="people-outline" size={80} color="#6B7280" />
          <Text className="text-white text-xl font-semibold mt-6 text-center">
            {searchQuery ? 'No contacts found' : 'No contacts available'}
          </Text>
          <Text className="text-gray-400 text-center mt-2 leading-6">
            {searchQuery 
              ? 'Try a different search term' 
              : 'When people join Audifyx, you can call them here'
            }
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          
          <Text className="text-lg font-semibold text-white">Call</Text>
          
          <Pressable>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </Pressable>
        </View>

        {/* Tab Bar */}
        <View className="flex-row bg-black border-b border-gray-800">
          <Pressable
            onPress={() => setActiveTab('recent')}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === 'recent' ? 'border-green-500' : 'border-transparent'
            }`}
          >
            <Text className={`font-semibold ${
              activeTab === 'recent' ? 'text-white' : 'text-gray-400'
            }`}>
              Recent
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setActiveTab('contacts')}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === 'contacts' ? 'border-green-500' : 'border-transparent'
            }`}
          >
            <Text className={`font-semibold ${
              activeTab === 'contacts' ? 'text-white' : 'text-gray-400'
            }`}>
              Contacts
            </Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        {activeTab === 'contacts' && (
          <View className="px-4 py-3 border-b border-gray-800">
            <View className="flex-row items-center bg-gray-900 rounded-xl px-3 py-2">
              <Ionicons name="search" size={16} color="#6B7280" />
              <TextInput
                placeholder="Search contacts"
                placeholderTextColor="#6B7280"
                className="flex-1 ml-2 text-white text-base"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        )}

        {/* Tab Content */}
        {activeTab === 'recent' ? renderRecentTab() : renderContactsTab()}
      </View>
    </SafeAreaView>
  );
}