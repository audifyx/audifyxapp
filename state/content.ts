import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Content, ContentType, Track, Video, Reel, Story, Podcast, LiveStream, ContentStats, Comment, ContentInteraction } from '../types/content';

interface ContentState {
  // Content storage
  tracks: Track[];
  videos: Video[];
  reels: Reel[];
  stories: Story[];
  podcasts: Podcast[];
  liveStreams: LiveStream[];
  
  // Content stats
  contentStats: Record<string, ContentStats>;
  
  // Comments and interactions
  comments: Record<string, Comment[]>; // contentId -> comments
  interactions: ContentInteraction[];
  
  // Current content state
  currentContent: Content | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  
  // Feed and discovery
  feed: Content[];
  trending: Content[];
  recommended: Content[];
  
  // Filters and search
  searchQuery: string;
  contentFilter: ContentType | 'all';
  
  // Actions - Content Management
  addContent: (content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateContent: (contentId: string, updates: Partial<Content>) => Promise<void>;
  deleteContent: (contentId: string) => Promise<void>;
  getContentById: (contentId: string) => Content | null;
  getContentByType: (type: ContentType) => Content[];
  
  // Actions - Playback
  playContent: (content: Content) => void;
  pauseContent: () => void;
  resumeContent: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  
  // Actions - Interactions
  likeContent: (contentId: string, userId: string, type?: ContentInteraction['interactionType']) => Promise<void>;
  unlikeContent: (contentId: string, userId: string) => Promise<void>;
  addComment: (contentId: string, userId: string, text: string, timestampReference?: number) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  shareContent: (contentId: string, userId: string, type: 'repost' | 'quote_share', caption?: string) => Promise<void>;
  
  // Actions - Analytics
  recordPlay: (contentId: string, userId?: string, duration?: number) => Promise<void>;
  updateContentStats: (contentId: string, stats: Partial<ContentStats>) => void;
  
  // Actions - Feed Management
  refreshFeed: (userId: string) => Promise<void>;
  loadTrending: () => Promise<void>;
  loadRecommended: (userId: string) => Promise<void>;
  
  // Actions - Search and Filter
  setSearchQuery: (query: string) => void;
  setContentFilter: (filter: ContentType | 'all') => void;
  searchContent: (query: string, filters?: Partial<{ type: ContentType; genre: string; mood: string }>) => Content[];
  
  // Actions - Stories Management
  addStory: (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt'>) => Promise<string>;
  getActiveStories: (userId?: string) => Story[];
  markStoryAsViewed: (storyId: string, userId: string) => void;
  
  // Actions - Live Streaming
  startLiveStream: (streamData: Omit<LiveStream, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'viewerCount'>) => Promise<string>;
  endLiveStream: (streamId: string) => Promise<void>;
  joinLiveStream: (streamId: string, userId: string) => Promise<void>;
  leaveLiveStream: (streamId: string, userId: string) => Promise<void>;
  
  // Utility functions
  clearAllContent: () => void;
  exportUserContent: (userId: string) => Content[];
}

// Demo content data
const createDemoContent = (): {
  tracks: Track[];
  videos: Video[];
  reels: Reel[];
  stories: Story[];
  podcasts: Podcast[];
  liveStreams: LiveStream[];
} => {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  return {
    tracks: [
      {
        id: 'track-demo-1',
        creatorId: 'user-1',
        contentType: 'track',
        title: 'Midnight Vibes',
        description: 'A chill lo-fi track perfect for late night sessions',
        fileUrl: 'https://example.com/audio/midnight-vibes.mp3',
        duration: 185,
        privacy: 'public',
        allowComments: true,
        allowDownloads: false,
        isExplicit: false,
        uploadStatus: 'published',
        publishedAt: dayAgo,
        createdAt: dayAgo,
        updatedAt: dayAgo,
        artist: 'Alex_Beats',
        genre: 'Lo-Fi',
        mood: 'Chill',
        tempo: 85,
        instrumental: true,
        coverVersion: false,
        price: 0,
        imageUrl: 'https://picsum.photos/300/300?random=1',
        streamCount: 1240,
        uploadedBy: 'user-1',
        uploadedAt: dayAgo,
        source: 'file',
        likes: 89,
        comments: [],
        shares: 12
      },
      {
        id: 'track-demo-2',
        creatorId: 'user-2',
        contentType: 'track',
        title: 'Electric Dreams',
        description: 'High energy electronic track with progressive elements',
        fileUrl: 'https://example.com/audio/electric-dreams.mp3',
        duration: 234,
        privacy: 'public',
        allowComments: true,
        allowDownloads: true,
        isExplicit: false,
        uploadStatus: 'published',
        publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        artist: 'SarahM',
        genre: 'Electronic',
        subGenre: 'Progressive House',
        mood: 'Energetic',
        tempo: 128,
        energyLevel: 8,
        instrumental: true,
        coverVersion: false,
        price: 1.99,
        imageUrl: 'https://picsum.photos/300/300?random=2',
        streamCount: 2156,
        uploadedBy: 'user-2',
        uploadedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        source: 'file',
        likes: 156,
        comments: [],
        shares: 23
      }
    ],
    videos: [
      {
        id: 'video-demo-1',
        creatorId: 'user-1',
        contentType: 'video',
        title: 'Midnight Vibes - Official Music Video',
        description: 'Official music video for Midnight Vibes featuring dreamy visuals',
        thumbnailUrl: 'https://picsum.photos/400/225?random=10',
        fileUrl: 'https://example.com/video/midnight-vibes-mv.mp4',
        duration: 185,
        privacy: 'public',
        allowComments: true,
        allowDownloads: false,
        isExplicit: false,
        uploadStatus: 'published',
        publishedAt: dayAgo,
        createdAt: dayAgo,
        updatedAt: dayAgo,
        videoType: 'music_video',
        associatedTrackId: 'track-demo-1',
        aspectRatio: '16:9',
        resolution: '1080p',
        fps: 30,
        hasCaptions: true,
        captionsUrl: 'https://example.com/captions/midnight-vibes.vtt'
      }
    ],
    reels: [
      {
        id: 'reel-demo-1',
        creatorId: 'user-3',
        contentType: 'reel',
        title: 'Quick Beat Drop Challenge',
        description: '15-second beat creation challenge! 🔥',
        thumbnailUrl: 'https://picsum.photos/300/534?random=20',
        fileUrl: 'https://example.com/video/beat-challenge.mp4',
        duration: 15,
        privacy: 'public',
        allowComments: true,
        allowDownloads: false,
        isExplicit: false,
        uploadStatus: 'published',
        publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        backgroundMusicId: 'track-demo-2',
        effectsUsed: ['beat_drop', 'reverb_blast'],
        hashtags: ['#BeatChallenge', '#QuickBeats', '#MusicMaking'],
        mentions: ['user-1', 'user-2'],
        aspectRatio: '9:16'
      }
    ],
    stories: [
      {
        id: 'story-demo-1',
        creatorId: 'user-1',
        contentType: 'story',
        title: 'Studio Session',
        description: 'Working on something new...',
        thumbnailUrl: 'https://picsum.photos/300/534?random=30',
        fileUrl: 'https://example.com/video/studio-story.mp4',
        duration: 8,
        privacy: 'followers_only',
        allowComments: false,
        allowDownloads: false,
        isExplicit: false,
        uploadStatus: 'published',
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        storyType: 'video',
        effectsUsed: ['music_note_overlay'],
        expiresAt: new Date(now.getTime() + 22 * 60 * 60 * 1000),
        viewedBy: ['user-2', 'user-3']
      }
    ],
    podcasts: [
      {
        id: 'podcast-demo-1',
        creatorId: 'user-4',
        contentType: 'podcast',
        title: 'Music Producer Tips #1: Getting Started',
        description: 'First episode of our series on music production for beginners',
        thumbnailUrl: 'https://picsum.photos/300/300?random=40',
        fileUrl: 'https://example.com/audio/producer-tips-1.mp3',
        duration: 1845, // ~30 minutes
        privacy: 'public',
        allowComments: true,
        allowDownloads: true,
        isExplicit: false,
        uploadStatus: 'published',
        publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        episodeNumber: 1,
        seasonNumber: 1,
        hosts: ['user-4'],
        guests: [],
        chapters: [
          {
            id: 'chapter-1',
            title: 'Introduction',
            startTime: 0,
            endTime: 180,
            description: 'Welcome and overview'
          },
          {
            id: 'chapter-2',
            title: 'Choosing Your DAW',
            startTime: 180,
            endTime: 900,
            description: 'Digital Audio Workstation selection guide'
          }
        ]
      }
    ],
    liveStreams: [
      {
        id: 'stream-demo-1',
        creatorId: 'user-1',
        contentType: 'live_stream',
        title: 'Live Beat Making Session',
        description: 'Creating beats live with audience suggestions!',
        thumbnailUrl: 'https://picsum.photos/400/225?random=50',
        fileUrl: '', // Not needed for live streams
        duration: 0, // Ongoing
        privacy: 'public',
        allowComments: true,
        allowDownloads: false,
        isExplicit: false,
        uploadStatus: 'published',
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        streamKey: 'live-key-abc123',
        status: 'live',
        viewerCount: 47,
        maxViewers: 52,
        actualStart: new Date(now.getTime() - 45 * 60 * 1000),
        chatEnabled: true,
        allowTips: true
      }
    ]
  };
};

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => {
      const demoContent = createDemoContent();
      
      return {
        // Initialize with demo content
        tracks: demoContent.tracks,
        videos: demoContent.videos,
        reels: demoContent.reels,
        stories: demoContent.stories,
        podcasts: demoContent.podcasts,
        liveStreams: demoContent.liveStreams,
        
        contentStats: {},
        comments: {},
        interactions: [],
        
        currentContent: null,
        isPlaying: false,
        currentTime: 0,
        volume: 1.0,
        
        feed: [],
        trending: [],
        recommended: [],
        
        searchQuery: '',
        contentFilter: 'all',
        
        // Content Management
        addContent: async (contentData) => {
          const id = `${contentData.contentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date();
          
          const content: Content = {
            ...contentData,
            id,
            createdAt: now,
            updatedAt: now,
          } as Content;
          
          set(state => {
            const typeKey = `${contentData.contentType}s` as keyof ContentState;
            return {
              [typeKey]: [...(state[typeKey] as Content[]), content]
            };
          });
          
          return id;
        },
        
        updateContent: async (contentId, updates) => {
          const state = get();
          const allContent = [...state.tracks, ...state.videos, ...state.reels, ...state.stories, ...state.podcasts, ...state.liveStreams];
          const content = allContent.find(c => c.id === contentId);
          
          if (!content) return;
          
          const typeKey = `${content.contentType}s` as keyof ContentState;
          
          set(state => ({
            [typeKey]: (state[typeKey] as Content[]).map(c => 
              c.id === contentId 
                ? { ...c, ...updates, updatedAt: new Date() }
                : c
            )
          }));
        },
        
        deleteContent: async (contentId) => {
          const state = get();
          const allContent = [...state.tracks, ...state.videos, ...state.reels, ...state.stories, ...state.podcasts, ...state.liveStreams];
          const content = allContent.find(c => c.id === contentId);
          
          if (!content) return;
          
          const typeKey = `${content.contentType}s` as keyof ContentState;
          
          set(state => ({
            [typeKey]: (state[typeKey] as Content[]).filter(c => c.id !== contentId)
          }));
        },
        
        getContentById: (contentId) => {
          const state = get();
          const allContent = [...state.tracks, ...state.videos, ...state.reels, ...state.stories, ...state.podcasts, ...state.liveStreams];
          return allContent.find(c => c.id === contentId) || null;
        },
        
        getContentByType: (type) => {
          const state = get();
          const typeKey = `${type}s` as keyof ContentState;
          return (state[typeKey] as Content[]) || [];
        },
        
        // Playback
        playContent: (content) => {
          set({ currentContent: content, isPlaying: true, currentTime: 0 });
        },
        
        pauseContent: () => {
          set({ isPlaying: false });
        },
        
        resumeContent: () => {
          set({ isPlaying: true });
        },
        
        seekTo: (time) => {
          set({ currentTime: time });
        },
        
        setVolume: (volume) => {
          set({ volume: Math.max(0, Math.min(1, volume)) });
        },
        
        // Interactions
        likeContent: async (contentId, userId, type = 'like') => {
          const interaction: ContentInteraction = {
            id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            contentId,
            interactionType: type,
            createdAt: new Date()
          };
          
          set(state => ({
            interactions: [...state.interactions.filter(i => !(i.userId === userId && i.contentId === contentId)), interaction]
          }));
        },
        
        unlikeContent: async (contentId, userId) => {
          set(state => ({
            interactions: state.interactions.filter(i => !(i.userId === userId && i.contentId === contentId))
          }));
        },
        
        addComment: async (contentId, userId, text, timestampReference) => {
          const comment: Comment = {
            id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            contentId,
            userId,
            username: 'Current User', // Would be fetched from user store
            text,
            timestampReference,
            isPinned: false,
            likeCount: 0,
            replyCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          set(state => ({
            comments: {
              ...state.comments,
              [contentId]: [...(state.comments[contentId] || []), comment]
            }
          }));
        },
        
        deleteComment: async (commentId) => {
          set(state => {
            const newComments = { ...state.comments };
            Object.keys(newComments).forEach(contentId => {
              newComments[contentId] = newComments[contentId].filter(c => c.id !== commentId);
            });
            return { comments: newComments };
          });
        },
        
        shareContent: async (contentId, userId, type, caption) => {
          // Implementation for sharing
          console.log('Sharing content:', { contentId, userId, type, caption });
        },
        
        // Analytics
        recordPlay: async (contentId, userId, duration) => {
          // Implementation for play tracking
          console.log('Recording play:', { contentId, userId, duration });
        },
        
        updateContentStats: (contentId, stats) => {
          set(state => ({
            contentStats: {
              ...state.contentStats,
              [contentId]: {
                ...state.contentStats[contentId],
                ...stats,
                updatedAt: new Date()
              }
            }
          }));
        },
        
        // Feed Management
        refreshFeed: async (userId) => {
          const state = get();
          const allContent = [...state.tracks, ...state.videos, ...state.reels, ...state.stories, ...state.podcasts, ...state.liveStreams];
          const publicContent = allContent
            .filter(c => c.privacy === 'public' && c.uploadStatus === 'published')
            .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
          
          set({ feed: publicContent });
        },
        
        loadTrending: async () => {
          const state = get();
          const allContent = [...state.tracks, ...state.videos, ...state.reels];
          // Simulate trending algorithm - sort by engagement
          const trending = allContent
            .filter(c => c.privacy === 'public')
            .sort(() => Math.random() - 0.5) // Random for demo
            .slice(0, 20);
          
          set({ trending });
        },
        
        loadRecommended: async (userId) => {
          const state = get();
          const allContent = [...state.tracks, ...state.videos, ...state.reels];
          // Simulate recommendation algorithm
          const recommended = allContent
            .filter(c => c.privacy === 'public')
            .sort(() => Math.random() - 0.5) // Random for demo
            .slice(0, 15);
          
          set({ recommended });
        },
        
        // Search and Filter
        setSearchQuery: (query) => {
          set({ searchQuery: query });
        },
        
        setContentFilter: (filter) => {
          set({ contentFilter: filter });
        },
        
        searchContent: (query, filters) => {
          const state = get();
          const allContent = [...state.tracks, ...state.videos, ...state.reels, ...state.stories, ...state.podcasts, ...state.liveStreams];
          
          return allContent.filter(content => {
            // Text search
            const matchesQuery = !query || 
              content.title.toLowerCase().includes(query.toLowerCase()) ||
              content.description?.toLowerCase().includes(query.toLowerCase());
            
            // Type filter
            const matchesType = !filters?.type || content.contentType === filters.type;
            
            // Genre filter (for tracks)
            const matchesGenre = !filters?.genre || 
              (content.contentType === 'track' && (content as Track).genre?.toLowerCase().includes(filters.genre.toLowerCase()));
            
            return matchesQuery && matchesType && matchesGenre;
          });
        },
        
        // Stories Management
        addStory: async (storyData) => {
          const id = `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
          
          const story: Story = {
            ...storyData,
            id,
            contentType: 'story',
            createdAt: now,
            updatedAt: now,
            expiresAt,
            viewedBy: []
          };
          
          set(state => ({
            stories: [...state.stories, story]
          }));
          
          return id;
        },
        
        getActiveStories: (userId) => {
          const state = get();
          const now = new Date();
          return state.stories.filter(story => {
            const isActive = story.expiresAt > now;
            const hasAccess = !userId || story.privacy === 'public' || story.creatorId === userId;
            return isActive && hasAccess;
          });
        },
        
        markStoryAsViewed: (storyId, userId) => {
          set(state => ({
            stories: state.stories.map(story =>
              story.id === storyId && !story.viewedBy.includes(userId)
                ? { ...story, viewedBy: [...story.viewedBy, userId] }
                : story
            )
          }));
        },
        
        // Live Streaming
        startLiveStream: async (streamData) => {
          const id = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date();
          
          const stream: LiveStream = {
            ...streamData,
            id,
            contentType: 'live_stream',
            streamKey: `key-${Math.random().toString(36).substr(2, 12)}`,
            status: 'live',
            viewerCount: 0,
            maxViewers: 0,
            actualStart: now,
            createdAt: now,
            updatedAt: now
          };
          
          set(state => ({
            liveStreams: [...state.liveStreams, stream]
          }));
          
          return id;
        },
        
        endLiveStream: async (streamId) => {
          set(state => ({
            liveStreams: state.liveStreams.map(stream =>
              stream.id === streamId
                ? { ...stream, status: 'ended', endedAt: new Date() }
                : stream
            )
          }));
        },
        
        joinLiveStream: async (streamId, userId) => {
          set(state => ({
            liveStreams: state.liveStreams.map(stream =>
              stream.id === streamId
                ? { 
                    ...stream, 
                    viewerCount: stream.viewerCount + 1,
                    maxViewers: Math.max(stream.maxViewers, stream.viewerCount + 1)
                  }
                : stream
            )
          }));
        },
        
        leaveLiveStream: async (streamId, userId) => {
          set(state => ({
            liveStreams: state.liveStreams.map(stream =>
              stream.id === streamId
                ? { ...stream, viewerCount: Math.max(0, stream.viewerCount - 1) }
                : stream
            )
          }));
        },
        
        // Utility
        clearAllContent: () => {
          set({
            tracks: [],
            videos: [],
            reels: [],
            stories: [],
            podcasts: [],
            liveStreams: [],
            contentStats: {},
            comments: {},
            interactions: [],
            feed: [],
            trending: [],
            recommended: []
          });
        },
        
        exportUserContent: (userId) => {
          const state = get();
          const allContent = [...state.tracks, ...state.videos, ...state.reels, ...state.stories, ...state.podcasts, ...state.liveStreams];
          return allContent.filter(content => content.creatorId === userId);
        }
      };
    },
    {
      name: 'content-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);