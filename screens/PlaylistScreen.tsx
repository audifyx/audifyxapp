import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMusicStore } from '../state/music';
import { useAuthStore } from '../state/auth';
import TrackCard from '../components/TrackCard';
import AudioPlayer from '../components/AudioPlayer';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PlaylistScreen() {
  const { tracks, playlists, currentTrack, createPlaylist, deletePlaylist, removeFromPlaylist } = useMusicStore();
  const { user } = useAuthStore();
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  
  const handleCreatePlaylist = async () => {
    if (playlistName.trim() && user) {
      await createPlaylist(playlistName.trim(), user.id, '', true);
      setPlaylistName('');
      setShowCreateModal(false);
    }
  };
  
  const getPlaylistTracks = (trackIds: string[]) => {
    return tracks.filter(track => trackIds.includes(track.id));
  };
  
  const selectedPlaylistData = selectedPlaylist 
    ? playlists.find(p => p.id === selectedPlaylist)
    : null;
    
  const handleDeletePlaylist = () => {
    if (playlistToDelete) {
      const playlist = playlists.find(p => p.id === playlistToDelete);
      deletePlaylist(playlistToDelete);
      setShowDeleteModal(false);
      setPlaylistToDelete(null);
      
      if (selectedPlaylist === playlistToDelete) {
        setSelectedPlaylist(null);
      }
      
      Alert.alert(
        'Playlist Deleted',
        `"${playlist?.name || 'Playlist'}" has been deleted`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };
  
  const handleRemoveFromPlaylist = (trackId: string) => {
    if (selectedPlaylist) {
      removeFromPlaylist(selectedPlaylist, trackId);
      Alert.alert(
        'Removed from Playlist',
        'Track has been removed from the playlist',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          {selectedPlaylist ? (
            <View className="flex-row items-center flex-1">
              <Pressable onPress={() => setSelectedPlaylist(null)} className="mr-3">
                <Ionicons name="chevron-back" size={24} color="white" />
              </Pressable>
              <Text className="text-xl font-bold text-white flex-1">{selectedPlaylistData?.name}</Text>
              <Pressable 
                onPress={() => {
                  setPlaylistToDelete(selectedPlaylist);
                  setShowDeleteModal(true);
                }}
                className="ml-3"
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </Pressable>
            </View>
          ) : (
            <Text className="text-2xl font-bold text-white">Playlists</Text>
          )}
          
          {!selectedPlaylist && (
            <Pressable onPress={() => setShowCreateModal(true)}>
              <Ionicons name="add" size={28} color="#A855F7" />
            </Pressable>
          )}
        </View>
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {!selectedPlaylist ? (
            // Playlists grid
            <View className="p-4">
              {playlists.length > 0 ? (
                <View className="flex-row flex-wrap justify-between">
                  {playlists.map((playlist, index) => (
                    <AnimatedPressable
                      key={playlist.id}
                      entering={FadeInUp.delay(index * 100)}
                      onPress={() => setSelectedPlaylist(playlist.id)}
                      className="w-[48%] bg-gray-900 rounded-xl p-4 mb-4 relative"
                    >
                      <Pressable 
                        onPress={() => {
                          setPlaylistToDelete(playlist.id);
                          setShowDeleteModal(true);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600/80 rounded-full items-center justify-center z-10"
                      >
                        <Ionicons name="close" size={12} color="white" />
                      </Pressable>
                      
                      <View className="flex-row items-center mb-3">
                        <View className="w-12 h-12 bg-purple-600 rounded-lg items-center justify-center">
                          <Ionicons name="musical-notes" size={24} color="white" />
                        </View>
                        <View className="ml-3 flex-1 pr-6">
                          <Text className="text-white font-semibold" numberOfLines={1}>
                            {playlist.name}
                          </Text>
                          <Text className="text-gray-400 text-sm">
                            {playlist.tracks.length} songs
                          </Text>
                        </View>
                      </View>
                      
                      <View className="flex-row">
                        {getPlaylistTracks(playlist.tracks).slice(0, 2).map((track, idx) => (
                          <View key={track.id} className={`flex-1 ${idx > 0 ? 'ml-1' : ''}`}>
                            <View className="bg-gray-800 rounded p-2">
                              <Text className="text-white text-xs" numberOfLines={1}>
                                {track.title}
                              </Text>
                              <Text className="text-gray-400 text-xs" numberOfLines={1}>
                                {track.artist}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </AnimatedPressable>
                  ))}
                </View>
              ) : (
                <View className="items-center justify-center py-16">
                  <Ionicons name="library-outline" size={64} color="#6B7280" />
                  <Text className="text-gray-400 text-lg mt-4">No playlists yet</Text>
                  <Text className="text-gray-500 text-center mt-2 px-8">
                    Create your first playlist to organize your favorite tracks
                  </Text>
                  <AnimatedPressable
                    entering={FadeInUp.delay(300)}
                    onPress={() => setShowCreateModal(true)}
                    className="bg-purple-600 rounded-xl px-6 py-3 mt-6"
                  >
                    <Text className="text-white font-semibold">Create Playlist</Text>
                  </AnimatedPressable>
                </View>
              )}
              
              {/* All songs section */}
              <View className="mt-6">
                <Text className="text-white text-xl font-bold mb-4">All Songs</Text>
                {tracks.length > 0 ? (
                  tracks.map((track, index) => (
                    <Animated.View 
                      key={track.id}
                      entering={FadeInUp.delay(index * 50)}
                    >
                      <TrackCard track={track} showPlaylistButton />
                    </Animated.View>
                  ))
                ) : (
                  <View className="items-center justify-center py-16">
                    <Ionicons name="musical-notes-outline" size={64} color="#6B7280" />
                    <Text className="text-gray-400 text-lg mt-4">No songs available</Text>
                    <Text className="text-gray-500 text-center mt-2">
                      Upload tracks to see them here and add them to playlists
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            // Selected playlist tracks
            <View className="p-4 pb-32">
              {getPlaylistTracks(selectedPlaylistData?.tracks || []).map((track, index) => (
                <Animated.View 
                  key={track.id}
                  entering={FadeInUp.delay(index * 100)}
                >
                  <TrackCard track={track} />
                </Animated.View>
              ))}
              
              {selectedPlaylistData?.tracks.length === 0 && (
                <View className="items-center justify-center py-20">
                  <Ionicons name="musical-notes-outline" size={64} color="#6B7280" />
                  <Text className="text-gray-400 text-lg mt-4">No songs in this playlist</Text>
                  <Text className="text-gray-500 text-center mt-2">
                    Add songs from the home feed or upload new ones
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
        
        {/* Create Playlist Modal */}
        <Modal
          visible={showCreateModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View className="flex-1 bg-black/70 justify-center items-center px-6">
            <Animated.View 
              entering={FadeInDown}
              className="bg-gray-900 w-full rounded-2xl p-6"
            >
              <Text className="text-white text-xl font-bold mb-4">Create Playlist</Text>
              
              <TextInput
                value={playlistName}
                onChangeText={setPlaylistName}
                placeholder="Playlist name"
                placeholderTextColor="#6B7280"
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-base mb-6"
                autoFocus
              />
              
              <View className="flex-row space-x-3">
                <Pressable
                  onPress={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-700 rounded-xl py-3"
                >
                  <Text className="text-white text-center font-semibold">Cancel</Text>
                </Pressable>
                
                <Pressable
                  onPress={handleCreatePlaylist}
                  className="flex-1 bg-purple-600 rounded-xl py-3"
                  disabled={!playlistName.trim()}
                >
                  <Text className="text-white text-center font-semibold">Create</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>
        
        {/* Delete Playlist Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View className="flex-1 bg-black/80 justify-center items-center px-6">
            <Animated.View 
              entering={FadeInDown}
              className="bg-gray-900 w-full rounded-2xl p-6"
            >
              <View className="items-center mb-6">
                <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="trash" size={32} color="#EF4444" />
                </View>
                <Text className="text-white text-xl font-bold mb-2">Delete Playlist</Text>
                <Text className="text-gray-400 text-center leading-6">
                  Are you sure you want to delete "{playlists.find(p => p.id === playlistToDelete)?.name}"? This action cannot be undone.
                </Text>
              </View>
              
              <View className="space-y-3">
                <Pressable
                  onPress={handleDeletePlaylist}
                  className="bg-red-600 rounded-xl py-4"
                >
                  <Text className="text-white text-center font-semibold text-base">
                    Delete Playlist
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => {
                    setShowDeleteModal(false);
                    setPlaylistToDelete(null);
                  }}
                  className="bg-gray-700 rounded-xl py-4"
                >
                  <Text className="text-white text-center font-semibold text-base">
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>
        
        {/* Fixed Audio Player */}
        {currentTrack && <AudioPlayer />}
      </View>
    </SafeAreaView>
  );
}