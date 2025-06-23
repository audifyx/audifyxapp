# 🚀 Quick Supabase Setup for Audifyx

Your Supabase instance is connected! Now we need to create the database tables.

## Setup Steps (2 minutes):

### 1. Open Your Supabase Dashboard
Go to: **https://uhvwsuvfgyjjuokkmuzp.supabase.co**

### 2. Access SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**

### 3. Copy & Run the Setup SQL
Copy the entire content from `SETUP_SUPABASE.sql` file and paste it into the SQL editor, then click **"Run"**.

This will create:
- ✅ **Users table** (empty, ready for real users)
- ✅ **Tracks table** (empty, ready for real music)
- ✅ **Playlists table** (empty, ready for collections)
- ✅ **Messages tables** (empty, ready for conversations)  
- ✅ **Security policies** for public access

### 4. Create Storage Buckets (Optional)
1. Go to **"Storage"** in the left sidebar
2. Click **"Create bucket"**
3. Create bucket named: `audio-files` (Public: Yes)
4. Create bucket named: `images` (Public: Yes)

### 5. Restart Your App
The app will now connect to your database with sample data!

## What You'll Get:
- **Empty database** ready for your real users
- **Clean tables** with proper structure
- **Authentication system** ready
- **File upload** capability
- **Real-time messaging** system

## Verification:
In the app, go to Messages → Menu → "System Status" to verify connection.

---
**Connection Status: ✅ Connected to your Supabase instance**