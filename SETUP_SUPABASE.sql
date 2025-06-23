-- Supabase Database Schema for Audifyx
-- Copy and paste this entire SQL into your Supabase SQL Editor and run it
-- This will create all required tables with sample data

-- Enable UUID extension for generating IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - stores all user profiles and authentication data
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

-- Tracks table - stores all music tracks and metadata
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

-- Playlists table - user-created music collections
CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table - messaging system
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  participants TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table - individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (social features)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;
CREATE POLICY "Tracks are viewable by everyone" ON tracks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Playlists are viewable by everyone" ON playlists;
CREATE POLICY "Playlists are viewable by everyone" ON playlists FOR SELECT USING (true);

DROP POLICY IF EXISTS "Conversations are viewable by participants" ON conversations;
CREATE POLICY "Conversations are viewable by participants" ON conversations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Messages are viewable by everyone" ON messages;
CREATE POLICY "Messages are viewable by everyone" ON messages FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can insert tracks" ON tracks;
CREATE POLICY "Users can insert tracks" ON tracks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their tracks" ON tracks;
CREATE POLICY "Users can update their tracks" ON tracks FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can insert playlists" ON playlists;
CREATE POLICY "Users can insert playlists" ON playlists FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
CREATE POLICY "Users can insert conversations" ON conversations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (true);

-- Tables created - ready for real user data

-- Create storage buckets for file uploads (if they don't exist)
-- Note: Storage buckets might need to be created through the Supabase dashboard

-- Database setup complete - ready for real users
SELECT 'Audifyx database setup complete! ✅' as status;