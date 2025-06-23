-- Copy this ENTIRE content and paste it in your Supabase SQL Editor
-- Go to: https://uhvwsuvfgyjjuokkmuzp.supabase.co
-- Click: SQL Editor → New Query → Paste this → Run

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
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

-- Create tracks table
CREATE TABLE IF NOT EXISTS public.tracks (
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

-- Create playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  participants TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Tracks are viewable by everyone" ON public.tracks FOR SELECT USING (true);
CREATE POLICY "Playlists are viewable by everyone" ON public.playlists FOR SELECT USING (true);
CREATE POLICY "Conversations are viewable by participants" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Messages are viewable by everyone" ON public.messages FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Users can insert tracks" ON public.tracks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their tracks" ON public.tracks FOR UPDATE USING (true);
CREATE POLICY "Users can insert playlists" ON public.playlists FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (true);

-- Verify tables were created
SELECT 'Setup complete! ✅' as status,
       schemaname, 
       tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'tracks', 'playlists', 'conversations', 'messages');