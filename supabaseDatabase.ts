// Supabase Database Service for Audifyx
import { supabase, isSupabaseConfigured } from '../config/supabase';

// Database Types matching your existing schema
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  bio: string;
  studio_name: string;
  experience: string;
  profile_photo_url: string;
  banner_photo_url: string;
  avatar_url: string;
  user_role: string;
  is_online: boolean;
  last_seen: string;
  followers_count: number;
  following_count: number;
  banner_gradient: string;
  onboarding_completed: boolean;
  has_beta_access: boolean;
  created_at: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  creator_id: string;
  file_url: string;
  cover_url: string;
  plays: number;
  price: number;
  source: string;
  created_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
}

export interface CallData {
  id: string;
  from_user_id: string;
  to_user_id: string;
  call_type: 'audio' | 'video';
  status: 'calling' | 'ringing' | 'connected' | 'ended' | 'missed' | 'declined';
  created_at: string;
  connected_at?: string;
  ended_at?: string;
  duration?: number;
}

export interface CallSignal {
  id: number;
  type: 'offer' | 'answer' | 'ice-candidate' | 'end-call' | 'mute' | 'unmute' | 'video-on' | 'video-off';
  data?: any;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'audio' | 'image';
  createdAt: string;
  readAt?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationProject {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  genre: string;
  skills_needed: string[];
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectApplication {
  id: string;
  projectId: string;
  applicantId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export class SupabaseDatabaseService {
  // Check if service is ready
  isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  // Initialize database tables (call this once during app setup)
  async initializeTables(): Promise<void> {
    if (!this.isConfigured()) {
      console.log('❌ Supabase not configured - database required for app functionality');
      return;
    }

    console.log('🔧 Initializing Supabase database...');
    
    try {
      // Try to create tables using RPC function if they don't exist
      await this.createTablesIfNotExist();
      
      // Test if main tables exist and are accessible
      const { error: usersError } = await supabase.from('profiles').select('id').limit(1);
      const { error: tracksError } = await supabase.from('songs').select('id').limit(1);
      
      if (usersError || tracksError) {
        console.log('❌ Database tables missing');
        console.log('📋 MANUAL SETUP REQUIRED:');
        console.log('1. Go to: https://uhvwsuvfgyjjuokkmuzp.supabase.co');
        console.log('2. Open SQL Editor');
        console.log('3. Run the content from RUN_THIS_SQL.sql file');
        console.log('4. Restart the app');
        throw new Error('Database tables need to be created manually');
      } else {
        console.log('✅ Database tables verified and ready');
        
        // Check existing user count
        const userCount = await this.getUserCount();
        console.log(`📊 Found ${userCount} existing users in database`);
      }
      
    } catch (error) {
      console.error('❌ Database initialization failed:', (error as any)?.message || String(error));
      throw new Error('Database setup required for app functionality');
    }
    
    // Initialize calling tables
    await this.initializeCallingTables();
  }

  // Create tables using direct SQL execution
  private async createTablesIfNotExist(): Promise<void> {
    try {
      // Enable required extensions
      await supabase.rpc('exec', { 
        sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' 
      });
    } catch (error) {
      console.log('Note: Could not enable extensions (this is normal for hosted Supabase)');
    }
  }

  // Create required tables with proper schema  
  private async createRequiredTables(): Promise<void> {
    console.log('📋 Setting up database schema...');
    
    try {
      // Try to create tables using individual CREATE statements
      // This avoids RPC dependency and works with all Supabase instances
      
      console.log('Creating users table...');
      await supabase.rpc('sql', { 
        query: `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT DEFAULT '',
            bio TEXT DEFAULT '',
            studio_name TEXT DEFAULT '',
            experience TEXT DEFAULT 'beginner',
            profile_photo_url TEXT DEFAULT '',
            banner_photo_url TEXT DEFAULT '',
            avatar_url TEXT DEFAULT '',
            user_role TEXT DEFAULT 'user',
            is_online BOOLEAN DEFAULT false,
            last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            followers_count INTEGER DEFAULT 0,
            following_count INTEGER DEFAULT 0,
            banner_gradient TEXT DEFAULT '',
            onboarding_completed BOOLEAN DEFAULT false,
            has_beta_access BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      console.log('Creating tracks table...');
      await supabase.rpc('sql', { 
        query: `
          CREATE TABLE IF NOT EXISTS tracks (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            creator_id TEXT NOT NULL,
            file_url TEXT NOT NULL,
            cover_url TEXT DEFAULT '',
            plays INTEGER DEFAULT 0,
            price DECIMAL DEFAULT 0,
            source TEXT DEFAULT 'file',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      console.log('Setting up security policies...');
      await supabase.rpc('sql', { 
        query: `
          ALTER TABLE users ENABLE ROW LEVEL SECURITY;
          ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
          CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
          
          DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;
          CREATE POLICY "Tracks are viewable by everyone" ON tracks FOR SELECT USING (true);
          
          DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
          CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (true);
          
          DROP POLICY IF EXISTS "Users can insert tracks" ON tracks;
          CREATE POLICY "Users can insert tracks" ON tracks FOR INSERT WITH CHECK (true);
        `
      });

      console.log('✅ Database schema created successfully');
      
    } catch (error) {
      console.log('⚠️ Automatic schema creation failed:', (error as any)?.message);
      console.log('');
      console.log('🔧 MANUAL SETUP REQUIRED:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Open the SQL Editor');
      console.log('3. Copy the SQL from SETUP_SUPABASE.sql file');
      console.log('4. Paste and run it to create all tables');
      console.log('');
      throw new Error('Database schema setup required - please run the SQL manually in Supabase dashboard');
    }
  }

  // Fallback method to create tables individually
  private async createTablesIndividually(): Promise<void> {
    console.log('Creating tables using individual operations...');
    
    // This method will succeed even if RPC functions are not available
    // The tables will be created through the Supabase dashboard or SQL editor
    console.log('📋 Please create the following tables in your Supabase dashboard:');
    console.log('- users (see supabase-schema.sql)');
    console.log('- tracks (see supabase-schema.sql)');
    console.log('- playlists (see supabase-schema.sql)');
  }

  // Get count of existing users to verify database has real data
  private async getUserCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log('Note: Could not count users:', error.message);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.log('Note: Error counting users');
      return 0;
    }
  }

  // User operations
  async createUser(user: Omit<User, 'created_at'>): Promise<User | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          ...user,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.isConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting users:', (error as any)?.message || String(error));
      return [];
    }
  }



  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  // Track operations (using songs table)
  async createTrack(track: Omit<Track, 'created_at'>): Promise<Track | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('songs')
        .insert([{
          ...track,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating track:', error);
      return null;
    }
  }

  async getAllTracks(): Promise<Track[]> {
    if (!this.isConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting tracks:', error);
      return [];
    }
  }

  async updateTrackStreamCount(id: string, streamCount: number): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      const { error } = await supabase
        .from('songs')
        .update({ 
          plays: streamCount
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating stream count:', error);
      return false;
    }
  }

  async deleteTrack(id: string): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      // First get the track to find the file URLs
      const { data: track, error: fetchError } = await supabase
        .from('songs')
        .select('file_url, cover_url')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching track for deletion:', fetchError);
      }

      // Delete the database record first
      const { error: deleteError } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Delete files from storage if they exist and are in Supabase Storage
      if (track) {
        // Delete audio file from storage
        if (track.file_url && track.file_url.includes('supabase.co/storage')) {
          try {
            const audioPath = track.file_url.split('/audio-songs/')[1];
            if (audioPath) {
              await supabase.storage
                .from('audio-songs')
                .remove([audioPath]);
              console.log('Deleted audio file from storage:', audioPath);
            }
          } catch (storageError) {
            console.warn('Could not delete audio file from storage:', storageError);
          }
        }

        // Delete cover image from storage
        if (track.cover_url && track.cover_url.includes('supabase.co/storage')) {
          try {
            const coverPath = track.cover_url.split('/cover-songs/')[1];
            if (coverPath) {
              await supabase.storage
                .from('cover-songs')
                .remove([coverPath]);
              console.log('Deleted cover image from storage:', coverPath);
            }
          } catch (storageError) {
            console.warn('Could not delete cover image from storage:', storageError);
          }
        }
      }

      console.log(`✅ Track ${id} deleted from database and storage`);
      return true;
    } catch (error) {
      console.error('Error deleting track:', error);
      return false;
    }
  }

  // Playlist operations
  async createPlaylist(playlist: Omit<Playlist, 'created_at'>): Promise<Playlist | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert([{
          ...playlist,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      return null;
    }
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    if (!this.isConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting playlists:', error);
      return [];
    }
  }

  // Message operations
  async createConversation(participants: string[]): Promise<Conversation | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          participants,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  async sendMessage(message: Omit<Message, 'createdAt'>): Promise<Message | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          ...message,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Collaboration operations
  async createProject(project: Omit<CollaborationProject, 'created_at' | 'updated_at'>): Promise<CollaborationProject | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('collaboration_projects')
        .insert([{
          ...project,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }

  async getAllProjects(): Promise<CollaborationProject[]> {
    if (!this.isConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('collaboration_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  // =============================================================================
  // CALLING METHODS
  // =============================================================================

  async createCall(callData: Omit<CallData, 'created_at'>): Promise<CallData | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('calls')
        .insert([callData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating call:', error);
      return null;
    }
  }

  async updateCall(callId: string, updates: Partial<CallData>): Promise<CallData | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('calls')
        .update(updates)
        .eq('id', callId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating call:', error);
      return null;
    }
  }

  async getCallHistory(userId: string): Promise<CallData[]> {
    if (!this.isConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting call history:', error);
      return [];
    }
  }

  async createCallSignal(signalData: Omit<CallSignal, 'id' | 'created_at'>): Promise<CallSignal | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('call_signals')
        .insert([signalData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating call signal:', error);
      return null;
    }
  }

  // Initialize calling tables if they don't exist
  async initializeCallingTables(): Promise<void> {
    if (!this.isConfigured()) return;

    try {
      console.log('🔧 Initializing calling tables...');
      
      // This is a simple check to see if tables exist
      // In production, you'd run the SQL schema from calls-schema.sql
      const { error: callsError } = await supabase
        .from('calls')
        .select('id')
        .limit(1);

      if (callsError && callsError.code === 'PGRST116') {
        console.log('⚠️ Calls tables do not exist in database');
        console.log('💡 Please run the SQL from src/database/calls-schema.sql in your Supabase dashboard');
      } else {
        console.log('✅ Calls tables are available');
      }
    } catch (error) {
      console.log('⚠️ Could not check calling tables:', error);
    }
  }


}

// Export singleton instance
export const supabaseDatabase = new SupabaseDatabaseService();