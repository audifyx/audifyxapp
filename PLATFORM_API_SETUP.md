# Platform API Setup Guide

To enable SoundCloud, YouTube, and Spotify integration in Audifyx, you'll need to get API keys from each platform.

## 🎵 SoundCloud API

### Setup Steps:
1. Go to [SoundCloud Developers](https://developers.soundcloud.com/)
2. Click "Register a new application"
3. Fill in app details:
   - **App name**: Audifyx
   - **Description**: Music streaming and sharing app
   - **Website**: Your app URL
4. Get your **Client ID**
5. Add to `.env`: `EXPO_PUBLIC_SOUNDCLOUD_CLIENT_ID=your_client_id_here`

### Features Enabled:
- ✅ Full track streaming
- ✅ Track metadata (title, artist, duration)
- ✅ Album artwork
- ✅ Search functionality

## 📺 YouTube Data API

### Setup Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Restrict the key to YouTube Data API
6. Add to `.env`: `EXPO_PUBLIC_YOUTUBE_API_KEY=your_api_key_here`

### Features Enabled:
- ✅ Video metadata extraction
- ✅ Thumbnail images
- ✅ Search functionality
- ⚠️ Audio extraction requires additional service

### Audio Extraction:
YouTube doesn't provide direct audio URLs. You'll need:
- Third-party service like `youtube-dl` backend
- Or use YouTube's video player embed (video only)

## 🎧 Spotify Web API

### Setup Steps:
1. Go to [Spotify for Developers](https://developer.spotify.com/)
2. Click "Create an App"
3. Fill in app details:
   - **App name**: Audifyx
   - **App description**: Music streaming platform
4. Get your **Client ID** and **Client Secret**
5. Add to `.env`:
   ```
   EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
   EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

### Features Enabled:
- ✅ Track metadata
- ✅ Album artwork
- ✅ Search functionality
- ⚠️ Only 30-second previews (Spotify restriction)

### Limitations:
- Full tracks require Spotify Premium SDK
- Web API only provides 30-second previews
- Premium SDK requires special approval

## 🔧 Implementation Status

### Current State:
- ✅ Platform detection and URL parsing
- ✅ Mock API responses for testing
- ✅ Auto-preview in upload screen
- ✅ Platform-aware audio player
- ✅ Error handling and fallbacks

### With Real API Keys:
1. Replace mock responses with real API calls
2. Update URL endpoints in `src/api/platforms.ts`
3. Add proper authentication flows
4. Handle rate limiting and errors

## 🚀 Quick Test

To test with mock data (no API keys needed):
1. Paste any SoundCloud/YouTube/Spotify URL in upload
2. See preview with mock metadata
3. Upload creates track with platform info
4. Audio player shows appropriate messages

## 📝 Next Steps

1. **Get API keys** from platforms above
2. **Update `.env`** with your actual keys
3. **Test real API calls** in development
4. **Handle edge cases** (private tracks, geo-restrictions)
5. **Add caching** for better performance

## ⚠️ Important Notes

- **SoundCloud**: Best for full streaming
- **YouTube**: Needs audio extraction service
- **Spotify**: Limited to previews only
- **All platforms**: Respect rate limits and terms of service

## 💡 Alternative Approach

If API setup is complex, consider:
- Allowing users to upload audio files directly
- Using platform URLs for metadata only
- Implementing search across platforms
- Building playlist management features