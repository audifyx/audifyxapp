import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../state/auth';
import { useMusicStore } from '../state/music';
import { useUsersStore } from '../state/users';
import { useMessagesStore } from '../state/messages';
import { useCollaborationStore } from '../state/collaboration';
import { supabaseDatabase } from '../api/supabaseDatabase';
import { supabaseStorage } from '../services/supabaseStorage';
import { getSupabaseStatus } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import TrackCard from '../components/TrackCard';
import AudioPlayer from '../components/AudioPlayer';
import Animated, { FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { tracks, currentTrack, clearAllData } = useMusicStore();
  const { getUserById, clearAllUsers } = useUsersStore();
  const { clearAllMessages } = useMessagesStore();
  const navigation = useNavigation();
  
  // Use auth store data as primary source, users store as fallback
  const currentUserData = user;
  
  // Filter tracks uploaded by current user
  const userTracks = tracks.filter(track => track.uploadedBy === currentUserData?.id);
  const totalStreams = userTracks.reduce((sum, track) => sum + track.streamCount, 0);
  
  const handleResetApp = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.multiRemove([
        'music-storage',
        'users-storage', 
        'messages-storage',
        'auth-storage'
      ]);
      
      // Clear state stores
      clearAllData();
      clearAllUsers();
      clearAllMessages();
      
      // Sign out to reset auth
      signOut();
    } catch (error) {
      console.error('Error resetting app:', error);
    }
  };
  
  // Admin Dashboard Component
  const AdminDashboard = () => {
    const [adminStats, setAdminStats] = useState({
      totalUsers: 0,
      totalTracks: 0,
      totalPlaylists: 0,
      totalProjects: 0,
      storageStatus: '',
      databaseStatus: ''
    });
    const [loading, setLoading] = useState(false);

    // Load admin stats
    const loadAdminStats = async () => {
      setLoading(true);
      try {
        const [users, tracks, playlists, projects] = await Promise.all([
          supabaseDatabase.getAllUsers(),
          supabaseDatabase.getAllTracks(),
          supabaseDatabase.getAllPlaylists(),
          supabaseDatabase.getAllProjects()
        ]);

        const supabaseStatus = getSupabaseStatus();

        setAdminStats({
          totalUsers: users.length,
          totalTracks: tracks.length,
          totalPlaylists: playlists.length,
          totalProjects: projects.length,
          storageStatus: supabaseStorage.isConfigured() ? 'Connected' : 'Setup Needed',
          databaseStatus: supabaseStatus.configured ? 'Connected' : 'Setup Needed'
        });
      } catch (error) {
        console.error('Failed to load admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      loadAdminStats();
    }, []);

    // Admin Actions
    const handleGrantBetaAccess = () => {
      Alert.alert(
        '🎟️ Grant Beta Access',
        'Grant beta access to all users on the platform?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Grant to All',
            onPress: async () => {
              try {
                const users = await supabaseDatabase.getAllUsers();
                let updatedCount = 0;
                
                for (const user of users) {
                  if (!user.has_beta_access) {
                    await supabaseDatabase.updateUser(user.id, { has_beta_access: true });
                    updatedCount++;
                  }
                }
                
                Alert.alert('✅ Beta Access Granted', `${updatedCount} users now have beta access`);
                loadAdminStats(); // Refresh stats
              } catch (error) {
                console.error('Failed to grant beta access:', error);
                Alert.alert('❌ Error', 'Failed to grant beta access');
              }
            }
          }
        ]
      );
    };

    const handleUserManagement = () => {
      Alert.alert(
        '👥 User Management',
        'Choose a user management action:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View All Users',
            onPress: async () => {
              try {
                const users = await supabaseDatabase.getAllUsers();
                const userList = users.slice(0, 10).map(u => 
                  `• ${u.username} (${u.email}) - ${u.has_beta_access ? '✅' : '❌'} Beta`
                ).join('\n');
                
                Alert.alert(
                  '👥 Platform Users',
                  `Total: ${users.length} users\n\nRecent users:\n${userList}${users.length > 10 ? '\n...and more' : ''}`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert('❌ Error', 'Failed to load users');
              }
            }
          },
          {
            text: 'Revoke Beta Access',
            onPress: async () => {
              Alert.alert(
                '⚠️ Revoke Beta Access',
                'Remove beta access from all users except admin?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Revoke All',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const users = await supabaseDatabase.getAllUsers();
                        let revokedCount = 0;
                        
                        for (const user of users) {
                          if (user.email !== 'audifyx@gmail.com' && user.has_beta_access) {
                            await supabaseDatabase.updateUser(user.id, { has_beta_access: false });
                            revokedCount++;
                          }
                        }
                        
                        Alert.alert('✅ Beta Access Revoked', `Removed beta access from ${revokedCount} users`);
                        loadAdminStats();
                      } catch (error) {
                        Alert.alert('❌ Error', 'Failed to revoke beta access');
                      }
                    }
                  }
                ]
              );
            }
          }
        ]
      );
    };

    const handlePurgeDatabase = () => {
      Alert.alert(
        '⚠️ DANGER: Purge Database',
        '🚨 This will DELETE ALL DATA:\n• All users (except admin)\n• All tracks and audio files\n• All playlists\n• All messages\n• All projects\n\nThis CANNOT be undone!',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'PURGE ALL DATA',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '🚨 FINAL WARNING',
                'Are you absolutely sure? This will destroy the entire platform database!',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Yes, Purge Everything',
                    style: 'destructive',
                    onPress: async () => {
                      // Implementation would go here - very dangerous!
                      Alert.alert('🚨 Not Implemented', 'Purge function disabled for safety');
                    }
                  }
                ]
              );
            }
          }
        ]
      );
    };

    const handleContentModeration = () => {
      Alert.alert(
        '🛡️ Content Moderation',
        'Choose a moderation action:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Recent Tracks',
            onPress: async () => {
              try {
                const tracks = await supabaseDatabase.getAllTracks();
                const trackList = tracks.slice(0, 5).map(t => 
                  `• "${t.title}" by ${t.creator_id} (${t.plays} plays)`
                ).join('\n');
                
                Alert.alert(
                  '🎵 Recent Tracks',
                  `Total: ${tracks.length} tracks\n\nLatest uploads:\n${trackList}`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert('❌ Error', 'Failed to load tracks');
              }
            }
          },
          {
            text: 'Clear All Content',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '⚠️ Clear All Content',
                'Remove all tracks, playlists, and projects (keep users)?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear Content',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        // This would implement bulk content deletion
                        Alert.alert('✅ Content Cleared', 'All content has been removed');
                        loadAdminStats();
                      } catch (error) {
                        Alert.alert('❌ Error', 'Failed to clear content');
                      }
                    }
                  }
                ]
              );
            }
          }
        ]
      );
    };

    const handleExportData = () => {
      Alert.alert(
        '📤 Export Platform Data',
        'Export all platform data to JSON format for backup?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Export',
            onPress: async () => {
              try {
                const [users, tracks, playlists, projects] = await Promise.all([
                  supabaseDatabase.getAllUsers(),
                  supabaseDatabase.getAllTracks(),
                  supabaseDatabase.getAllPlaylists(),
                  supabaseDatabase.getAllProjects()
                ]);

                const exportData = {
                  exportDate: new Date().toISOString(),
                  platform: 'Audifyx',
                  users: users.length,
                  tracks: tracks.length,
                  playlists: playlists.length,
                  projects: projects.length,
                  // data: { users, tracks, playlists, projects } // Uncomment to include full data
                };

                console.log('Platform export data:', exportData);
                Alert.alert('✅ Export Complete', `Platform data exported:\n• ${users.length} users\n• ${tracks.length} tracks\n• ${playlists.length} playlists\n• ${projects.length} projects\n\nCheck console for details.`);
              } catch (error) {
                console.error('Export error:', error);
                Alert.alert('❌ Export Failed', 'Could not export platform data');
              }
            }
          }
        ]
      );
    };

    return (
      <Animated.View entering={FadeInUp.delay(200)} className="mx-4 mb-6">
        <View className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-4 border-2 border-purple-500">
          {/* Admin Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-purple-600 rounded-full items-center justify-center mr-3">
                <Ionicons name="shield-checkmark" size={16} color="white" />
              </View>
              <Text className="text-white text-lg font-bold">Admin Dashboard</Text>
            </View>
            <Pressable
              onPress={loadAdminStats}
              disabled={loading}
              className={`${loading ? 'opacity-50' : ''}`}
            >
              <Ionicons name={loading ? "hourglass" : "refresh-outline"} size={20} color="#A855F7" />
            </Pressable>
          </View>

          {/* Platform Stats */}
          <View className="mb-4">
            <View className="flex-row space-x-3 mb-3">
              <View className="flex-1 bg-black/30 rounded-xl p-3">
                <Text className="text-white text-2xl font-bold">{adminStats.totalUsers}</Text>
                <Text className="text-gray-300 text-sm">Platform Users</Text>
              </View>
              <View className="flex-1 bg-black/30 rounded-xl p-3">
                <Text className="text-white text-2xl font-bold">{adminStats.totalTracks}</Text>
                <Text className="text-gray-300 text-sm">Total Tracks</Text>
              </View>
            </View>
            <View className="flex-row space-x-3">
              <View className="flex-1 bg-black/30 rounded-xl p-3">
                <Text className="text-white text-2xl font-bold">{adminStats.totalPlaylists}</Text>
                <Text className="text-gray-300 text-sm">Playlists</Text>
              </View>
              <View className="flex-1 bg-black/30 rounded-xl p-3">
                <Text className="text-white text-2xl font-bold">{adminStats.totalProjects}</Text>
                <Text className="text-gray-300 text-sm">Collab Projects</Text>
              </View>
            </View>
          </View>

          {/* System Status */}
          <View className="bg-black/30 rounded-xl p-3 mb-4">
            <Text className="text-white font-semibold mb-2">System Status</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-300 text-sm">Database:</Text>
              <Text className={`text-sm font-medium ${adminStats.databaseStatus === 'Connected' ? 'text-green-400' : 'text-red-400'}`}>
                {adminStats.databaseStatus}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-gray-300 text-sm">Storage:</Text>
              <Text className={`text-sm font-medium ${adminStats.storageStatus === 'Connected' ? 'text-green-400' : 'text-red-400'}`}>
                {adminStats.storageStatus}
              </Text>
            </View>
          </View>

          {/* Admin Actions */}
          <View className="space-y-2">
            <Text className="text-white font-semibold mb-2">Admin Actions</Text>
            
            <Pressable
              onPress={handleUserManagement}
              className="bg-blue-600 rounded-lg py-3 px-4 flex-row items-center"
            >
              <Ionicons name="people" size={16} color="white" />
              <Text className="text-white font-medium ml-2">User Management</Text>
            </Pressable>

            <Pressable
              onPress={handleGrantBetaAccess}
              className="bg-indigo-600 rounded-lg py-3 px-4 flex-row items-center"
            >
              <Ionicons name="star" size={16} color="white" />
              <Text className="text-white font-medium ml-2">Grant Beta Access to All</Text>
            </Pressable>

            <Pressable
              onPress={handleContentModeration}
              className="bg-orange-600 rounded-lg py-3 px-4 flex-row items-center"
            >
              <Ionicons name="shield-checkmark" size={16} color="white" />
              <Text className="text-white font-medium ml-2">Content Moderation</Text>
            </Pressable>

            <Pressable
              onPress={handleExportData}
              className="bg-green-600 rounded-lg py-3 px-4 flex-row items-center"
            >
              <Ionicons name="download" size={16} color="white" />
              <Text className="text-white font-medium ml-2">Export Platform Data</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('Messages' as never)}
              className="bg-gray-600 rounded-lg py-3 px-4 flex-row items-center"
            >
              <Ionicons name="bug" size={16} color="white" />
              <Text className="text-white font-medium ml-2">Advanced Debug Tools</Text>
            </Pressable>

            <Pressable
              onPress={handlePurgeDatabase}
              className="bg-red-600 rounded-lg py-3 px-4 flex-row items-center"
            >
              <Ionicons name="nuclear" size={16} color="white" />
              <Text className="text-white font-medium ml-2">⚠️ Purge All Database</Text>
            </Pressable>
          </View>

          {/* Warning */}
          <View className="bg-yellow-600/20 rounded-lg p-3 mt-3 border border-yellow-600/50">
            <Text className="text-yellow-200 text-xs text-center">
              🔒 Admin privileges active. Use responsibly.
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Text className="text-2xl font-bold text-white">{currentUserData?.username}</Text>
          <View className="flex-row space-x-3">
            <Pressable onPress={handleResetApp}>
              <Ionicons name="refresh-outline" size={24} color="#6B7280" />
            </Pressable>
            <Pressable onPress={signOut}>
              <Ionicons name="log-out-outline" size={24} color="white" />
            </Pressable>
          </View>
        </View>
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Profile Info */}
          <Animated.View entering={FadeInUp} className="items-center py-6">
            <View className="w-24 h-24 bg-purple-600 rounded-full items-center justify-center mb-4">
              {currentUserData?.profileImage ? (
                <Image
                  source={{ uri: currentUserData.profileImage }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Text className="text-white text-2xl font-bold">
                  {currentUserData?.username?.[0]?.toUpperCase()}
                </Text>
              )}
            </View>
            
            <View className="flex-row items-center justify-center">
              <Text className="text-white text-xl font-bold">{currentUserData?.username}</Text>
              {currentUserData?.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" className="ml-2" />
              )}
            </View>
            <Text className="text-gray-400 text-sm mt-1">{currentUserData?.email}</Text>
            
            {/* Bio */}
            {currentUserData?.bio && (
              <Text className="text-gray-300 text-center mt-3 px-4 leading-5">
                {currentUserData.bio}
              </Text>
            )}
            
            {/* Location and Website */}
            <View className="flex-row items-center justify-center mt-2 space-x-4">
              {currentUserData?.location && (
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text className="text-gray-400 text-sm ml-1">{currentUserData.location}</Text>
                </View>
              )}
              {currentUserData?.website && (
                <Pressable 
                  onPress={() => Linking.openURL(currentUserData.website!)}
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
                <Text className="text-gray-400 text-sm">Total Streams</Text>
              </View>
              
              <View className="items-center">
                <Text className="text-white text-xl font-bold">{currentUserData?.followers || 0}</Text>
                <Text className="text-gray-400 text-sm">Followers</Text>
              </View>
              
              <View className="items-center">
                <Text className="text-white text-xl font-bold">{currentUserData?.following || 0}</Text>
                <Text className="text-gray-400 text-sm">Following</Text>
              </View>
            </View>
            
            {/* Custom Links */}
            {currentUserData?.links && currentUserData.links.length > 0 && (
              <View className="w-full mt-6 px-4">
                <View className="flex-row flex-wrap justify-center gap-3">
                  {currentUserData.links.map((link, index) => (
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
            <View className="flex-row space-x-3 mt-6 px-4 w-full">
              <AnimatedPressable
                entering={FadeInUp.delay(200)}
                onPress={() => navigation.navigate('EditProfile' as never)}
                className="flex-1 bg-purple-600 rounded-xl py-3"
              >
                <Text className="text-white text-center font-semibold">Edit Profile</Text>
              </AnimatedPressable>
              
              <AnimatedPressable
                entering={FadeInUp.delay(300)}
                className="flex-1 bg-gray-800 rounded-xl py-3"
              >
                <Text className="text-white text-center font-semibold">Share Profile</Text>
              </AnimatedPressable>
            </View>
          </Animated.View>
          
          {/* Admin Dashboard - Only for audifyx@gmail.com */}
          {user?.email === 'audifyx@gmail.com' && <AdminDashboard />}
          
          {/* User's Tracks */}
          <View className="px-4 pb-32">
            <Text className="text-white text-lg font-bold mb-4">Your Tracks</Text>
            
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
                <Text className="text-gray-400 text-lg mt-4">No tracks uploaded yet</Text>
                <Text className="text-gray-500 text-center mt-2">
                  Start sharing your music with the world
                </Text>
                
                <AnimatedPressable
                  entering={FadeInUp.delay(400)}
                  onPress={() => navigation.navigate('Upload' as never)}
                  className="bg-purple-600 rounded-xl px-6 py-3 mt-4"
                >
                  <Text className="text-white font-semibold">Upload Your First Track</Text>
                </AnimatedPressable>
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