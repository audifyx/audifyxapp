import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseDatabase, Track as DbTrack, Playlist as DbPlaylist } from '../api/supabaseDatabase';

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  imageUrl?: string;
  duration: number;
  streamCount: number;
  uploadedBy: string;
  uploadedAt: Date;
  source: 'soundcloud' | 'youtube' | 'spotify' | 'file';
  genre?: string;
  rating?: number;
  likes: number;
  comments: Array<{
    id: string;
    trackId: string;
    userId: string;
    text: string;
    createdAt: string;
    likes: number;
  }>;
  shares: number;
}

interface MusicState {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  playlists: { id: string; name: string; tracks: string[]; description?: string; imageUrl?: string; isPublic: boolean; userId: string; }[];
  version: number; // Add version to force reset if needed
  
  // Actions
  addTrack: (track: Omit<Track, 'id' | 'uploadedAt' | 'likes' | 'comments' | 'shares'>) => Promise<void>;
  setCurrentTrack: (track: Track) => void;
  playTrack: (track: Track) => void;
  togglePlayback: () => void;
  setCurrentTime: (time: number) => void;
  incrementStreamCount: (trackId: string) => Promise<void>;
  createPlaylist: (name: string, userId: string, description?: string, isPublic?: boolean) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  deleteTrack: (trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  updateTrackImage: (trackId: string, imageUrl: string) => Promise<void>;
  clearAllData: () => void;
  clearPlayHistory: () => void;
  syncFromDatabase: () => Promise<void>;
}

const CURRENT_VERSION = 2; // Increment this to force clear old data

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      tracks: [],
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      playlists: [],
      version: CURRENT_VERSION,
      
      addTrack: async (trackData) => {
        try {
          console.log('=== ADDING TRACK TO DATABASE ===');
          console.log('Track URL:', trackData.url);
          console.log('Track title:', trackData.title);
          console.log('Track source:', trackData.source);
          
          const dbTrack = await supabaseDatabase.createTrack({
            id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: trackData.title,
            artist: trackData.artist,
            creator_id: trackData.uploadedBy,
            file_url: trackData.url,
            cover_url: trackData.imageUrl || '',
            plays: trackData.streamCount,
            price: 0, // Default price
            source: trackData.source
          });
          
          if (!dbTrack) return;
          
          console.log('Track created in database:', dbTrack.id);
          
          // Convert database track to local format
          const track: Track = {
            id: dbTrack.id,
            title: dbTrack.title,
            artist: (dbTrack as any).artist || 'Unknown Artist',
            url: (dbTrack as any).file_url,
            imageUrl: (dbTrack as any).cover_url,
            duration: 180, // Default duration
            streamCount: (dbTrack as any).plays || 0,
            uploadedBy: (dbTrack as any).creator_id,
            uploadedAt: new Date((dbTrack as any).created_at),
            source: (dbTrack as any).source as any,
            likes: 0,
            comments: [],
            shares: 0
          };
          
          set(state => ({
            tracks: [track, ...state.tracks]
          }));
          
          console.log('=== TRACK ADDED TO DATABASE AND LOCAL STORE ===');
        } catch (error) {
          console.error('Failed to add track to database:', error);
          // Fallback to local-only
          const track: Track = {
            ...trackData,
            id: Math.random().toString(36).substr(2, 9),
            uploadedAt: new Date(),
            likes: 0,
            comments: [],
            shares: 0
          };
          
          set(state => ({
            tracks: [track, ...state.tracks]
          }));
        }
      },
      
      setCurrentTrack: (track) => {
        set({ currentTrack: track, currentTime: 0 });
      },
      
      playTrack: (track) => {
        set({ currentTrack: track, currentTime: 0, isPlaying: true });
      },
      
      togglePlayback: () => {
        set(state => ({ isPlaying: !state.isPlaying }));
      },
      
      setCurrentTime: (time) => {
        set({ currentTime: time });
      },
      
      incrementStreamCount: async (trackId) => {
        try {
          // Update in database
          const track = get().tracks.find(t => t.id === trackId);
          if (track) {
            await supabaseDatabase.updateTrackStreamCount(trackId, track.streamCount + 1);
          }
          
          // Update local state
          set(state => ({
            tracks: state.tracks.map(track =>
              track.id === trackId
                ? { ...track, streamCount: track.streamCount + 1 }
                : track
            )
          }));
        } catch (error) {
          console.error('Failed to update stream count in database:', error);
          // Still update locally as fallback
          set(state => ({
            tracks: state.tracks.map(track =>
              track.id === trackId
                ? { ...track, streamCount: track.streamCount + 1 }
                : track
            )
          }));
        }
      },
      
      createPlaylist: async (name, userId, description = '', isPublic = true) => {
        try {
          const dbPlaylist = await supabaseDatabase.createPlaylist({
            id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            description,
            user_id: userId,
            is_public: isPublic
          });
          
          if (!dbPlaylist) throw new Error('Failed to create playlist');
          
          const playlist = {
            id: dbPlaylist.id,
            name: dbPlaylist.name,
            tracks: (dbPlaylist as any).tracks || [],
            description: dbPlaylist.description,
            imageUrl: (dbPlaylist as any).imageUrl || '',
            isPublic: (dbPlaylist as any).is_public || isPublic,
            userId: (dbPlaylist as any).createdBy || userId
          };
          
          set(state => ({
            playlists: [...state.playlists, playlist]
          }));
        } catch (error) {
          console.error('Failed to create playlist in database:', error);
          // Fallback to local-only
          const playlist = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            tracks: [],
            description,
            imageUrl: undefined,
            isPublic,
            userId
          };
          
          set(state => ({
            playlists: [...state.playlists, playlist]
          }));
        }
      },
      
      addToPlaylist: async (playlistId, trackId) => {
        try {
          // Get current playlist tracks
          const playlist = get().playlists.find(p => p.id === playlistId);
          if (!playlist) return;
          
          const newTracks = [...playlist.tracks, trackId];
          
          // Update in database (for Supabase we'll need to implement updatePlaylist)
          // await supabaseDatabase.updatePlaylist(playlistId, { tracks: newTracks });
          
          // Update local state
          set(state => ({
            playlists: state.playlists.map(playlist =>
              playlist.id === playlistId
                ? { ...playlist, tracks: newTracks }
                : playlist
            )
          }));
        } catch (error) {
          console.error('Failed to add to playlist in database:', error);
          // Fallback to local-only
          set(state => ({
            playlists: state.playlists.map(playlist =>
              playlist.id === playlistId
                ? { ...playlist, tracks: [...playlist.tracks, trackId] }
                : playlist
            )
          }));
        }
      },
      
      deleteTrack: async (trackId) => {
        try {
          // Delete from database
          await supabaseDatabase.deleteTrack(trackId);
          
          // Update local state
          set(state => {
            // Remove track from tracks array
            const updatedTracks = state.tracks.filter(track => track.id !== trackId);
            
            // Remove track from all playlists (update playlists in database too)
            const updatedPlaylists = state.playlists.map(playlist => {
              if (playlist.tracks.includes(trackId)) {
                const newTracks = playlist.tracks.filter(id => id !== trackId);
                // Update playlist in database (async, no need to wait)
                // supabaseDatabase.updatePlaylist(playlist.id, { tracks: newTracks }).catch(console.error);
                return { ...playlist, tracks: newTracks };
              }
              return playlist;
            });
            
            // Stop playing if this track is currently playing
            const updatedCurrentTrack = state.currentTrack?.id === trackId ? null : state.currentTrack;
            const updatedIsPlaying = state.currentTrack?.id === trackId ? false : state.isPlaying;
            
            return {
              ...state,
              tracks: updatedTracks,
              playlists: updatedPlaylists,
              currentTrack: updatedCurrentTrack,
              isPlaying: updatedIsPlaying
            };
          });
        } catch (error) {
          console.error('Failed to delete track from database:', error);
          // Still delete locally as fallback
          set(state => {
            const updatedTracks = state.tracks.filter(track => track.id !== trackId);
            const updatedPlaylists = state.playlists.map(playlist => ({
              ...playlist,
              tracks: playlist.tracks.filter(id => id !== trackId)
            }));
            const updatedCurrentTrack = state.currentTrack?.id === trackId ? null : state.currentTrack;
            const updatedIsPlaying = state.currentTrack?.id === trackId ? false : state.isPlaying;
            
            return {
              ...state,
              tracks: updatedTracks,
              playlists: updatedPlaylists,
              currentTrack: updatedCurrentTrack,
              isPlaying: updatedIsPlaying
            };
          });
        }
      },
      
      removeFromPlaylist: async (playlistId, trackId) => {
        set(state => ({
          playlists: state.playlists.map(playlist =>
            playlist.id === playlistId
              ? { ...playlist, tracks: playlist.tracks.filter(id => id !== trackId) }
              : playlist
          )
        }));
      },
      
      deletePlaylist: async (playlistId) => {
        set(state => ({
          playlists: state.playlists.filter(playlist => playlist.id !== playlistId)
        }));
      },
      
      updateTrackImage: async (trackId, imageUrl) => {
        try {
          // Update in database (for Supabase we'll need to implement updateTrack)
          // await supabaseDatabase.updateTrack(trackId, { imageUrl });
          
          // Update local state
          set(state => ({
            tracks: state.tracks.map(track =>
              track.id === trackId
                ? { ...track, imageUrl }
                : track
            ),
            currentTrack: state.currentTrack?.id === trackId
              ? { ...state.currentTrack, imageUrl }
              : state.currentTrack
          }));
        } catch (error) {
          console.error('Failed to update track image in database:', error);
          // Fallback to local-only
          set(state => ({
            tracks: state.tracks.map(track =>
              track.id === trackId
                ? { ...track, imageUrl }
                : track
            ),
            currentTrack: state.currentTrack?.id === trackId
              ? { ...state.currentTrack, imageUrl }
              : state.currentTrack
          }));
        }
      },
      
      clearAllData: () => {
        set({
          tracks: [],
          playlists: [],
          currentTrack: null,
          isPlaying: false,
          currentTime: 0,
          version: CURRENT_VERSION
        });
      },
      
      clearPlayHistory: () => {
        // Reset stream counts to 0 and clear current playback
        set(state => ({
          tracks: state.tracks.map(track => ({ ...track, streamCount: 0 })),
          currentTrack: null,
          isPlaying: false,
          currentTime: 0
        }));
      },
      
      syncFromDatabase: async () => {
        try {
          console.log('Music Store: Syncing from database...');
          
          // Get all tracks and playlists from database
          const [dbTracks, dbPlaylists] = await Promise.all([
            supabaseDatabase.getAllTracks(),
            supabaseDatabase.getAllPlaylists()
          ]);
          
          console.log('Music Store: Found', dbTracks.length, 'tracks and', dbPlaylists.length, 'playlists in database');
          
          // Convert database tracks to local format
          const tracks: Track[] = await Promise.all(dbTracks.map(async (dbTrack) => {
            // Get artist name from creator profile
            let artistName = 'Unknown Artist';
            try {
              const creator = await supabaseDatabase.getUserById(dbTrack.creator_id);
              artistName = creator?.username || 'Unknown Artist';
            } catch (e) {
              console.warn('Could not get creator info for track:', dbTrack.id);
            }
            
            return {
              id: dbTrack.id,
              title: dbTrack.title,
              artist: artistName,
              url: dbTrack.file_url,
              imageUrl: dbTrack.cover_url || `https://picsum.photos/300/300?random=${Math.random()}`,
              duration: 180, // Default duration
              streamCount: dbTrack.plays,
              uploadedBy: dbTrack.creator_id,
              uploadedAt: new Date(dbTrack.created_at),
              source: dbTrack.source as 'soundcloud' | 'youtube' | 'spotify' | 'file',
              likes: 0,
              comments: [],
              shares: 0
            };
          }));
          
          // Convert database playlists to local format
          const playlists = dbPlaylists.map(dbPlaylist => ({
            id: dbPlaylist.id,
            name: dbPlaylist.name,
            tracks: [], // Initialize empty for now
            description: dbPlaylist.description || '',
            imageUrl: '',
            isPublic: dbPlaylist.is_public,
            userId: dbPlaylist.user_id
          }));
          
          // Update local state
          set(state => ({
            ...state,
            tracks,
            playlists
          }));
          
          console.log('Music Store: Successfully synced from database');
        } catch (error) {
          console.error('Music Store: Failed to sync from database:', error);
        }
      }
    }),
    {
      name: 'music-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        tracks: state.tracks, 
        playlists: state.playlists,
        version: state.version 
      }),
      version: CURRENT_VERSION,
      migrate: (persistedState: any, version: number) => {
        // If version doesn't match, return fresh state
        if (version !== CURRENT_VERSION) {
          return {
            tracks: [],
            currentTrack: null,
            isPlaying: false,
            currentTime: 0,
            playlists: [],
            version: CURRENT_VERSION
          };
        }
        return persistedState;
      }
    }
  )
);