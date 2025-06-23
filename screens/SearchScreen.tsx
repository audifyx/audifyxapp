import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  SectionList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMusicStore } from '../state/music';
import { useUsersStore } from '../state/users';
import { useAuthStore } from '../state/auth';
import TrackCard from '../components/TrackCard';
import AudioPlayer from '../components/AudioPlayer';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SearchSectionData {
  title: string;
  data: any[];
  type: 'tracks' | 'artists' | 'genres';
}

export default function SearchScreen() {
  const { tracks, currentTrack } = useMusicStore();
  const { allUsers } = useUsersStore();
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'tracks' | 'artists' | 'genres'>('all');

  // Popular searches and trending topics
  const popularSearches = ['Hip-Hop', 'R&B', 'Pop', 'Rock', 'Jazz', 'Electronic', 'Indie'];
  const trendingArtists = (allUsers || []).slice(0, 5);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchSectionData[] = [];

    // Search tracks
    const matchingTracks = tracks.filter(track =>
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query)
    );

    if (matchingTracks.length > 0 && (selectedFilter === 'all' || selectedFilter === 'tracks')) {
      results.push({
        title: 'Songs',
        data: matchingTracks.slice(0, 10),
        type: 'tracks'
      });
    }

    // Search artists
    const matchingArtists = (allUsers || []).filter((artist: any) =>
      artist.username.toLowerCase().includes(query) ||
      artist.bio?.toLowerCase().includes(query)
    );

    if (matchingArtists.length > 0 && (selectedFilter === 'all' || selectedFilter === 'artists')) {
      results.push({
        title: 'Artists',
        data: matchingArtists.slice(0, 8),
        type: 'artists'
      });
    }

    // Search by genre (extract from track titles/artists for demo)
    const genreMatches = tracks.filter(track => {
      const genreKeywords = ['hip-hop', 'rap', 'r&b', 'pop', 'rock', 'jazz', 'electronic', 'indie', 'trap', 'lo-fi'];
      return genreKeywords.some(genre => 
        track.title.toLowerCase().includes(genre) || 
        track.artist.toLowerCase().includes(genre) ||
        genre.includes(query)
      );
    });

    if (genreMatches.length > 0 && (selectedFilter === 'all' || selectedFilter === 'genres')) {
      results.push({
        title: 'Genre Matches',
        data: genreMatches.slice(0, 6),
        type: 'genres'
      });
    }

    return results;
  }, [searchQuery, tracks, allUsers, selectedFilter]);

  // Add to search history
  const addToHistory = (query: string) => {
    if (query.trim() && !searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 9)]); // Keep last 10 searches
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      addToHistory(query.trim());
    }
  };

  const renderTrackItem = ({ item: track }: { item: any }) => (
    <Animated.View entering={FadeInUp}>
      <TrackCard track={track} />
    </Animated.View>
  );

  const renderArtistItem = ({ item: artist }: { item: any }) => (
    <AnimatedPressable
      entering={FadeInUp}
      onPress={() => (navigation as any).navigate('UserProfile', { userId: artist.id })}
      className="flex-row items-center p-4 bg-gray-900 rounded-xl mb-3"
    >
      <Image
        source={{ uri: artist.profileImage }}
        className="w-12 h-12 rounded-full mr-3"
      />
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-white font-semibold text-base">{artist.username}</Text>
          {artist.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#A855F7" className="ml-1" />
          )}
        </View>
        <Text className="text-gray-400 text-sm" numberOfLines={1}>
          {artist.followers} followers
        </Text>
        {artist.bio && (
          <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
            {artist.bio}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </AnimatedPressable>
  );

  const renderSectionHeader = ({ section }: { section: SearchSectionData }) => (
    <View className="flex-row items-center justify-between mb-3 mt-4">
      <Text className="text-white text-lg font-semibold">{section.title}</Text>
      {section.data.length > 5 && (
        <Pressable onPress={() => console.log('Show all', section.title)}>
          <Text className="text-purple-400 text-sm">See All</Text>
        </Pressable>
      )}
    </View>
  );

  const renderItem = ({ item, section }: { item: any; section: SearchSectionData }) => {
    switch (section.type) {
      case 'tracks':
      case 'genres':
        return renderTrackItem({ item });
      case 'artists':
        return renderArtistItem({ item });
      default:
        return null;
    }
  };

  const FilterButton = ({ filter, title }: { filter: typeof selectedFilter; title: string }) => (
    <Pressable
      onPress={() => setSelectedFilter(filter)}
      className={`px-4 py-2 rounded-full mr-3 ${
        selectedFilter === filter
          ? 'bg-purple-600'
          : 'bg-gray-800 border border-gray-600'
      }`}
    >
      <Text
        className={`font-medium ${
          selectedFilter === filter ? 'text-white' : 'text-gray-300'
        }`}
      >
        {title}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header with Search */}
        <View className="px-4 py-3 border-b border-gray-800">
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl font-bold text-white mr-4">Search</Text>
            <View className="flex-1 flex-row items-center bg-gray-800 rounded-xl px-3">
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Songs, artists, genres..."
                placeholderTextColor="#6B7280"
                className="flex-1 text-white py-3 px-3 text-base"
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <FilterButton filter="all" title="All" />
            <FilterButton filter="tracks" title="Songs" />
            <FilterButton filter="artists" title="Artists" />
            <FilterButton filter="genres" title="Genres" />
          </ScrollView>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {searchQuery.trim() ? (
            // Search Results
            <View className="p-4">
              {searchResults.length > 0 ? (
                <SectionList
                  sections={searchResults}
                  keyExtractor={(item, index) => `${item.id || index}`}
                  renderItem={renderItem}
                  renderSectionHeader={renderSectionHeader}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <Animated.View 
                  entering={FadeInDown}
                  className="items-center justify-center py-20"
                >
                  <View className="w-20 h-20 bg-gray-800 rounded-full items-center justify-center mb-4">
                    <Ionicons name="search-outline" size={40} color="#6B7280" />
                  </View>
                  <Text className="text-gray-400 text-lg mb-2">No results found</Text>
                  <Text className="text-gray-500 text-center">
                    Try searching for different keywords or check your spelling
                  </Text>
                </Animated.View>
              )}
            </View>
          ) : (
            // Default Search Screen Content
            <View className="p-4">
              {/* Search History */}
              {searchHistory.length > 0 && (
                <Animated.View entering={FadeInUp} className="mb-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-white text-lg font-semibold">Recent Searches</Text>
                    <Pressable onPress={clearSearchHistory}>
                      <Text className="text-purple-400 text-sm">Clear All</Text>
                    </Pressable>
                  </View>
                  <View className="flex-row flex-wrap">
                    {searchHistory.map((query, index) => (
                      <Pressable
                        key={index}
                        onPress={() => handleSearch(query)}
                        className="bg-gray-800 rounded-full px-4 py-2 mr-2 mb-2"
                      >
                        <Text className="text-gray-300">{query}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* Popular Searches */}
              <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
                <Text className="text-white text-lg font-semibold mb-3">Popular Searches</Text>
                <View className="flex-row flex-wrap">
                  {popularSearches.map((search, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleSearch(search)}
                      className="bg-gray-900 border border-gray-700 rounded-full px-4 py-2 mr-2 mb-2 flex-row items-center"
                    >
                      <Ionicons name="trending-up" size={14} color="#A855F7" />
                      <Text className="text-white ml-2">{search}</Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>

              {/* Trending Artists */}
              {trendingArtists.length > 0 && (
                <Animated.View entering={FadeInUp.delay(200)} className="mb-6">
                  <Text className="text-white text-lg font-semibold mb-3">Trending Artists</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {trendingArtists.map((artist: any, index: number) => (
                      <AnimatedPressable
                        key={artist.id}
                        entering={FadeInUp.delay(index * 50)}
                        onPress={() => (navigation as any).navigate('UserProfile', { userId: artist.id })}
                        className="items-center mr-4 w-20"
                      >
                        <Image
                          source={{ uri: artist.profileImage }}
                          className="w-16 h-16 rounded-full mb-2"
                        />
                        <Text className="text-white text-sm font-medium text-center" numberOfLines={1}>
                          {artist.username}
                        </Text>
                        <Text className="text-gray-400 text-xs text-center">
                          {artist.followers} followers
                        </Text>
                      </AnimatedPressable>
                    ))}
                  </ScrollView>
                </Animated.View>
              )}

              {/* Browse Categories */}
              <Animated.View entering={FadeInUp.delay(300)} className="mb-6">
                <Text className="text-white text-lg font-semibold mb-3">Browse Categories</Text>
                <View className="flex-row flex-wrap justify-between">
                  {[
                    { name: 'Hip-Hop', icon: 'musical-note', color: '#EF4444' },
                    { name: 'R&B', icon: 'heart', color: '#F59E0B' },
                    { name: 'Pop', icon: 'star', color: '#10B981' },
                    { name: 'Rock', icon: 'flash', color: '#8B5CF6' },
                    { name: 'Electronic', icon: 'radio', color: '#06B6D4' },
                    { name: 'Jazz', icon: 'musical-notes', color: '#F97316' },
                  ].map((category, index) => (
                    <AnimatedPressable
                      key={category.name}
                      entering={FadeInUp.delay(350 + index * 50)}
                      onPress={() => handleSearch(category.name)}
                      className="w-[48%] bg-gray-900 rounded-xl p-4 mb-3 flex-row items-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <View 
                        className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: category.color }}
                      >
                        <Ionicons name={category.icon as any} size={20} color="white" />
                      </View>
                      <Text className="text-white font-medium">{category.name}</Text>
                    </AnimatedPressable>
                  ))}
                </View>
              </Animated.View>

              {/* Quick Stats */}
              <Animated.View entering={FadeInUp.delay(600)} className="bg-gray-900 rounded-xl p-4">
                <Text className="text-white text-lg font-semibold mb-3">Music Library</Text>
                <View className="flex-row justify-between">
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-purple-400">{tracks.length}</Text>
                    <Text className="text-gray-400 text-sm">Songs</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-purple-400">{allUsers?.length || 0}</Text>
                    <Text className="text-gray-400 text-sm">Artists</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-purple-400">
                      {tracks.reduce((sum, track) => sum + track.streamCount, 0)}
                    </Text>
                    <Text className="text-gray-400 text-sm">Total Plays</Text>
                  </View>
                </View>
              </Animated.View>
            </View>
          )}
        </ScrollView>

        {/* Fixed Audio Player */}
        {currentTrack && <AudioPlayer />}
      </View>
    </SafeAreaView>
  );
}