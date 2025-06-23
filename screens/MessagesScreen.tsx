import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image, Modal, SectionList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMessagesStore } from '../state/messages';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { useMusicStore } from '../state/music';
import { supabaseDatabase } from '../api/supabaseDatabase';
import { supabaseStorage } from '../services/supabaseStorage';
import { getSupabaseStatus } from '../config/supabase';
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function MessagesScreen() {
  const navigation = useNavigation();
  const { conversations, getUnreadCount, createConversation } = useMessagesStore();
  const { user } = useAuthStore();
  const { allUsers, followUser, unfollowUser, isFollowing, addUser } = useUsersStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'contacts'>('messages');
  const [showSideMenu, setShowSideMenu] = useState(false);
  
  // Enhanced debug logging
  console.log('=== MESSAGES SCREEN DEBUG ===');
  console.log('Current user ID:', user?.id);
  console.log('Current user:', user?.username, user?.email);
  console.log('All users count:', allUsers.length);
  console.log('All users detailed:', allUsers.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    isVerified: u.isVerified
  })));
  
  // Show all conversations for debugging
  console.log('Conversations:', conversations.length);
  conversations.forEach((conv, index) => {
    console.log(`Conversation ${index}:`, {
      id: conv.id,
      participants: conv.participants,
      lastMessage: conv.lastMessage?.text,
      unreadCount: conv.unreadCount
    });
  });
  
  const otherUsers = allUsers.filter(u => u.id !== user?.id);
  console.log('Other users (excluding current):', otherUsers.length);
  console.log('Other users list:', otherUsers.map(u => u.username));
  console.log('=== END DEBUG ===');
  
  // Data is automatically synced by the authentication system
  // No manual loading needed - everything happens automatically on login!

  // Ensure current user is in the global users store and fix conversation participant IDs
  useEffect(() => {
    console.log('useEffect: Checking if current user is in store');
    console.log('Current user:', user?.username);
    console.log('Users in store:', allUsers.map(u => u.username));
    
    if (user && !allUsers.find(u => u.id === user.id)) {
      console.log('Current user NOT found in store, adding...');
      addUser(user);
    } else {
      console.log('Current user already in store or no user logged in');
    }
    
    // Fix conversations with placeholder participant IDs
    if (user) {
      const { conversations: currentConversations } = useMessagesStore.getState();
      const needsUpdate = currentConversations.some(conv => 
        conv.participants.includes('current-user-placeholder')
      );
      
      if (needsUpdate) {
        console.log('Fixing conversation participant IDs...');
        const updatedConversations = currentConversations.map(conv => ({
          ...conv,
          participants: conv.participants.map(participantId => 
            participantId === 'current-user-placeholder' ? user.id : participantId
          )
        }));
        
        // Update the messages store
        useMessagesStore.setState(state => ({
          ...state,
          conversations: updatedConversations
        }));
        
        console.log('Conversation participant IDs updated');
      }
    }
  }, [user, allUsers, addUser]);
  const filteredUsers = otherUsers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const formatLastMessageTime = (date: Date) => {
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
  
  const getOtherParticipant = (participants: string[]) => {
    const otherId = participants.find(id => id !== user?.id);
    return allUsers.find(u => u.id === otherId);
  };
  
  const handleStartConversation = (otherUserId: string) => {
    if (!user) return;
    
    const conversationId = createConversation([user.id, otherUserId]);
    setShowNewMessageModal(false);
    
    (navigation as any).navigate('Chat', { 
      conversationId, 
      otherUserId 
    });
  };

  const handleFollowUser = (otherUserId: string) => {
    if (!user) return;
    
    if (isFollowing(otherUserId, user.id)) {
      unfollowUser(otherUserId, user.id);
    } else {
      followUser(otherUserId, user.id);
    }
  };

  const handleViewProfile = (otherUser: any) => {
    (navigation as any).navigate('UserProfile', { userId: otherUser.id });
  };

  // Add real user to database through signup flow
  const promptSignUp = () => {
    Alert.alert(
      'Add Users',
      'Users are added when they sign up for the app. Real users will appear here when they create accounts.',
      [
        { text: 'OK' }
      ]
    );
  };

  // Upload real tracks through the upload screen
  const promptUpload = () => {
    Alert.alert(
      'Add Music',
      'Tracks are added through the Upload tab. Real users can upload their music there.',
      [
        { text: 'OK' }
      ]
    );
  };

  // Platform integration works through upload screen
  const explainPlatforms = () => {
    Alert.alert(
      'Platform Integration',
      'Users can connect their SoundCloud, YouTube, and Spotify accounts through the Upload tab to import tracks.',
      [
        { text: 'OK' }
      ]
    );
  };

  // Admin-only debug function to show current store state and database sync
  const showStoreState = async () => {
    // Only allow admin access
    if (user?.email !== 'audifyx@gmail.com') {
      Alert.alert('Access Denied', 'Debug tools are only available for admin accounts');
      return;
    }
    
    try {
      // Get comprehensive database status
      const [dbUsers] = await Promise.all([
        supabaseDatabase.getAllUsers()
      ]);
      
      const supabaseStatus = getSupabaseStatus();
      
      Alert.alert(
        'System Status 🔧',
        `🚀 SUPABASE DATABASE\n` +
        `Status: ${supabaseStatus.configured ? '✅ Connected' : '❌ Disconnected'}\n` +
        `Mode: ${supabaseStatus.configured ? 'Cloud Production' : 'Setup Required'}\n` +
        `Users in DB: ${dbUsers.length}\n` +
        `URL: ${supabaseStatus.url}\n\n` +
        `☁️ SUPABASE STORAGE\n` +
        `Status: ${supabaseStorage.isConfigured() ? '✅ Ready' : '❌ Setup Needed'}\n` +
        `Buckets: ${supabaseStorage.isConfigured() ? 'audio-files, images' : 'None'}\n\n` +
        `📱 LOCAL STORE\n` +
        `Users: ${allUsers.length}\n` +
        `Current User: ${user?.username || 'None'}\n\n` +
        `Recent Users:\n${dbUsers.slice(0, 3).map(u => `• ${u.username}`).join('\n')}${dbUsers.length > 3 ? `\n...and ${dbUsers.length - 3} more` : ''}`,
        [
          { text: 'Cancel' },
          { 
            text: 'Force Supabase Sync', 
            onPress: async () => {
              try {
                console.log('Force syncing from Supabase database...');
                const [allDbUsers, allDbTracks, allDbPlaylists] = await Promise.all([
                  supabaseDatabase.getAllUsers(),
                  supabaseDatabase.getAllTracks(),
                  supabaseDatabase.getAllPlaylists()
                ]);
                
                // Sync all data types
                const localUsers = allDbUsers.map(dbUser => ({
                  id: dbUser.id,
                  username: dbUser.username,
                  email: dbUser.email,
                  profileImage: dbUser.avatar_url,
                  bio: dbUser.bio || '',
                  location: dbUser.studio_name || '',
                  website: '',
                  links: [],
                  followers: dbUser.followers_count,
                  following: dbUser.following_count,
                  isVerified: dbUser.has_beta_access || false,
                  paypalLink: '',
                  cashAppLink: ''
                }));
                
                useUsersStore.getState().syncFromDatabase(localUsers);
                useMusicStore.getState().syncFromDatabase();
                if (user) {
                  useMessagesStore.getState().syncFromDatabase(user.id);
                }
                
                Alert.alert(
                  'Supabase Sync Complete! 🚀',
                  `Synced from Supabase database:\n` +
                  `• ${allDbUsers.length} users\n` +
                  `• ${allDbTracks.length} tracks\n` +
                  `• ${allDbPlaylists.length} playlists\n\n` +
                  `Your app now has the latest data from all devices!`
                );
              } catch (error) {
                console.error('Supabase sync failed:', error);
                Alert.alert('Sync Failed', 'Could not sync from Supabase database');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to get debug info:', error);
      Alert.alert('Error', 'Failed to get debug information');
    }
  };

  const groupUsersByAlphabet = (users: any[]) => {
    const grouped = users.reduce((acc, user) => {
      const firstLetter = user.username[0].toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(user);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.keys(grouped)
      .sort()
      .map(letter => ({
        title: letter,
        data: grouped[letter].sort((a: any, b: any) => a.username.localeCompare(b.username))
      }));
  };

  const contactSections = groupUsersByAlphabet(
    otherUsers.filter(u => 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  const hasExistingConversation = (otherUserId: string) => {
    if (!user) return false;
    return conversations.some(conv => 
      conv.participants.includes(user.id) && conv.participants.includes(otherUserId)
    );
  };
  
  const navigateToChat = (conversation: any) => {
    const otherUser = getOtherParticipant(conversation.participants);
    if (otherUser) {
      (navigation as any).navigate('Chat', { 
        conversationId: conversation.id, 
        otherUserId: otherUser.id 
      });
    }
  };
  
  const renderMessagesTab = () => (
    <>
      {/* Users Stories Section */}
      {(otherUsers.length > 0 || user) && (
        <View className="py-4 border-b border-gray-800">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            {/* Current User "Your Story" */}
            {user && (
              <AnimatedPressable
                entering={FadeInUp.delay(50)}
                onPress={() => setShowNewMessageModal(true)}
                className="mr-4 items-center"
              >
                <View className="relative">
                  <View className="w-16 h-16 rounded-full border-2 border-gray-600 p-0.5">
                    <View className="w-full h-full bg-purple-600 rounded-full items-center justify-center relative">
                      {user.profileImage ? (
                        <Image
                          source={{ uri: user.profileImage }}
                          className="w-full h-full rounded-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Text className="text-white text-lg font-bold">
                          {user.username[0]?.toUpperCase()}
                        </Text>
                      )}
                      
                      {/* Plus icon overlay */}
                      <View className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-black items-center justify-center">
                        <Ionicons name="add" size={10} color="white" />
                      </View>
                    </View>
                  </View>
                </View>
                
                <Text className="text-white text-xs mt-2 text-center w-16" numberOfLines={1}>
                  Your Story
                </Text>
              </AnimatedPressable>
            )}
            
            {otherUsers.map((otherUser, index) => (
              <AnimatedPressable
                key={otherUser.id}
                entering={FadeInUp.delay((index + 1) * 100)}
                onPress={() => handleStartConversation(otherUser.id)}
                className="mr-4 items-center"
              >
                <View className="relative">
                  {/* Gradient border ring */}
                  <View className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 p-0.5">
                    <View className="w-full h-full bg-black rounded-full p-0.5">
                      <View className="w-full h-full bg-purple-600 rounded-full items-center justify-center">
                        {otherUser.profileImage ? (
                          <Image
                            source={{ uri: otherUser.profileImage }}
                            className="w-full h-full rounded-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="text-white text-lg font-bold">
                            {otherUser.username[0]?.toUpperCase()}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  
                  {/* Status indicators */}
                  <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                  
                  {/* Chat indicator if conversation exists */}
                  {hasExistingConversation(otherUser.id) && (
                    <View className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-black items-center justify-center">
                      <Ionicons name="chatbubble" size={8} color="white" />
                    </View>
                  )}
                </View>
                
                <Text className="text-white text-xs mt-2 text-center w-16" numberOfLines={1}>
                  {otherUser.username}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Messages List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {conversations.length > 0 && (
          <View className="px-4 py-3">
            <Text className="text-white font-semibold text-lg">Messages</Text>
          </View>
        )}
        
        {conversations.length > 0 ? (
          conversations.map((conversation, index) => {
            const otherUser = getOtherParticipant(conversation.participants);
            if (!otherUser) return null;
            
            return (
              <AnimatedPressable
                key={conversation.id}
                entering={FadeInUp.delay(index * 50)}
                onPress={() => navigateToChat(conversation)}
                className="flex-row items-center px-4 py-3 border-b border-gray-800/50"
              >
                {/* Profile Picture */}
                <View className="relative">
                  <View className="w-14 h-14 bg-purple-600 rounded-full items-center justify-center mr-3">
                    {otherUser.profileImage ? (
                      <Image
                        source={{ uri: otherUser.profileImage }}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <Text className="text-white text-lg font-bold">
                        {otherUser.username[0]?.toUpperCase()}
                      </Text>
                    )}
                  </View>
                  
                  {/* Online status dot */}
                  <View className="absolute bottom-0 right-3 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                </View>
                
                {/* Message Content */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-white font-semibold text-base">
                      {otherUser.username}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-gray-400 text-sm">
                        {conversation.lastMessage && formatLastMessageTime(conversation.lastActivity)}
                      </Text>
                      {conversation.unreadCount > 0 && (
                        <View className="bg-purple-600 rounded-full w-5 h-5 items-center justify-center ml-2">
                          <Text className="text-white text-xs font-bold">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View className="flex-row items-center">
                    {conversation.lastMessage && (
                      <>
                        {conversation.lastMessage.senderId === user?.id && (
                          <Text className="text-gray-400 text-sm mr-1">You: </Text>
                        )}
                        <Text 
                          className={`text-sm flex-1 ${
                            conversation.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400'
                          }`} 
                          numberOfLines={1}
                        >
                          {conversation.lastMessage.type === 'audio' 
                            ? '🎵 Audio message' 
                            : conversation.lastMessage.type === 'image'
                            ? '📷 Photo'
                            : conversation.lastMessage.text
                          }
                        </Text>
                      </>
                    )}
                    
                    {conversation.isTyping && conversation.isTyping !== user?.id && (
                      <Text className="text-purple-400 text-sm">typing...</Text>
                    )}
                  </View>
                </View>
                
                {/* Camera Icon */}
                <Pressable className="ml-3">
                  <Ionicons name="camera-outline" size={24} color="#6B7280" />
                </Pressable>
              </AnimatedPressable>
            );
          })
        ) : (
          <View className="items-center justify-center py-20 px-6">
            <Ionicons name="chatbubbles-outline" size={80} color="#6B7280" />
            <Text className="text-white text-xl font-semibold mt-6 text-center">
              Your Messages
            </Text>
            <Text className="text-gray-400 text-center mt-2 leading-6">
              {otherUsers.length > 0 
                ? "Tap on any user above to start a conversation, or message someone new"
                : "No other users have joined yet. Invite friends to Audifyx to start messaging!"
              }
            </Text>
            <View className="flex-row space-x-3">
              <AnimatedPressable
                entering={FadeInUp.delay(400)}
                onPress={() => setShowNewMessageModal(true)}
                className="bg-purple-600 rounded-xl px-6 py-3 mt-6 flex-1"
              >
                <Text className="text-white font-semibold text-center">
                  {otherUsers.length > 0 ? "Message Someone" : "Browse Users"}
                </Text>
              </AnimatedPressable>
              
              {otherUsers.length === 0 && (
                <AnimatedPressable
                  entering={FadeInUp.delay(500)}
                  onPress={promptSignUp}
                  className="bg-blue-600 rounded-xl px-6 py-3 mt-6"
                >
                  <Text className="text-white font-semibold">
                    How to Add Users
                  </Text>
                </AnimatedPressable>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );

  const renderContactsTab = () => (
    <View className="flex-1">
      {contactSections.length > 0 ? (
        <SectionList
          sections={contactSections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-black/90 px-4 py-2">
              <Text className="text-gray-400 font-semibold text-sm tracking-wider">
                {title}
              </Text>
            </View>
          )}
          renderItem={({ item: otherUser, index }) => (
            <AnimatedPressable
              entering={FadeInUp.delay(index * 30)}
              onPress={() => handleViewProfile(otherUser)}
              className="flex-row items-center px-4 py-3 bg-black"
            >
              {/* Profile Picture */}
              <View className="w-12 h-12 bg-purple-600 rounded-full items-center justify-center mr-3">
                {otherUser.profileImage ? (
                  <Image
                    source={{ uri: otherUser.profileImage }}
                    className="w-full h-full rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-white text-base font-bold">
                    {otherUser.username[0]?.toUpperCase()}
                  </Text>
                )}
              </View>
              
              {/* Contact Info */}
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-white font-medium text-base">
                    {otherUser.username}
                  </Text>
                  {otherUser.isVerified && (
                    <Ionicons name="checkmark-circle" size={14} color="#3B82F6" className="ml-1" />
                  )}
                </View>
                {otherUser.bio && (
                  <Text className="text-gray-400 text-sm mt-0.5" numberOfLines={1}>
                    {otherUser.bio}
                  </Text>
                )}
              </View>
              
              {/* Action Buttons */}
              <View className="flex-row items-center space-x-2">
                {/* Follow/Unfollow Button */}
                <Pressable
                  onPress={() => handleFollowUser(otherUser.id)}
                  className={`px-4 py-2 rounded-full ${
                    isFollowing(otherUser.id, user?.id || '') 
                      ? 'bg-gray-700 border border-gray-600' 
                      : 'bg-purple-600'
                  }`}
                >
                  <Text className="text-white text-sm font-medium">
                    {isFollowing(otherUser.id, user?.id || '') ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
                
                {/* Message Button */}
                <Pressable
                  onPress={() => handleStartConversation(otherUser.id)}
                  className="w-9 h-9 bg-gray-800 rounded-full items-center justify-center"
                >
                  <Ionicons name="chatbubble-outline" size={18} color="white" />
                </Pressable>
              </View>
            </AnimatedPressable>
          )}
          ItemSeparatorComponent={() => (
            <View className="ml-16 mr-4 h-px bg-gray-800" />
          )}
        />
      ) : (
        <View className="items-center justify-center flex-1 px-6">
          <Ionicons name="people-outline" size={80} color="#6B7280" />
          <Text className="text-white text-xl font-semibold mt-6 text-center">
            {searchQuery ? 'No contacts found' : 'No contacts yet'}
          </Text>
          <Text className="text-gray-400 text-center mt-2 leading-6">
            {searchQuery 
              ? 'Try a different search term' 
              : 'When people join Audifyx, they will appear here'
            }
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Pressable 
            className="p-1" 
            onPress={() => setShowSideMenu(true)}
          >
            <Ionicons name="menu" size={24} color="white" />
          </Pressable>
          
          <View className="flex-row items-center">
            <Text className="text-2xl font-bold text-white mr-2">{user?.username}</Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </View>
          
          <Pressable onPress={() => setShowNewMessageModal(true)}>
            <MaterialIcons name="edit" size={24} color="white" />
          </Pressable>
        </View>
        
        {/* Tab Bar */}
        <View className="flex-row bg-black border-b border-gray-800">
          <Pressable
            onPress={() => setActiveTab('messages')}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === 'messages' ? 'border-purple-500' : 'border-transparent'
            }`}
          >
            <Text className={`font-semibold ${
              activeTab === 'messages' ? 'text-white' : 'text-gray-400'
            }`}>
              Chats
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setActiveTab('contacts')}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === 'contacts' ? 'border-purple-500' : 'border-transparent'
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
        <View className="px-4 py-3 border-b border-gray-800">
          <View className="flex-row items-center bg-gray-900 rounded-xl px-3 py-2">
            <Ionicons name="search" size={16} color="#6B7280" />
            <TextInput
              placeholder={activeTab === 'messages' ? 'Search messages' : 'Search contacts'}
              placeholderTextColor="#6B7280"
              className="flex-1 ml-2 text-white text-base"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
        
        {/* Tab Content */}
        {activeTab === 'messages' ? renderMessagesTab() : renderContactsTab()}
        
        {/* Side Menu Modal */}
        <Modal
          visible={showSideMenu}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSideMenu(false)}
        >
          <View className="flex-1 bg-black/50 flex-row">
            {/* Side Menu Content */}
            <View className="w-80 bg-black border-r border-gray-800">
              <SafeAreaView className="flex-1">
                {/* Menu Header */}
                <View className="px-6 py-6 border-b border-gray-800">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-purple-600 rounded-full items-center justify-center mr-3">
                        {user?.profileImage ? (
                          <Image
                            source={{ uri: user.profileImage }}
                            className="w-full h-full rounded-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="text-white text-lg font-bold">
                            {user?.username[0]?.toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View>
                        <View className="flex-row items-center">
                          <Text className="text-white font-semibold text-lg">{user?.username}</Text>
                          {user?.isVerified && (
                            <Ionicons name="checkmark-circle" size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
                          )}
                        </View>
                        <Text className="text-gray-400 text-sm">{user?.email}</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => setShowSideMenu(false)}>
                      <Ionicons name="close" size={24} color="#6B7280" />
                    </Pressable>
                  </View>
                </View>

                {/* Menu Items */}
                <ScrollView className="flex-1 py-4">
                  {/* Call */}
                  <Pressable
                    onPress={() => {
                      setShowSideMenu(false);
                      navigation.navigate('Call' as never);
                    }}
                    className="flex-row items-center px-6 py-4 border-b border-gray-800/30"
                  >
                    <View className="w-10 h-10 bg-green-600 rounded-full items-center justify-center mr-4">
                      <Ionicons name="call" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-lg">Call</Text>
                      <Text className="text-gray-400 text-sm">Voice & video calls</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </Pressable>

                  {/* Prod Connect */}
                  <Pressable
                    onPress={() => {
                      setShowSideMenu(false);
                      navigation.navigate('ProdConnect' as never);
                    }}
                    className="flex-row items-center px-6 py-4 border-b border-gray-800/30"
                  >
                    <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center mr-4">
                      <Ionicons name="musical-notes" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-lg">Prod Connect</Text>
                      <Text className="text-gray-400 text-sm">Connect with producers</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </Pressable>

                  {/* Collaboration Hub */}
                  <Pressable
                    onPress={() => {
                      setShowSideMenu(false);
                      navigation.navigate('CollaborationHub' as never);
                    }}
                    className="flex-row items-center px-6 py-4 border-b border-gray-800/30"
                  >
                    <View className="w-10 h-10 bg-orange-600 rounded-full items-center justify-center mr-4">
                      <Ionicons name="people" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-lg">Collaboration Hub</Text>
                      <Text className="text-gray-400 text-sm">Find collaborators</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </Pressable>

                  {/* Store */}
                  <Pressable
                    onPress={() => {
                      setShowSideMenu(false);
                      navigation.navigate('Store' as never);
                    }}
                    className="flex-row items-center px-6 py-4 border-b border-gray-800/30"
                  >
                    <View className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center mr-4">
                      <Ionicons name="storefront" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-lg">Store</Text>
                      <Text className="text-gray-400 text-sm">Browse marketplace</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </Pressable>

                  {/* Divider */}
                  <View className="h-4" />

                  {/* Settings */}
                  <Pressable className="flex-row items-center px-6 py-4 border-b border-gray-800/30">
                    <View className="w-10 h-10 bg-gray-600 rounded-full items-center justify-center mr-4">
                      <Ionicons name="settings" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-lg">Settings</Text>
                      <Text className="text-gray-400 text-sm">App preferences</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </Pressable>

                  {/* Help & Support */}
                  <Pressable className="flex-row items-center px-6 py-4">
                    <View className="w-10 h-10 bg-gray-600 rounded-full items-center justify-center mr-4">
                      <Ionicons name="help-circle" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-lg">Help & Support</Text>
                      <Text className="text-gray-400 text-sm">Get help</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </Pressable>
                </ScrollView>

                {/* Footer */}
                <View className="px-6 py-4 border-t border-gray-800">
                  <Text className="text-gray-500 text-center text-sm">
                    Audifyx v1.0.0
                  </Text>
                </View>
              </SafeAreaView>
            </View>
            
            {/* Close area - tap outside to close */}
            <Pressable 
              className="flex-1" 
              onPress={() => setShowSideMenu(false)}
            />
          </View>
        </Modal>
        
        {/* New Message Modal */}
        <Modal
          visible={showNewMessageModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNewMessageModal(false)}
        >
          <View className="flex-1 bg-black/80">
            <SafeAreaView className="flex-1">
              <Animated.View 
                entering={FadeInDown}
                className="bg-black border-t border-gray-800 flex-1 mt-20"
              >
                {/* Modal Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
                  <Pressable onPress={() => setShowNewMessageModal(false)}>
                    <Text className="text-purple-400 text-base">Cancel</Text>
                  </Pressable>
                  <Text className="text-white text-lg font-semibold">New Message</Text>
                  <View className="w-12" />
                </View>
                
                {/* Search Users */}
                <View className="px-4 py-3 border-b border-gray-800">
                  <View className="flex-row items-center bg-gray-900 rounded-xl px-3 py-2">
                    <Text className="text-gray-400 text-base mr-2">To:</Text>
                    <TextInput
                      placeholder="Search users..."
                      placeholderTextColor="#6B7280"
                      className="flex-1 text-white text-base"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus
                    />
                  </View>
                </View>
                
                {/* Users List */}
                <ScrollView className="flex-1">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((otherUser, index) => (
                      <AnimatedPressable
                        key={otherUser.id}
                        entering={FadeInUp.delay(index * 50)}
                        onPress={() => handleStartConversation(otherUser.id)}
                        className="flex-row items-center px-4 py-3"
                      >
                        <View className="w-12 h-12 bg-purple-600 rounded-full items-center justify-center mr-3">
                          {otherUser.profileImage ? (
                            <Image
                              source={{ uri: otherUser.profileImage }}
                              className="w-full h-full rounded-full"
                            />
                          ) : (
                            <Text className="text-white text-base font-bold">
                              {otherUser.username[0]?.toUpperCase()}
                            </Text>
                          )}
                        </View>
                        
                        <View className="flex-1">
                          <Text className="text-white font-semibold">{otherUser.username}</Text>
                          <Text className="text-gray-400 text-sm">{otherUser.email}</Text>
                        </View>
                      </AnimatedPressable>
                    ))
                  ) : (
                    <View className="items-center justify-center py-20 px-6">
                      <Ionicons name="people-outline" size={64} color="#6B7280" />
                      <Text className="text-gray-400 text-lg mt-4 text-center">
                        {searchQuery ? 'No users found' : 'No other users yet'}
                      </Text>
                      <Text className="text-gray-500 text-center mt-2">
                        {searchQuery 
                          ? 'Try a different search term' 
                          : 'When people join Audifyx, they will appear here'
                        }
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </Animated.View>
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}