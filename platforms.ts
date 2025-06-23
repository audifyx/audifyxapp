// Platform API integrations for SoundCloud, YouTube, Spotify
import { getOpenAIChatResponse } from './chat-service';

export interface PlatformTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  streamUrl?: string;
  thumbnailUrl?: string;
  platform: 'soundcloud' | 'youtube' | 'spotify';
  originalUrl: string;
  isPreviewOnly?: boolean;
}

export interface PlatformError {
  message: string;
  code: string;
  platform: string;
}

// URL Pattern Detection
export function detectPlatform(url: string): 'soundcloud' | 'youtube' | 'spotify' | 'unknown' {
  if (url.includes('soundcloud.com')) return 'soundcloud';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('spotify.com')) return 'spotify';
  return 'unknown';
}

// Extract track ID from platform URLs
export function extractTrackId(url: string, platform: string): string | null {
  try {
    switch (platform) {
      case 'soundcloud':
        // SoundCloud URLs: https://soundcloud.com/artist/track
        const scMatch = url.match(/soundcloud\.com\/([^\/]+)\/([^\/\?]+)/);
        return scMatch ? `${scMatch[1]}/${scMatch[2]}` : null;
        
      case 'youtube':
        // YouTube URLs: https://youtube.com/watch?v=ID or https://youtu.be/ID
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?]+)/);
        return ytMatch ? ytMatch[1] : null;
        
      case 'spotify':
        // Spotify URLs: https://open.spotify.com/track/ID
        const spMatch = url.match(/spotify\.com\/track\/([^?\s]+)/);
        return spMatch ? spMatch[1] : null;
        
      default:
        return null;
    }
  } catch (error) {
    console.error('Error extracting track ID:', error);
    return null;
  }
}

// SoundCloud API Integration
class SoundCloudAPI {
  private clientId: string;
  
  constructor() {
    // In a real implementation, you'd get this from environment variables
    this.clientId = process.env.EXPO_PUBLIC_SOUNDCLOUD_CLIENT_ID || 'demo_client_id';
  }

  async getTrackInfo(url: string): Promise<PlatformTrack> {
    try {
      console.log('SoundCloud: Fetching track info for:', url);
      
      // For now, we'll simulate the API call using AI to extract metadata
      // In production, you'd use: https://api.soundcloud.com/resolve?url=${url}&client_id=${this.clientId}
      
      const trackId = extractTrackId(url, 'soundcloud');
      if (!trackId) {
        throw new Error('Invalid SoundCloud URL');
      }

      // Simulate API response with realistic data
      const mockTrack: PlatformTrack = {
        id: trackId,
        title: `SoundCloud Track ${Date.now()}`,
        artist: 'SoundCloud Artist',
        duration: 180, // 3 minutes
        streamUrl: `https://api.soundcloud.com/tracks/${trackId}/stream?client_id=${this.clientId}`,
        thumbnailUrl: `https://picsum.photos/300/300?random=${Math.random()}`,
        platform: 'soundcloud',
        originalUrl: url,
        isPreviewOnly: false
      };

      console.log('SoundCloud: Track info retrieved:', mockTrack);
      return mockTrack;
      
    } catch (error) {
      console.error('SoundCloud API error:', error);
      throw new Error(`SoundCloud: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchTracks(query: string, limit: number = 10): Promise<PlatformTrack[]> {
    try {
      console.log('SoundCloud: Searching for:', query);
      
      // Mock search results
      const mockResults: PlatformTrack[] = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        id: `sc_${Date.now()}_${i}`,
        title: `${query} - Result ${i + 1}`,
        artist: `Artist ${i + 1}`,
        duration: 120 + (i * 30),
        streamUrl: `https://api.soundcloud.com/tracks/mock_${i}/stream?client_id=${this.clientId}`,
        thumbnailUrl: `https://picsum.photos/300/300?random=${Math.random()}`,
        platform: 'soundcloud',
        originalUrl: `https://soundcloud.com/mock/track-${i}`,
        isPreviewOnly: false
      }));

      return mockResults;
    } catch (error) {
      console.error('SoundCloud search error:', error);
      return [];
    }
  }
}

// YouTube API Integration  
class YouTubeAPI {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || 'demo_api_key';
  }

  async getVideoInfo(url: string): Promise<PlatformTrack> {
    try {
      console.log('YouTube: Fetching video info for:', url);
      
      const videoId = extractTrackId(url, 'youtube');
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // In production: https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${this.apiKey}&part=snippet,contentDetails
      
      // Mock YouTube video data
      const mockTrack: PlatformTrack = {
        id: videoId,
        title: `YouTube Video ${Date.now()}`,
        artist: 'YouTube Channel',
        duration: 240, // 4 minutes
        streamUrl: `https://youtube-audio-proxy.herokuapp.com/audio/${videoId}`, // Hypothetical audio extraction service
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        platform: 'youtube',
        originalUrl: url,
        isPreviewOnly: false
      };

      console.log('YouTube: Video info retrieved:', mockTrack);
      return mockTrack;
      
    } catch (error) {
      console.error('YouTube API error:', error);
      throw new Error(`YouTube: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchVideos(query: string, limit: number = 10): Promise<PlatformTrack[]> {
    try {
      console.log('YouTube: Searching for:', query);
      
      // Mock search results
      const mockResults: PlatformTrack[] = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        id: `yt_${Date.now()}_${i}`,
        title: `${query} - YouTube Result ${i + 1}`,
        artist: `YouTube Channel ${i + 1}`,
        duration: 180 + (i * 45),
        streamUrl: `https://youtube-audio-proxy.herokuapp.com/audio/mock_${i}`,
        thumbnailUrl: `https://picsum.photos/300/300?random=${Math.random()}`,
        platform: 'youtube',
        originalUrl: `https://youtube.com/watch?v=mock_${i}`,
        isPreviewOnly: false
      }));

      return mockResults;
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  }
}

// Spotify API Integration
class SpotifyAPI {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  
  constructor() {
    this.clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || 'demo_client_id';
    this.clientSecret = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || 'demo_secret';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    
    try {
      // In production: POST to https://accounts.spotify.com/api/token
      console.log('Spotify: Getting access token...');
      
      // Mock token for demo
      this.accessToken = 'mock_spotify_token';
      return this.accessToken;
    } catch (error) {
      throw new Error('Failed to get Spotify access token');
    }
  }

  async getTrackInfo(url: string): Promise<PlatformTrack> {
    try {
      console.log('Spotify: Fetching track info for:', url);
      
      const trackId = extractTrackId(url, 'spotify');
      if (!trackId) {
        throw new Error('Invalid Spotify URL');
      }

      await this.getAccessToken();
      
      // In production: GET https://api.spotify.com/v1/tracks/${trackId}
      
      // Mock Spotify track data
      const mockTrack: PlatformTrack = {
        id: trackId,
        title: `Spotify Track ${Date.now()}`,
        artist: 'Spotify Artist',
        duration: 200, // 3:20
        streamUrl: `https://p.scdn.co/mp3-preview/${trackId}`, // Spotify only provides 30-second previews
        thumbnailUrl: `https://picsum.photos/300/300?random=${Math.random()}`,
        platform: 'spotify',
        originalUrl: url,
        isPreviewOnly: true // Spotify only allows 30-second previews
      };

      console.log('Spotify: Track info retrieved:', mockTrack);
      return mockTrack;
      
    } catch (error) {
      console.error('Spotify API error:', error);
      throw new Error(`Spotify: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchTracks(query: string, limit: number = 10): Promise<PlatformTrack[]> {
    try {
      console.log('Spotify: Searching for:', query);
      
      await this.getAccessToken();
      
      // Mock search results
      const mockResults: PlatformTrack[] = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        id: `sp_${Date.now()}_${i}`,
        title: `${query} - Spotify Result ${i + 1}`,
        artist: `Spotify Artist ${i + 1}`,
        duration: 210 + (i * 20),
        streamUrl: `https://p.scdn.co/mp3-preview/mock_${i}`,
        thumbnailUrl: `https://picsum.photos/300/300?random=${Math.random()}`,
        platform: 'spotify',
        originalUrl: `https://open.spotify.com/track/mock_${i}`,
        isPreviewOnly: true
      }));

      return mockResults;
    } catch (error) {
      console.error('Spotify search error:', error);
      return [];
    }
  }
}

// Main Platform Service
class PlatformService {
  private soundcloud = new SoundCloudAPI();
  private youtube = new YouTubeAPI();
  private spotify = new SpotifyAPI();

  async getTrackFromUrl(url: string): Promise<PlatformTrack> {
    const platform = detectPlatform(url);
    
    switch (platform) {
      case 'soundcloud':
        return await this.soundcloud.getTrackInfo(url);
      case 'youtube':
        return await this.youtube.getVideoInfo(url);
      case 'spotify':
        return await this.spotify.getTrackInfo(url);
      default:
        throw new Error('Unsupported platform URL');
    }
  }

  async searchAcrossPlatforms(query: string, platforms: string[] = ['soundcloud', 'youtube', 'spotify']): Promise<PlatformTrack[]> {
    const results: PlatformTrack[] = [];
    
    const promises = platforms.map(async (platform) => {
      try {
        switch (platform) {
          case 'soundcloud':
            return await this.soundcloud.searchTracks(query, 3);
          case 'youtube':
            return await this.youtube.searchVideos(query, 3);
          case 'spotify':
            return await this.spotify.searchTracks(query, 3);
          default:
            return [];
        }
      } catch (error) {
        console.error(`Search failed for ${platform}:`, error);
        return [];
      }
    });

    const platformResults = await Promise.all(promises);
    platformResults.forEach(tracks => results.push(...tracks));
    
    return results;
  }

  isValidPlatformUrl(url: string): boolean {
    return detectPlatform(url) !== 'unknown';
  }

  getPlatformName(url: string): string {
    const platform = detectPlatform(url);
    switch (platform) {
      case 'soundcloud': return 'SoundCloud';
      case 'youtube': return 'YouTube';
      case 'spotify': return 'Spotify';
      default: return 'Unknown';
    }
  }
}

export const platformService = new PlatformService();
export { SoundCloudAPI, YouTubeAPI, SpotifyAPI };