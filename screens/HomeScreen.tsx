import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMusicStore } from '../state/music';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { useMessagesStore } from '../state/messages';
import { useCollaborationStore } from '../state/collaboration';
import { useNotificationsStore } from '../state/notifications';
import { useContentStore } from '../state/content';
import { useNavigation } from '@react-navigation/native';
import { supabaseDatabase } from '../api/supabaseDatabase';
import TrackCard from '../components/TrackCard';
import AudioPlayer from '../components/AudioPlayer';
import StoriesBar from '../components/StoriesBar';
import Animated, { FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const { tracks, currentTrack, syncFromDatabase, clearAllData } = useMusicStore();
  const { user } = useAuthStore();
  const { getUnreadCount } = useNotificationsStore();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const unreadNotifications = user ? getUnreadCount(user.id) : 0;

  // Load content from Supabase on app start
  useEffect(() => {
    const loadContent = async () => {
      if (user) {
        console.log('🔄 Checking for content in Supabase...');
        setLoading(true);
        try {
          await syncFromDatabase();
          console.log(`✅ Database check complete - found ${tracks.length} tracks`);
        } catch (error) {
          console.error('❌ Failed to load content:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadContent();
  }, [user]);

  // Manual refresh function
  const handleRefresh = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔄 Manually refreshing content...');
      await syncFromDatabase();
      Alert.alert('✅ Database Refreshed', tracks.length > 0 ? `Found ${tracks.length} tracks in Supabase` : 'Database is empty - ready for new uploads!');
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('❌ Refresh Failed', 'Could not load content from Supabase');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter tracks based on search query
  const filteredTracks = searchQuery.trim() 
    ? tracks.filter(track => 
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tracks;
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-800">
          {!showSearch ? (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Pressable 
                  className="p-1 mr-3"
                  onPress={() => setShowSideMenu(true)}
                >
                  <Ionicons name="menu" size={24} color="white" />
                </Pressable>
                <Text className="text-2xl font-bold text-white">Audifyx</Text>
              </View>
              <View className="flex-row items-center space-x-4">
                {user?.email === 'audifyx@gmail.com' && (
                  <View className="flex-row space-x-3">
                    <Pressable 
                      onPress={handleRefresh}
                      disabled={loading}
                      className={loading ? 'opacity-50' : ''}
                    >
                      <Ionicons name={loading ? "hourglass" : "refresh-outline"} size={24} color="#A855F7" />
                    </Pressable>
                    <Pressable 
                      onPress={() => {
                        Alert.alert(
                          '🧹 Clear Local Cache',
                          'Clear all locally cached tracks and playlists? This won\'t affect the database.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Clear Cache',
                              style: 'destructive',
                              onPress: () => {
                                clearAllData();
                                Alert.alert('✅ Cache Cleared', 'All local data has been cleared');
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    </Pressable>
                  </View>
                )}
                <Pressable onPress={() => setShowSearch(true)}>
                  <Ionicons name="search-outline" size={24} color="white" />
                </Pressable>
                <Pressable 
                  onPress={() => navigation.navigate('Notifications' as never)}
                  className="relative"
                >
                  <Ionicons name="notifications-outline" size={24} color="white" />
                  {unreadNotifications > 0 && (
                    <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center">
                      <Text className="text-white text-xs font-bold">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </Text>
                    </View>
                  )}
                </Pressable>
                <Pressable onPress={() => navigation.navigate('Messages' as never)}>
                  <Ionicons name="chatbubble-outline" size={24} color="white" />
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="flex-row items-center space-x-3">
              <Pressable onPress={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}>
                <Ionicons name="chevron-back" size={24} color="white" />
              </Pressable>
              <View className="flex-1 bg-gray-900 rounded-xl px-4 py-2">
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search tracks and artists..."
                  placeholderTextColor="#6B7280"
                  className="text-white text-base"
                  autoFocus
                />
              </View>
            </View>
          )}
        </View>
        
        {/* Audio Feed Header */}
        {tracks.length > 0 && (
          <View className="px-4 py-3 border-b border-gray-800">
            <Text className="text-white text-lg font-semibold">
              {searchQuery ? 'Search Results' : 'Latest Tracks'}
            </Text>
            <Text className="text-gray-400 text-sm">
              {searchQuery 
                ? `${filteredTracks.length} of ${tracks.length} tracks found`
                : `${tracks.length} songs available`
              }
            </Text>
          </View>
        )}
        
        {/* Admin Debug Section - Only for audifyx@gmail.com */}
        {user?.email === 'audifyx@gmail.com' && (
          <View className="px-4 py-2 bg-gray-900 border-b border-gray-700">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-sm font-medium">
                  🔧 Admin Panel: {tracks.length} tracks in database
                </Text>
                <Text className="text-gray-400 text-xs">
                  {loading ? '🔄 Checking Supabase database...' : 
                   tracks.length > 0 ? '✅ Database content loaded' : 
                   '🆕 Database is empty - ready for uploads!'}
                </Text>
                <Text className="text-purple-400 text-xs">
                  👑 Admin: {user.username} ({user.email})
                </Text>
              </View>
              {tracks.length > 0 && (
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      '🗑️ Admin: Delete All Tracks',
                      `⚠️ ADMIN ACTION: Delete all ${tracks.length} tracks from Supabase database?\n\nThis will:\n• Remove from songs table\n• Delete audio files from storage\n• Remove from all devices\n• Cannot be undone`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete All from Database',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              console.log('🗑️ ADMIN: Bulk deleting all tracks from database...');
                              const { deleteTrack } = useMusicStore.getState();
                              
                              // Delete all tracks one by one from database
                              for (const track of tracks) {
                                console.log(`Deleting from database: ${track.title}`);
                                await deleteTrack(track.id);
                              }
                              
                              Alert.alert(
                                '✅ Admin: Database Cleaned', 
                                `Successfully removed all ${tracks.length} tracks from Supabase database and storage`
                              );
                            } catch (error) {
                              console.error('Admin bulk delete failed:', error);
                              Alert.alert('❌ Admin Error', 'Could not delete all tracks from database');
                            }
                          }
                        }
                      ]
                    );
                  }}
                  className="bg-red-600 rounded-lg px-3 py-1"
                >
                  <Text className="text-white text-xs font-medium">🗑️ Delete All</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
        
        {/* Stories Bar */}
        <StoriesBar 
          onAddStoryPress={() => {
            Alert.alert('Add Story', 'Story creation coming soon!');
          }}
        />
        
        {/* Audio Feed */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="pb-32">
            {filteredTracks.length > 0 ? (
              filteredTracks.map((track, index) => (
                <Animated.View 
                  key={track.id}
                  entering={FadeInUp.delay(index * 100)}
                >
                  <TrackCard track={track} />
                </Animated.View>
              ))
            ) : searchQuery ? (
              <View className="items-center justify-center py-20 px-6">
                <Ionicons name="search-outline" size={80} color="#6B7280" />
                <Text className="text-white text-xl font-semibold mt-6 text-center">
                  No Results Found
                </Text>
                <Text className="text-gray-400 text-center mt-2 leading-6">
                  Try searching for different track titles or artist names
                </Text>
                <AnimatedPressable
                  entering={FadeInUp.delay(400)}
                  onPress={() => setSearchQuery('')}
                  className="bg-purple-600 rounded-xl px-6 py-3 mt-6"
                >
                  <Text className="text-white font-semibold">Clear Search</Text>
                </AnimatedPressable>
              </View>
            ) : (
              <View className="items-center justify-center py-20 px-6">
                <Ionicons name="musical-notes-outline" size={80} color="#6B7280" />
                <Text className="text-white text-xl font-semibold mt-6 text-center">
                  {user ? 'Ready to Create!' : 'Welcome to Audifyx!'}
                </Text>
                <Text className="text-gray-400 text-center mt-2 leading-6">
                  {user ? 
                    'Database is clean and ready for new content. Upload your first track to get started!' :
                    'Sign in to upload tracks and build your music library.'
                  }
                </Text>
                
                {user ? (
                  <View className="space-y-3 mt-6">
                    <AnimatedPressable 
                      entering={FadeInUp.delay(400)}
                      onPress={() => navigation.navigate('Upload' as never)}
                      className="bg-purple-600 rounded-xl px-6 py-3"
                    >
                      <Text className="text-white font-semibold">Upload Your First Track</Text>
                    </AnimatedPressable>
                    
                    <AnimatedPressable 
                      entering={FadeInUp.delay(500)}
                      onPress={handleRefresh}
                      disabled={loading}
                      className={`bg-gray-700 rounded-xl px-6 py-3 ${loading ? 'opacity-50' : ''}`}
                    >
                      <Text className="text-white font-semibold">
                        {loading ? 'Checking Database...' : 'Refresh from Database'}
                      </Text>
                    </AnimatedPressable>
                  </View>
                ) : (
                  <AnimatedPressable 
                    entering={FadeInUp.delay(400)}
                    onPress={() => navigation.navigate('Upload' as never)}
                    className="bg-purple-600 rounded-xl px-6 py-3 mt-6"
                  >
                    <Text className="text-white font-semibold">Upload Your First Track</Text>
                  </AnimatedPressable>
                )}
                
                {/* Audio Help Card */}
                <Animated.View 
                  entering={FadeInUp.delay(500)}
                  className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 mt-4 w-full max-w-sm"
                >
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text className="text-white font-medium ml-2">Audio Upload Tips</Text>
                  </View>
                  <Text className="text-gray-400 text-sm leading-5">
                    • Upload audio files directly (MP3, WAV, M4A){'\n'}
                    • Files upload to Supabase Storage 🗄️{'\n'}
                    • Generate AI cover art with DALL-E 3{'\n'}
                    • Cross-device sync with cloud database{'\n'}
                    • Clean slate - ready for your music!
                  </Text>
                </Animated.View>
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Fixed Audio Player */}
        {currentTrack && <AudioPlayer />}
        
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
                  {/* Library */}
                  <Pressable
                    onPress={() => {
                      setShowSideMenu(false);
                      navigation.navigate('Library' as never);
                    }}
                    className="flex-row items-center px-6 py-4 border-b border-gray-800/30"
                  >
                    <View className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center mr-4">
                      <Ionicons name="library" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-lg">Your Library</Text>
                      <Text className="text-gray-400 text-sm">Playlists, downloads & liked songs</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </Pressable>

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

        {/* Floating Upload Button */}
        <AnimatedPressable
          entering={FadeInUp.delay(500)}
          onPress={() => navigation.navigate('Upload' as never)}
          className="absolute bottom-24 right-4 w-14 h-14 bg-purple-600 rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: '#A855F7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={28} color="white" />
        </AnimatedPressable>

        {/* Fixed Audio Player */}
        {currentTrack && <AudioPlayer />}
      </View>
    </SafeAreaView>
  );
}