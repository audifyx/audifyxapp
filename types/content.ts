export type ContentType = 'track' | 'video' | 'reel' | 'story' | 'podcast' | 'live_stream';

export type ContentPrivacy = 'public' | 'unlisted' | 'private' | 'followers_only';

export type ContentStatus = 'uploading' | 'processing' | 'published' | 'failed';

export interface BaseContent {
  id: string;
  creatorId: string;
  contentType: ContentType;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  fileUrl: string;
  fileSize?: number;
  duration: number; // in seconds
  privacy: ContentPrivacy;
  allowComments: boolean;
  allowDownloads: boolean;
  isExplicit: boolean;
  contentWarning?: string;
  uploadStatus: ContentStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Track extends BaseContent {
  contentType: 'track';
  artist: string;
  albumId?: string;
  trackNumber?: number;
  genre?: string;
  subGenre?: string;
  mood?: string;
  tempo?: number; // BPM
  keySignature?: string;
  energyLevel?: number; // 1-10
  lyrics?: string;
  instrumental: boolean;
  coverVersion: boolean;
  originalTrackId?: string;
  price: number;
  royaltySplit?: Record<string, number>; // userId -> percentage
  // Existing fields for compatibility
  imageUrl?: string;
  streamCount: number;
  uploadedBy: string;
  uploadedAt: Date;
  source: 'soundcloud' | 'youtube' | 'spotify' | 'file';
  likes: number;
  comments: Comment[];
  shares: number;
}

export interface Video extends BaseContent {
  contentType: 'video';
  videoType: 'music_video' | 'behind_scenes' | 'performance' | 'tutorial' | 'vlog';
  associatedTrackId?: string;
  aspectRatio: string;
  resolution: string;
  fps: number;
  hasCaptions: boolean;
  captionsUrl?: string;
}

export interface Reel extends BaseContent {
  contentType: 'reel';
  backgroundMusicId?: string;
  effectsUsed: string[];
  hashtags: string[];
  mentions: string[]; // user IDs
  aspectRatio: '9:16' | '1:1' | '16:9';
}

export interface Story extends BaseContent {
  contentType: 'story';
  storyType: 'audio' | 'video' | 'image';
  backgroundMusicId?: string;
  effectsUsed: string[];
  expiresAt: Date; // 24 hours from creation
  viewedBy: string[]; // user IDs who viewed
}

export interface Podcast extends BaseContent {
  contentType: 'podcast';
  episodeNumber?: number;
  seasonNumber?: number;
  seriesId?: string;
  hosts: string[]; // user IDs
  guests: string[]; // user IDs
  chapters: PodcastChapter[];
  transcript?: string;
}

export interface LiveStream extends BaseContent {
  contentType: 'live_stream';
  streamKey: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  viewerCount: number;
  maxViewers: number;
  scheduledStart?: Date;
  actualStart?: Date;
  endedAt?: Date;
  recordingUrl?: string;
  chatEnabled: boolean;
  allowTips: boolean;
}

export interface PodcastChapter {
  id: string;
  title: string;
  startTime: number; // seconds
  endTime: number; // seconds
  description?: string;
}

export interface Comment {
  id: string;
  contentId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  text: string;
  timestampReference?: number; // for time-coded comments
  parentCommentId?: string; // for replies
  isPinned: boolean;
  likeCount: number;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentInteraction {
  id: string;
  userId: string;
  contentId: string;
  interactionType: 'like' | 'love' | 'fire' | 'mind_blown' | 'headbang';
  createdAt: Date;
}

export interface ContentShare {
  id: string;
  userId: string;
  contentId: string;
  shareType: 'repost' | 'quote_share' | 'external_share';
  caption?: string;
  platform?: string; // for external shares
  createdAt: Date;
}

export interface PlaySession {
  id: string;
  userId?: string;
  contentId: string;
  sessionId: string;
  playDuration: number; // seconds played
  completionRate: number; // percentage completed
  deviceType: string;
  location?: {
    country: string;
    city: string;
  };
  createdAt: Date;
}

export interface ContentStats {
  contentId: string;
  playCount: number;
  uniqueListeners: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  downloadCount: number;
  skipRate: number; // percentage
  completionRate: number; // percentage
  lastPlayed?: Date;
  trendingScore: number;
  updatedAt: Date;
}

export type Content = Track | Video | Reel | Story | Podcast | LiveStream;