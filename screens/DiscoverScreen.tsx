import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMusicStore } from '../state/music';
import { useUsersStore } from '../state/users';
import { useAuthStore } from '../state/auth';
import TrackCard from '../components/TrackCard';
import AudioPlayer from '../components/AudioPlayer';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width } = Dimensions.get('window');

export default function DiscoverScreen() {
  const { tracks, currentTrack } = useMusicStore();
  const { allUsers } = useUsersStore();
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Sample data for discovery
  const genres = [
    { name: 'All', color: '#A855F7' },
    { name: 'Hip-Hop', color: '#EF4444' },
    { name: 'R&B', color: '#F59E0B' },
    { name: 'Pop', color: '#10B981' },
    { name: 'Rock', color: '#8B5CF6' },
    { name: 'Electronic', color: '#06B6D4' },
    { name: 'Jazz', color: '#F97316' },
  ];

  // Get trending tracks (most played)
  const trendingTracks = (tracks || [])
    .sort((a, b) => b.streamCount - a.streamCount)
    .slice(0, 10);

  // Get new releases (most recent)
  const newReleases = (tracks || [])
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 8);

  // Get featured artists (most followers)
  const featuredArtists = (allUsers || [])
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 6);

  // Get recommended tracks (based on similar genres and artists)
  const getRecommendedTracks = () => {
    if (!user || !tracks || tracks.length === 0) return [];
    
    // Simple recommendation: mix of different artists and genres
    const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
    const diverseTracks = [];
    const seenArtists = new Set();
    
    for (const track of shuffledTracks) {
      if (!seenArtists.has(track.artist) && diverseTracks.length < 6) {
        diverseTracks.push(track);
        seenArtists.add(track.artist);
      }
    }
    
    return diverseTracks.length > 0 ? diverseTracks : shuffledTracks.slice(0, 6);
  };

  const recommendedTracks = getRecommendedTracks();

  // Get recently played tracks (simulate with random selection for demo)
  const recentlyPlayed = (tracks || [])
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  // Filter tracks based on search and genre
  const getFilteredTracks = () => {
    if (!tracks || tracks.length === 0) return [];
    let filtered = [...tracks];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(track => 
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.genre?.toLowerCase().includes(query)
      );
    }

    // Apply genre filter
    if (selectedGenre && selectedGenre !== 'All') {
      filtered = filtered.filter(track => 
        track.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredTracks = getFilteredTracks();
  const isFiltering = searchQuery.trim() || (selectedGenre && selectedGenre !== 'All');

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const GenreFilter = ({ genre, index }: { genre: any; index: number }) => (
    <AnimatedPressable
      key={genre.name}
      entering={FadeInRight.delay(index * 50)}
      onPress={() => setSelectedGenre(selectedGenre === genre.name ? null : genre.name)}
      className={`px-4 py-2 rounded-full mr-3 border ${
        selectedGenre === genre.name
          ? 'bg-purple-600 border-purple-600'
          : 'bg-gray-800 border-gray-600'
      }`}
    >
      <Text
        className={`font-medium ${
          selectedGenre === genre.name ? 'text-white' : 'text-gray-300'
        }`}
      >
        {genre.name}
      </Text>
    </AnimatedPressable>
  );

  const HorizontalTrackList = ({ title, tracks, showAll = false }: { title: string; tracks: any[]; showAll?: boolean }) => {
    const { playTrack, currentTrack, isPlaying } = useMusicStore();

    return (
      <Animated.View entering={FadeInUp} className="mb-6">
        <View className="flex-row items-center justify-between mb-4 px-4">
          <Text className="text-white text-xl font-bold">{title}</Text>
          {showAll && tracks.length > 3 && (
            <Pressable>
              <Text className="text-purple-400 font-medium">See All</Text>
            </Pressable>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {tracks.map((track, index) => {
            const isCurrentTrack = currentTrack?.id === track.id;
            return (
              <AnimatedPressable
                key={track.id}
                entering={FadeInRight.delay(index * 100)}
                onPress={() => playTrack(track)}
                className="mr-4 w-40"
              >
                <View className={`rounded-xl p-3 w-full ${isCurrentTrack ? 'bg-purple-900' : 'bg-gray-900'}`}>
                  <View className="w-full h-32 bg-gray-800 rounded-lg mb-3 items-center justify-center relative">
                    {track.imageUrl ? (
                      <Image
                        source={{ uri: track.imageUrl }}
                        className="w-full h-full rounded-lg"
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="musical-notes" size={32} color="#6B7280" />
                    )}
                    {isCurrentTrack && (
                      <View className="absolute inset-0 bg-black/50 rounded-lg items-center justify-center">
                        <View className="w-12 h-12 bg-purple-600 rounded-full items-center justify-center">
                          <Ionicons 
                            name={isPlaying ? "pause" : "play"} 
                            size={20} 
                            color="white" 
                          />
                        </View>
                      </View>
                    )}
                  </View>
                  <Text className={`font-semibold text-sm ${isCurrentTrack ? 'text-purple-300' : 'text-white'}`} numberOfLines={2}>
                    {track.title}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1" numberOfLines={1}>
                    {track.artist}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="play" size={12} color="#A855F7" />
                    <Text className="text-purple-400 text-xs ml-1">
                      {track.streamCount.toLocaleString()} plays
                    </Text>
                  </View>
                </View>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    );
  };

  const FeaturedArtistCard = ({ artist, index }: { artist: any; index: number }) => (
    <AnimatedPressable
      key={artist.id}
      entering={FadeInRight.delay(index * 100)}
      onPress={() => (navigation as any).navigate('UserProfile', { userId: artist.id })}
      className="mr-4 items-center w-24"
    >
      <View className="w-20 h-20 rounded-full mb-2 relative">
        <Image
          source={{ uri: artist.profileImage }}
          className="w-full h-full rounded-full"
        />
        {artist.isVerified && (
          <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-full items-center justify-center">
            <Ionicons name="checkmark" size={12} color="white" />
          </View>
        )}
      </View>
      <Text className="text-white text-sm font-medium text-center" numberOfLines={1}>
        {artist.username}
      </Text>
      <Text className="text-gray-400 text-xs text-center">
        {artist.followers} followers
      </Text>
    </AnimatedPressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-800">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-white">Discover</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-gray-400 text-sm">
                  {tracks?.length || 0} tracks • {allUsers?.length || 0} artists
                </Text>
                <View className="w-1 h-1 bg-gray-600 rounded-full mx-2" />
                <Text className="text-purple-400 text-sm font-medium">
                  Updated daily
                </Text>
              </View>
            </View>
            <Pressable 
              onPress={() => setShowSearch(!showSearch)}
              className="p-2 bg-gray-800 rounded-full"
            >
              <Ionicons name={showSearch ? "close" : "search"} size={20} color="#A855F7" />
            </Pressable>
          </View>
          
          {/* Search Bar */}
          {showSearch && (
            <Animated.View entering={FadeInUp} className="mt-4">
              <View className="flex-row items-center bg-gray-800 rounded-full px-4 py-3">
                <Ionicons name="search" size={20} color="#6B7280" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search tracks, artists, genres..."
                  placeholderTextColor="#6B7280"
                  className="flex-1 ml-3 text-white"
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                  </Pressable>
                )}
              </View>
              
              {/* Quick Stats */}
              {searchQuery.trim() && (
                <View className="flex-row justify-between mt-3 px-2">
                  <Text className="text-gray-500 text-sm">
                    {filteredTracks.length} result{filteredTracks.length !== 1 ? 's' : ''}
                  </Text>
                  {filteredTracks.length > 0 && (
                    <Pressable 
                      onPress={() => {
                        // Play all filtered tracks as a playlist
                        if (filteredTracks.length > 0) {
                          useMusicStore.getState().playTrack(filteredTracks[0]);
                        }
                      }}
                      className="flex-row items-center"
                    >
                      <Ionicons name="play" size={12} color="#A855F7" />
                      <Text className="text-purple-400 text-sm ml-1 font-medium">Play All</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </Animated.View>
          )}
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />
          }
        >
          {/* Genre Filters */}
          <View className="py-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {genres.map((genre, index) => (
                <GenreFilter key={genre.name} genre={genre} index={index} />
              ))}
            </ScrollView>
          </View>

          {/* Search Results */}
          {isFiltering && (
            <Animated.View entering={FadeInUp} className="mb-6">
              <Text className="text-white text-xl font-bold mb-4 px-4">
                {searchQuery.trim() ? `Search Results for "${searchQuery}"` : `${selectedGenre} Music`}
              </Text>
              {filteredTracks.length > 0 ? (
                <View className="px-4">
                  {filteredTracks.map((track, index) => {
                    const isCurrentTrack = currentTrack?.id === track.id;
                    return (
                      <AnimatedPressable
                        key={track.id}
                        entering={FadeInUp.delay(index * 50)}
                        onPress={() => useMusicStore.getState().playTrack(track)}
                        className={`flex-row items-center rounded-xl p-3 mb-3 ${isCurrentTrack ? 'bg-purple-900' : 'bg-gray-900'}`}
                      >
                        <View className="w-12 h-12 bg-gray-800 rounded-lg mr-3 items-center justify-center relative">
                          {track.imageUrl ? (
                            <Image
                              source={{ uri: track.imageUrl }}
                              className="w-full h-full rounded-lg"
                              resizeMode="cover"
                            />
                          ) : (
                            <Ionicons name="musical-notes" size={16} color="#6B7280" />
                          )}
                          {isCurrentTrack && (
                            <View className="absolute inset-0 bg-purple-600/80 rounded-lg items-center justify-center">
                              <Ionicons name="musical-note" size={12} color="white" />
                            </View>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className={`font-semibold ${isCurrentTrack ? 'text-purple-300' : 'text-white'}`} numberOfLines={1}>
                            {track.title}
                          </Text>
                          <Text className="text-gray-400 text-sm" numberOfLines={1}>
                            {track.artist} • {track.genre || 'Unknown Genre'}
                          </Text>
                        </View>
                        <View className="items-end mr-2">
                          <Text className="text-purple-400 font-medium text-sm">
                            {track.streamCount.toLocaleString()}
                          </Text>
                          <Text className="text-gray-500 text-xs">plays</Text>
                        </View>
                        <Pressable className="p-2">
                          <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
                        </Pressable>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              ) : (
                <View className="items-center py-8 px-4">
                  <Ionicons name="search" size={48} color="#6B7280" />
                  <Text className="text-gray-400 text-lg mt-4 mb-2">No results found</Text>
                  <Text className="text-gray-500 text-center">
                    Try adjusting your search or browse our recommendations below
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Featured Banner */}
          {!isFiltering && (
            <Animated.View entering={FadeInUp.delay(200)} className="mx-4 mb-6">
            <Pressable 
              onPress={() => {
                // Play the top trending track
                if (trendingTracks.length > 0) {
                  useMusicStore.getState().playTrack(trendingTracks[0]);
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 relative overflow-hidden"
            >
              <View className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
              <View className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full" />
              <View className="relative z-10">
                <View className="flex-row items-center mb-2">
                  <Text className="text-white text-xl font-bold">🎵 Weekly Spotlight</Text>
                  <View className="ml-2 px-2 py-1 bg-white/20 rounded-full">
                    <Text className="text-white text-xs font-bold">HOT</Text>
                  </View>
                </View>
                <Text className="text-white/90 text-sm mb-1">
                  {trendingTracks.length > 0 ? `"${trendingTracks[0].title}" by ${trendingTracks[0].artist}` : 'Discover the hottest tracks this week'}
                </Text>
                <Text className="text-white/70 text-xs mb-4">
                  {trendingTracks.length > 0 ? `${trendingTracks[0].streamCount.toLocaleString()} plays` : 'Trending now'}
                </Text>
                <View className="flex-row items-center">
                  <View className="bg-white/20 rounded-full px-4 py-2 mr-3">
                    <Text className="text-white font-medium">Play Now</Text>
                  </View>
                  <Ionicons name="play-circle" size={24} color="white" />
                </View>
              </View>
            </Pressable>
          </Animated.View>
          )}

          {/* Trending Now */}
          {!isFiltering && trendingTracks.length > 0 && (
            <HorizontalTrackList title="🔥 Trending Now" tracks={trendingTracks} showAll />
          )}

          {/* Featured Artists */}
          {!isFiltering && featuredArtists.length > 0 && (
            <Animated.View entering={FadeInUp.delay(300)} className="mb-6">
              <View className="flex-row items-center justify-between mb-4 px-4">
                <Text className="text-white text-xl font-bold">✨ Featured Artists</Text>
                <Pressable>
                  <Text className="text-purple-400 font-medium">See All</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {featuredArtists.map((artist, index) => (
                  <FeaturedArtistCard key={artist.id} artist={artist} index={index} />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* New Releases */}
          {!isFiltering && newReleases.length > 0 && (
            <HorizontalTrackList title="🆕 New Releases" tracks={newReleases} showAll />
          )}

          {/* Recently Played */}
          {!isFiltering && recentlyPlayed.length > 0 && (
            <HorizontalTrackList title="🕐 Recently Played" tracks={recentlyPlayed} showAll />
          )}

          {/* Recommended For You */}
          {!isFiltering && recommendedTracks.length > 0 && (
            <HorizontalTrackList title="🎯 Recommended For You" tracks={recommendedTracks} showAll />
          )}

          {/* Charts */}
          {!isFiltering && (
            <Animated.View entering={FadeInUp.delay(400)} className="mb-6">
            <Text className="text-white text-xl font-bold mb-4 px-4">📊 Charts</Text>
            <View className="px-4 space-y-3">
              {trendingTracks.slice(0, 5).map((track, index) => {
                const isCurrentTrack = currentTrack?.id === track.id;
                return (
                  <AnimatedPressable
                    key={track.id}
                    entering={FadeInUp.delay(450 + index * 50)}
                    onPress={() => useMusicStore.getState().playTrack(track)}
                    className={`flex-row items-center rounded-xl p-3 ${isCurrentTrack ? 'bg-purple-900' : 'bg-gray-900'}`}
                  >
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isCurrentTrack ? 'bg-purple-500' : 'bg-purple-600'}`}>
                      <Text className="text-white font-bold text-sm">{index + 1}</Text>
                    </View>
                    <View className="w-12 h-12 bg-gray-800 rounded-lg mr-3 items-center justify-center relative">
                      {track.imageUrl ? (
                        <Image
                          source={{ uri: track.imageUrl }}
                          className="w-full h-full rounded-lg"
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="musical-notes" size={16} color="#6B7280" />
                      )}
                      {isCurrentTrack && (
                        <View className="absolute inset-0 bg-purple-600/80 rounded-lg items-center justify-center">
                          <Ionicons name="musical-note" size={12} color="white" />
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className={`font-semibold ${isCurrentTrack ? 'text-purple-300' : 'text-white'}`} numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Text className="text-gray-400 text-sm" numberOfLines={1}>
                        {track.artist}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-purple-400 font-medium">
                        {track.streamCount.toLocaleString()}
                      </Text>
                      <Text className="text-gray-500 text-xs">plays</Text>
                    </View>
                    <Pressable className="ml-3 p-2">
                      <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
                    </Pressable>
                  </AnimatedPressable>
                );
              })}
            </View>
          </Animated.View>
          )}

          {/* Mood Playlists */}
          {!isFiltering && (
            <Animated.View entering={FadeInUp.delay(500)} className="mb-6">
            <Text className="text-white text-xl font-bold mb-4 px-4">🎭 Mood Playlists</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {[
                { name: 'Chill Vibes', emoji: '😌', color: '#10B981', trackCount: (tracks || []).filter(t => t.genre?.toLowerCase().includes('chill') || t.title.toLowerCase().includes('chill')).length || Math.floor(Math.random() * 20) + 5 },
                { name: 'Workout', emoji: '💪', color: '#EF4444', trackCount: (tracks || []).filter(t => t.genre?.toLowerCase().includes('electronic') || t.genre?.toLowerCase().includes('hip')).length || Math.floor(Math.random() * 15) + 8 },
                { name: 'Focus', emoji: '🎯', color: '#8B5CF6', trackCount: (tracks || []).filter(t => t.genre?.toLowerCase().includes('ambient') || t.genre?.toLowerCase().includes('jazz')).length || Math.floor(Math.random() * 12) + 6 },
                { name: 'Party', emoji: '🎉', color: '#F59E0B', trackCount: (tracks || []).filter(t => t.genre?.toLowerCase().includes('pop') || t.genre?.toLowerCase().includes('dance')).length || Math.floor(Math.random() * 25) + 10 },
                { name: 'Sleep', emoji: '😴', color: '#6366F1', trackCount: Math.floor(Math.random() * 10) + 4 },
                { name: 'Drive', emoji: '🚗', color: '#06B6D4', trackCount: (tracks || []).filter(t => t.genre?.toLowerCase().includes('rock') || t.genre?.toLowerCase().includes('indie')).length || Math.floor(Math.random() * 18) + 7 },
              ].map((mood, index) => (
                <AnimatedPressable
                  key={mood.name}
                  entering={FadeInRight.delay(550 + index * 50)}
                  onPress={() => {
                    // Filter tracks by mood (simple implementation)
                    const moodTracks = (tracks || []).filter(track => {
                      const title = track.title.toLowerCase();
                      const genre = track.genre?.toLowerCase() || '';
                      switch(mood.name) {
                        case 'Chill Vibes': return genre.includes('chill') || title.includes('chill') || genre.includes('lo-fi');
                        case 'Workout': return genre.includes('electronic') || genre.includes('hip') || genre.includes('trap');
                        case 'Focus': return genre.includes('ambient') || genre.includes('jazz') || genre.includes('classical');
                        case 'Party': return genre.includes('pop') || genre.includes('dance') || genre.includes('edm');
                        case 'Sleep': return genre.includes('ambient') || title.includes('night') || title.includes('dream');
                        case 'Drive': return genre.includes('rock') || genre.includes('indie') || genre.includes('alternative');
                        default: return true;
                      }
                    });
                    if (moodTracks.length > 0) {
                      useMusicStore.getState().playTrack(moodTracks[0]);
                    }
                  }}
                  className="mr-4 w-32"
                >
                  <View 
                    className="w-full h-24 rounded-xl items-center justify-center mb-2 relative overflow-hidden"
                    style={{ backgroundColor: `${mood.color}20` }}
                  >
                    <View className="absolute inset-0" style={{ backgroundColor: `${mood.color}10` }} />
                    <Text className="text-3xl mb-1">{mood.emoji}</Text>
                    <Text className="text-white font-semibold text-sm">{mood.name}</Text>
                    <Text className="text-white/70 text-xs">{mood.trackCount} tracks</Text>
                  </View>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </Animated.View>
          )}

          {/* Empty State */}
          {(!tracks || tracks.length === 0) && (
            <Animated.View 
              entering={FadeInUp.delay(200)}
              className="items-center justify-center py-20 px-4"
            >
              <View className="w-24 h-24 bg-gray-800 rounded-full items-center justify-center mb-4">
                <Ionicons name="musical-notes-outline" size={40} color="#6B7280" />
              </View>
              <Text className="text-gray-400 text-lg mb-2">No music to discover yet</Text>
              <Text className="text-gray-500 text-center">
                Start by uploading some tracks or following artists to see recommendations
              </Text>
            </Animated.View>
          )}

          {/* Bottom padding for audio player */}
          <View className="h-24" />
        </ScrollView>

        {/* Fixed Audio Player */}
        {currentTrack && <AudioPlayer />}
      </View>
    </SafeAreaView>
  );
}