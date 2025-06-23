# Supabase Setup Guide for Audifyx 🚀

This guide will help you set up Supabase to enable cross-device functionality for your Audifyx app.

## What You'll Get

✅ **Cross-device audio playback** - Songs uploaded on one device play on all devices  
✅ **Real-time user sync** - Users see each other instantly across devices  
✅ **Cloud storage** - Audio files and images stored securely in Supabase Storage  
✅ **Automatic sync** - All data syncs automatically without manual intervention  

## Setup Steps (5 minutes)

### 1. Create Supabase Account & Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up with GitHub/Google
3. Create a new project:
   - **Name**: `audifyx-app`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your location
4. Wait 2-3 minutes for project to be ready

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **Anon public key** (looks like: `eyJhbGciOiJ...`)

### 3. Add Credentials to Your App

1. Open your `.env` file in the project root
2. Add these lines (replace with your actual values):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase-schema.sql` from your project
3. Paste it in the SQL Editor and click "Run"
4. You should see "Success. No rows returned" - this means tables were created!

### 5. Enable Storage

1. Go to **Storage** in your Supabase dashboard
2. Click "Create bucket"
3. Create two buckets:
   - **Name**: `audio-files` → **Public**: Yes → Create
   - **Name**: `images` → **Public**: Yes → Create

### 6. Test Your Setup

1. Restart your app completely
2. Sign up with a new account or sign in
3. Try uploading an audio file
4. Check the upload screen - it should show "Uploaded to Supabase! 🚀"

## Verification

Your setup is working when you see:

- ✅ Upload screen shows "Upload to Supabase ☁️" button
- ✅ After upload: "Uploaded to Supabase! 🚀🎵" success message
- ✅ In Messages → Debug: "Status: ✅ Connected" for Supabase
- ✅ Audio files play on different devices

## Database Schema Overview

The setup creates these tables:
- **users** - User profiles and authentication
- **tracks** - Audio files and metadata  
- **playlists** - User-created playlists
- **conversations** - Instagram-style messaging
- **messages** - Individual messages
- **collaboration_projects** - Producer collaboration projects
- **project_applications** - Applications to projects

## Storage Buckets

- **audio-files** - Stores uploaded audio files (MP3, WAV, M4A)
- **images** - Stores cover images and profile pictures

## Security

- **Row Level Security (RLS)** enabled on all tables
- **Public read access** for social features (users can see all content)
- **Authenticated write access** (only signed-in users can create/edit)
- **Secure policies** prevent unauthorized data access

## Troubleshooting

### "Setup Needed" in Debug Screen
- Check your `.env` file has correct SUPABASE_URL and SUPABASE_ANON_KEY
- Restart your app after adding environment variables

### Upload Fails
- Ensure both storage buckets (`audio-files` and `images`) are created
- Check buckets are set to **Public**: Yes

### Users Not Syncing
- Run the SQL schema again to ensure all tables exist
- Check Messages → Debug → "Force Supabase Sync" to manually sync

### Can't Find SQL Editor
- In Supabase dashboard: **SQL Editor** is in the left sidebar
- If not visible, check your project is fully created (wait 2-3 minutes)

## Need Help?

1. **Check Status**: Go to Messages → Debug button → System Status
2. **Manual Sync**: Use "Force Supabase Sync" in debug screen
3. **Verify Setup**: All values should show ✅ in the debug screen

## What's Next?

Once Supabase is connected:
- Users signing up on any device will appear on all devices
- Audio uploads will be stored in cloud and play everywhere
- All data automatically syncs in real-time
- Your app is ready for production use!

---

**Quick Start**: Get URL + Key from Supabase → Add to `.env` → Run SQL schema → Create storage buckets → Restart app → Upload test audio → ✅ Done!