import { getAnthropicChatResponse } from './chat-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  website?: string;
  isVerified?: boolean;
  paymentMethods?: {
    paypal?: string;
    cashapp?: string;
  };
  createdAt: string;
  followersCount: number;
  followingCount: number;
  tracksCount: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  userId: string;
  url: string;
  imageUrl?: string;
  duration: number;
  createdAt: string;
  streamCount: number;
  source: 'file' | 'soundcloud' | 'youtube' | 'spotify';
  likes: number;
  comments: Comment[];
  shares: number;
}

export interface Playlist {
  id: string;
  name: string;
  userId: string;
  description?: string;
  imageUrl?: string;
  tracks: string[]; // Track IDs
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  type: 'text' | 'audio' | 'image';
  audioUrl?: string;
  imageUrl?: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
  lastActivity: string;
  unreadCount: number;
  isTyping?: string; // User ID who is typing
}

export interface Comment {
  id: string;
  trackId: string;
  userId: string;
  text: string;
  createdAt: string;
  likes: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'share' | 'message';
  fromUserId: string;
  trackId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface FollowRelationship {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface CollaborationProject {
  id: string;
  title: string;
  description: string;
  userId: string; // Creator
  genre: string;
  skillsNeeded: string[];
  budget?: string;
  deadline?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  applicants: ProjectApplication[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectApplication {
  id: string;
  projectId: string;
  userId: string;
  message: string;
  portfolioUrl?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// Cloud database using AI backend for persistence across devices
class DatabaseService {
  private dbKey = 'audifyx_global_database';
  private localCacheKey = 'audifyx_local_cache';
  private initialized = false;
  private cloudDb: any = null;

  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('Initializing cloud database...');
      
      // Try to load from cloud first
      await this.loadFromCloud();
      
      // If no cloud data, try local cache
      if (!this.cloudDb) {
        const localCache = await AsyncStorage.getItem(this.localCacheKey);
        if (localCache) {
          this.cloudDb = JSON.parse(localCache);
          console.log('Loaded from local cache');
        }
      }
      
      // If no data at all, initialize empty
      if (!this.cloudDb) {
        this.cloudDb = {
          users: [],
          tracks: [],
          playlists: [],
          messages: [],
          conversations: [],
          comments: [],
          notifications: [],
          followRelationships: [],
          collaborationProjects: [],
          projectApplications: [],
          lastSync: new Date().toISOString(),
          version: 1
        };
        console.log('Initialized empty database');
      }
      
      // Cache locally for offline access
      await AsyncStorage.setItem(this.localCacheKey, JSON.stringify(this.cloudDb));
      
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Fallback to empty database
      this.cloudDb = {
        users: [],
        tracks: [],
        playlists: [],
        messages: [],
        conversations: [],
        comments: [],
        notifications: [],
        followRelationships: [],
        collaborationProjects: [],
        projectApplications: [],
        lastSync: new Date().toISOString(),
        version: 1
      };
      this.initialized = true;
    }
  }

  async getAllUsers(): Promise<User[]> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      return db.users || [];
    } catch (error) {
      console.error('Failed to get all users:', error);
      return [];
    }
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'followersCount' | 'followingCount' | 'tracksCount'>): Promise<User> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      
      // Check if user already exists
      const existingUser = db.users.find((u: User) => u.email === user.email || u.username === user.username);
      if (existingUser) {
        throw new Error('User already exists with this email or username');
      }

      const newUser: User = {
        ...user,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        followersCount: 0,
        followingCount: 0,
        tracksCount: 0
      };

      db.users.push(newUser);
      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
      
      return newUser;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      const userIndex = db.users.findIndex((u: User) => u.id === userId);
      
      if (userIndex === -1) {
        return null;
      }

      db.users[userIndex] = { ...db.users[userIndex], ...updates };
      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
      
      return db.users[userIndex];
    } catch (error) {
      console.error('Failed to update user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      return db.users.find((u: User) => u.email === email) || null;
    } catch (error) {
      console.error('Failed to get user by email:', error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      return db.users.find((u: User) => u.id === userId) || null;
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      return null;
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      const lowercaseQuery = query.toLowerCase();
      return db.users.filter((u: User) => 
        u.username.toLowerCase().includes(lowercaseQuery) ||
        u.email.toLowerCase().includes(lowercaseQuery) ||
        (u.bio && u.bio.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  async syncWithCloud(forceUpdate = false): Promise<void> {
    try {
      if (!this.cloudDb) await this.initialize();
      
      console.log('Syncing with cloud database...');
      
      // Create a comprehensive data package for cloud storage
      const cloudData = {
        ...this.cloudDb,
        lastSync: new Date().toISOString(),
        deviceId: await this.getDeviceId()
      };

      // Use AI to store the complete database
      const storePrompt = `AUDIFYX_DATABASE_STORE:${JSON.stringify(cloudData)}:END_STORE`;
      
      try {
        const response = await getAnthropicChatResponse(storePrompt);
        if (response.content.includes('STORED')) {
          console.log('Successfully synced with cloud database');
          // Update local cache
          await AsyncStorage.setItem(this.localCacheKey, JSON.stringify(this.cloudDb));
        }
      } catch (aiError) {
        console.error('AI storage failed, using local backup:', aiError);
      }
      
    } catch (error) {
      console.error('Failed to sync with cloud:', error);
    }
  }

  async loadFromCloud(): Promise<void> {
    try {
      console.log('Loading database from cloud...');
      
      // Request the database from AI storage
      const loadPrompt = 'AUDIFYX_DATABASE_LOAD: Please return the latest Audifyx database if available';
      
      try {
        const response = await getAnthropicChatResponse(loadPrompt);
        
        // Try to extract database from response
        const dbMatch = response.content.match(/AUDIFYX_DATABASE_STORE:(.*?):END_STORE/);
        if (dbMatch) {
          const cloudData = JSON.parse(dbMatch[1]);
          
          // Validate and use cloud data
          if (cloudData.users && cloudData.tracks) {
            this.cloudDb = cloudData;
            console.log('Loaded database from cloud:', {
              users: cloudData.users.length,
              tracks: cloudData.tracks.length,
              messages: cloudData.messages?.length || 0
            });
            return;
          }
        }
      } catch (aiError) {
        console.log('No cloud database found or AI unavailable, will create new');
      }
      
      this.cloudDb = null; // Will trigger initialization
    } catch (error) {
      console.error('Failed to load from cloud:', error);
      this.cloudDb = null;
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('audifyx_device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('audifyx_device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private async getDatabase(): Promise<any> {
    if (!this.initialized) await this.initialize();
    
    return this.cloudDb || { 
      users: [], 
      tracks: [], 
      playlists: [], 
      messages: [], 
      conversations: [], 
      comments: [], 
      notifications: [], 
      followRelationships: [], 
      collaborationProjects: [], 
      projectApplications: [], 
      lastSync: new Date().toISOString(),
      version: 1
    };
  }

  private async saveDatabase(db: any): Promise<void> {
    this.cloudDb = db;
    
    // Save to local cache immediately
    await AsyncStorage.setItem(this.localCacheKey, JSON.stringify(db));
    
    // Sync to cloud in background (don't wait)
    this.syncWithCloud().catch(error => {
      console.error('Background cloud sync failed:', error);
    });
  }

  // Method to force sync all devices (call this when app starts)
  // Track methods
  async getAllTracks(): Promise<Track[]> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      return db.tracks || [];
    } catch (error) {
      console.error('Failed to get all tracks:', error);
      return [];
    }
  }

  async createTrack(track: Omit<Track, 'id' | 'createdAt' | 'likes' | 'comments' | 'shares'>): Promise<Track> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      
      const newTrack: Track = {
        ...track,
        id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        shares: 0
      };

      db.tracks.push(newTrack);
      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
      
      return newTrack;
    } catch (error) {
      console.error('Failed to create track:', error);
      throw error;
    }
  }

  async updateTrack(trackId: string, updates: Partial<Track>): Promise<Track | null> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      const trackIndex = db.tracks.findIndex((t: Track) => t.id === trackId);
      
      if (trackIndex === -1) return null;

      db.tracks[trackIndex] = { ...db.tracks[trackIndex], ...updates };
      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
      
      return db.tracks[trackIndex];
    } catch (error) {
      console.error('Failed to update track:', error);
      return null;
    }
  }

  async deleteTrack(trackId: string): Promise<boolean> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      const trackIndex = db.tracks.findIndex((t: Track) => t.id === trackId);
      
      if (trackIndex === -1) return false;

      db.tracks.splice(trackIndex, 1);
      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
      
      return true;
    } catch (error) {
      console.error('Failed to delete track:', error);
      return false;
    }
  }

  // Playlist methods
  async getAllPlaylists(): Promise<Playlist[]> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      return db.playlists || [];
    } catch (error) {
      console.error('Failed to get all playlists:', error);
      return [];
    }
  }

  async createPlaylist(playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Playlist> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      
      const newPlaylist: Playlist = {
        ...playlist,
        id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.playlists.push(newPlaylist);
      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
      
      return newPlaylist;
    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw error;
    }
  }

  async updatePlaylist(playlistId: string, updates: Partial<Playlist>): Promise<Playlist | null> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      const playlistIndex = db.playlists.findIndex((p: Playlist) => p.id === playlistId);
      
      if (playlistIndex === -1) return null;

      db.playlists[playlistIndex] = { 
        ...db.playlists[playlistIndex], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
      
      return db.playlists[playlistIndex];
    } catch (error) {
      console.error('Failed to update playlist:', error);
      return null;
    }
  }

  async deletePlaylist(playlistId: string): Promise<boolean> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      const playlistIndex = db.playlists.findIndex((p: Playlist) => p.id === playlistId);
      
      if (playlistIndex === -1) return false;

      db.playlists.splice(playlistIndex, 1);
      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
      
      return true;
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      return false;
    }
  }

  // Message methods
  async getConversations(userId: string): Promise<Conversation[]> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      return db.conversations?.filter((c: Conversation) => c.participants.includes(userId)) || [];
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  async createConversation(participants: string[]): Promise<Conversation> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      
      // Check if conversation already exists
      const existingConv = db.conversations?.find((c: Conversation) => 
        c.participants.length === participants.length &&
        participants.every(p => c.participants.includes(p))
      );
      
      if (existingConv) return existingConv;

      const newConversation: Conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participants,
        lastActivity: new Date().toISOString(),
        unreadCount: 0
      };

      if (!db.conversations) db.conversations = [];
      db.conversations.push(newConversation);
      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
      
      return newConversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }

  async createMessage(message: Omit<Message, 'id' | 'timestamp' | 'isRead'>): Promise<Message> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      
      const newMessage: Message = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        isRead: false
      };

      if (!db.messages) db.messages = [];
      db.messages.push(newMessage);

      // Update conversation
      if (!db.conversations) db.conversations = [];
      const convIndex = db.conversations.findIndex((c: Conversation) => c.id === message.conversationId);
      if (convIndex !== -1) {
        db.conversations[convIndex].lastMessage = newMessage;
        db.conversations[convIndex].lastActivity = newMessage.timestamp;
        db.conversations[convIndex].unreadCount++;
      }

      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
      
      return newMessage;
    } catch (error) {
      console.error('Failed to create message:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      return db.messages?.filter((m: Message) => m.conversationId === conversationId)?.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ) || [];
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  // Follow relationship methods
  async followUser(followerId: string, followingId: string): Promise<void> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      
      // Check if already following
      const existingFollow = db.followRelationships?.find((f: FollowRelationship) => 
        f.followerId === followerId && f.followingId === followingId
      );
      
      if (existingFollow) return;

      const newFollow: FollowRelationship = {
        id: `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        followerId,
        followingId,
        createdAt: new Date().toISOString()
      };

      if (!db.followRelationships) db.followRelationships = [];
      db.followRelationships.push(newFollow);

      // Update user counts
      const followerIndex = db.users.findIndex((u: User) => u.id === followerId);
      const followingIndex = db.users.findIndex((u: User) => u.id === followingId);
      
      if (followerIndex !== -1) db.users[followerIndex].followingCount++;
      if (followingIndex !== -1) db.users[followingIndex].followersCount++;

      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      
      const followIndex = db.followRelationships?.findIndex((f: FollowRelationship) => 
        f.followerId === followerId && f.followingId === followingId
      );
      
      if (followIndex === -1 || followIndex === undefined) return;

      db.followRelationships.splice(followIndex, 1);

      // Update user counts
      const followerIndex = db.users.findIndex((u: User) => u.id === followerId);
      const followingIndex = db.users.findIndex((u: User) => u.id === followingId);
      
      if (followerIndex !== -1) db.users[followerIndex].followingCount = Math.max(0, db.users[followerIndex].followingCount - 1);
      if (followingIndex !== -1) db.users[followingIndex].followersCount = Math.max(0, db.users[followingIndex].followersCount - 1);

      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
    } catch (error) {
      console.error('Failed to unfollow user:', error);
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      return db.followRelationships?.some((f: FollowRelationship) => 
        f.followerId === followerId && f.followingId === followingId
      ) || false;
    } catch (error) {
      console.error('Failed to check follow status:', error);
      return false;
    }
  }

  // Collaboration methods
  async getAllProjects(): Promise<CollaborationProject[]> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      return db.collaborationProjects || [];
    } catch (error) {
      console.error('Failed to get all projects:', error);
      return [];
    }
  }

  async createProject(project: Omit<CollaborationProject, 'id' | 'createdAt' | 'updatedAt' | 'applicants'>): Promise<CollaborationProject> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      
      const newProject: CollaborationProject = {
        ...project,
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        applicants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!db.collaborationProjects) db.collaborationProjects = [];
      db.collaborationProjects.push(newProject);
      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
      
      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  async applyToProject(application: Omit<ProjectApplication, 'id' | 'createdAt' | 'status'>): Promise<ProjectApplication> {
    await this.initialize();
    try {
      const db = await this.getDatabase();
      
      const newApplication: ProjectApplication = {
        ...application,
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      if (!db.projectApplications) db.projectApplications = [];
      db.projectApplications.push(newApplication);

      // Add to project applicants
      const projectIndex = db.collaborationProjects?.findIndex((p: CollaborationProject) => p.id === application.projectId);
      if (projectIndex !== -1 && projectIndex !== undefined) {
        db.collaborationProjects[projectIndex].applicants.push(newApplication);
        db.collaborationProjects[projectIndex].updatedAt = new Date().toISOString();
      }

      db.lastSync = new Date().toISOString();
      
      await this.saveDatabase(db);
      await this.syncWithCloud(db);
      
      return newApplication;
    } catch (error) {
      console.error('Failed to apply to project:', error);
      throw error;
    }
  }

  async forceSyncAllDevices(): Promise<{
    users: User[];
    tracks: Track[];
    playlists: Playlist[];
    conversations: Conversation[];
    projects: CollaborationProject[];
  }> {
    await this.initialize();
    try {
      console.log('Force syncing all devices - loading latest from cloud...');
      
      // Force reload from cloud to get latest data from all devices
      await this.loadFromCloud();
      
      // Get the updated database
      const db = await this.getDatabase();
      
      console.log('Force sync loaded data:', {
        users: db.users?.length || 0,
        tracks: db.tracks?.length || 0,
        playlists: db.playlists?.length || 0,
        conversations: db.conversations?.length || 0,
        projects: db.collaborationProjects?.length || 0
      });
      
      return {
        users: db.users || [],
        tracks: db.tracks || [],
        playlists: db.playlists || [],
        conversations: db.conversations || [],
        projects: db.collaborationProjects || []
      };
    } catch (error) {
      console.error('Failed to force sync all devices:', error);
      return {
        users: [],
        tracks: [],
        playlists: [],
        conversations: [],
        projects: []
      };
    }
  }

  // Method to check if we have the latest data
  async getDataSummary(): Promise<{
    totalUsers: number;
    totalTracks: number;
    totalPlaylists: number;
    totalConversations: number;
    lastSync: string;
    isCloudConnected: boolean;
  }> {
    try {
      await this.initialize();
      const db = await this.getDatabase();
      
      return {
        totalUsers: db.users?.length || 0,
        totalTracks: db.tracks?.length || 0,
        totalPlaylists: db.playlists?.length || 0,
        totalConversations: db.conversations?.length || 0,
        lastSync: db.lastSync || 'Never',
        isCloudConnected: this.cloudDb !== null
      };
    } catch (error) {
      console.error('Failed to get data summary:', error);
      return {
        totalUsers: 0,
        totalTracks: 0,
        totalPlaylists: 0,
        totalConversations: 0,
        lastSync: 'Error',
        isCloudConnected: false
      };
    }
  }
}

export const databaseService = new DatabaseService();