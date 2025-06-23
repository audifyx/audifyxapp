import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMusicStore } from '../state/music';
import { useAuthStore } from '../state/auth';
import TrackCard from '../components/TrackCard';
import AudioPlayer from '../components/AudioPlayer';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type LibraryTab = 'all' | 'playlists' | 'downloaded' | 'liked' | 'recent';

export default function LibraryScreen() {
  const { tracks, playlists, currentTrack } = useMusicStore();
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState<LibraryTab>('all');

  // Sample data for different categories
  const likedTracks = tracks.filter(track => track.likes > 0).slice(0, 10);
  const downloadedTracks = tracks.slice(0, 5); // Demo data
  const recentlyPlayed = tracks.slice(0, 8); // Demo data

  const libraryData = [
    {
      id: 'quick-access',
      title: 'Quick Access',
      data: [
        {
          id: 'liked-songs',
          title: 'Liked Songs',
          subtitle: `${likedTracks.length} songs`,
          icon: 'heart',
          color: '#EF4444',
          onPress: () => console.log('Liked songs'),
        },
        {
          id: 'downloaded',
          title: 'Downloaded Music',
          subtitle: `${downloadedTracks.length} songs`,
          icon: 'download',
          color: '#10B981',
          onPress: () => console.log('Downloaded'),
        },
        {
          id: 'recently-played',
          title: 'Recently Played',
          subtitle: `${recentlyPlayed.length} songs`,
          icon: 'time',
          color: '#8B5CF6',
          onPress: () => console.log('Recent'),
        },
      ],
    },
    {
      id: 'playlists',
      title: 'Your Playlists',
      data: playlists.slice(0, 6),
    },
  ];

  const LibraryTabs = () => (
    <View className="px-4 py-3 border-b border-gray-800">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'all', title: 'All' },
          { key: 'playlists', title: 'Playlists' },
          { key: 'downloaded', title: 'Downloaded' },
          { key: 'liked', title: 'Liked' },
          { key: 'recent', title: 'Recent' },
        ].map((tab, index) => (
          <AnimatedPressable
            key={tab.key}
            entering={FadeInRight.delay(index * 50)}
            onPress={() => setSelectedTab(tab.key as LibraryTab)}
            className={`px-4 py-2 rounded-full mr-3 ${
              selectedTab === tab.key
                ? 'bg-purple-600'
                : 'bg-gray-800'
            }`}
          >
            <Text
              className={`font-medium ${
                selectedTab === tab.key ? 'text-white' : 'text-gray-300'
              }`}
            >
              {tab.title}
            </Text>
          </AnimatedPressable>
        ))}
      </ScrollView>
    </View>
  );

  const QuickAccessItem = ({ item, index }: { item: any; index: number }) => (
    <AnimatedPressable
      entering={FadeInUp.delay(index * 100)}
      onPress={item.onPress}
      className="flex-row items-center px-4 py-4 bg-gray-900 rounded-xl mb-3"
    >
      <View 
        className="w-12 h-12 rounded-lg items-center justify-center mr-4"
        style={{ backgroundColor: item.color }}
      >
        <Ionicons name={item.icon} size={24} color="white" />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-base">{item.title}</Text>
        <Text className="text-gray-400 text-sm">{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </AnimatedPressable>
  );

  const PlaylistItem = ({ item, index }: { item: any; index: number }) => (
    <AnimatedPressable
      entering={FadeInUp.delay(200 + index * 50)}
      onPress={() => navigation.navigate('Playlists' as never)}
      className="flex-row items-center px-4 py-3 bg-gray-900 rounded-xl mb-3"
    >
      <View className="w-12 h-12 bg-purple-600 rounded-lg items-center justify-center mr-4">
        <Ionicons name="musical-notes" size={20} color="white" />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-base">{item.name}</Text>
        <Text className="text-gray-400 text-sm">{item.tracks.length} songs</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </AnimatedPressable>
  );

  const renderSection = ({ section }: { section: any }) => (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-4 px-4">
        <Text className="text-white text-xl font-bold">{section.title}</Text>
        {section.id === 'playlists' && playlists.length > 6 && (
          <Pressable onPress={() => navigation.navigate('Playlists' as never)}>
            <Text className="text-purple-400 font-medium">See All</Text>
          </Pressable>
        )}
      </View>
      {section.id === 'quick-access' ? (
        <View className="px-4">
          {section.data.map((item: any, index: number) => (
            <QuickAccessItem key={item.id} item={item} index={index} />
          ))}
        </View>
      ) : (
        <View className="px-4">
          {section.data.map((item: any, index: number) => (
            <PlaylistItem key={item.id} item={item} index={index} />
          ))}
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'playlists':
        return (
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">Your Playlists</Text>
              <Pressable 
                onPress={() => navigation.navigate('Playlists' as never)}
                className="bg-purple-600 rounded-full px-4 py-2"
              >
                <Text className="text-white font-medium">Create New</Text>
              </Pressable>
            </View>
            {playlists.length > 0 ? (
              playlists.map((playlist, index) => (
                <PlaylistItem key={playlist.id} item={playlist} index={index} />
              ))
            ) : (
              <View className="items-center justify-center py-16">
                <Ionicons name="library-outline" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-lg mt-4">No playlists yet</Text>
                <Text className="text-gray-500 text-center mt-2">
                  Create your first playlist to organize your music
                </Text>
              </View>
            )}
          </View>
        );

      case 'downloaded':
        return (
          <View className="p-4">
            <Text className="text-white text-xl font-bold mb-4">Downloaded Music</Text>
            {downloadedTracks.length > 0 ? (
              downloadedTracks.map((track, index) => (
                <Animated.View key={track.id} entering={FadeInUp.delay(index * 100)}>
                  <TrackCard track={track} />
                </Animated.View>
              ))
            ) : (
              <View className="items-center justify-center py-16">
                <Ionicons name="download-outline" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-lg mt-4">No downloaded songs</Text>
                <Text className="text-gray-500 text-center mt-2">
                  Download songs to listen offline
                </Text>
              </View>
            )}
          </View>
        );

      case 'liked':
        return (
          <View className="p-4">
            <Text className="text-white text-xl font-bold mb-4">Liked Songs</Text>
            {likedTracks.length > 0 ? (
              likedTracks.map((track, index) => (
                <Animated.View key={track.id} entering={FadeInUp.delay(index * 100)}>
                  <TrackCard track={track} />
                </Animated.View>
              ))
            ) : (
              <View className="items-center justify-center py-16">
                <Ionicons name="heart-outline" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-lg mt-4">No liked songs yet</Text>
                <Text className="text-gray-500 text-center mt-2">
                  Like songs to find them here
                </Text>
              </View>
            )}
          </View>
        );

      case 'recent':
        return (
          <View className="p-4">
            <Text className="text-white text-xl font-bold mb-4">Recently Played</Text>
            {recentlyPlayed.length > 0 ? (
              recentlyPlayed.map((track, index) => (
                <Animated.View key={track.id} entering={FadeInUp.delay(index * 100)}>
                  <TrackCard track={track} />
                </Animated.View>
              ))
            ) : (
              <View className="items-center justify-center py-16">
                <Ionicons name="time-outline" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-lg mt-4">No recent activity</Text>
                <Text className="text-gray-500 text-center mt-2">
                  Your recently played songs will appear here
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {libraryData.map((section) => renderSection({ section }))}
            
            {/* Stats Section */}
            <Animated.View entering={FadeInUp.delay(400)} className="mx-4 mb-6">
              <Text className="text-white text-xl font-bold mb-4">Your Stats</Text>
              <View className="bg-gray-900 rounded-xl p-4">
                <View className="flex-row justify-between mb-4">
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-purple-400">{tracks.length}</Text>
                    <Text className="text-gray-400 text-sm">Total Songs</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-purple-400">{playlists.length}</Text>
                    <Text className="text-gray-400 text-sm">Playlists</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-purple-400">
                      {Math.floor(tracks.reduce((sum, track) => sum + track.duration, 0) / 60)}
                    </Text>
                    <Text className="text-gray-400 text-sm">Minutes</Text>
                  </View>
                </View>
                
                <View className="border-t border-gray-700 pt-4">
                  <Text className="text-white font-medium mb-2">Storage Used</Text>
                  <View className="flex-row items-center">
                    <View className="flex-1 bg-gray-700 rounded-full h-2 mr-3">
                      <View className="w-1/3 bg-purple-600 rounded-full h-2" />
                    </View>
                    <Text className="text-gray-400 text-sm">2.1 GB</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Bottom padding */}
            <View className="h-24" />
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-800">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-white">Your Library</Text>
              <Text className="text-gray-400 mt-1">
                {tracks.length} songs • {playlists.length} playlists
              </Text>
            </View>
            <Pressable 
              onPress={() => navigation.navigate('Playlists' as never)}
              className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center"
            >
              <Ionicons name="add" size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Filter Tabs */}
        <LibraryTabs />

        {/* Content */}
        {renderTabContent()}

        {/* Fixed Audio Player */}
        {currentTrack && <AudioPlayer />}
      </View>
    </SafeAreaView>
  );
}