# 🚀 EAS (Expo Application Services) Setup Guide

## Project Configuration Complete! ✅

Your music social platform is now configured for EAS with project ID: `5d72a71e-9d9b-43ad-a3cd-85a2cd60296d`

## What's Already Configured

### ✅ EAS Configuration (`eas.json`)
- **Development builds** - For testing with Expo Go
- **Preview builds** - For internal distribution  
- **Production builds** - For app store submission
- **Resource classes** - Optimized build performance

### ✅ App Configuration (`app.json`)
- **Project ID** linked to your EAS account
- **Bundle identifiers** for iOS and Android
- **Build settings** and version management
- **Update configuration** for over-the-air updates

## Complete Setup Instructions

### 1. **Install EAS CLI Globally**
```bash
npm install -g @expo/eas-cli
```

### 2. **Login to Your Expo Account**
```bash
eas login
# Use your Expo account credentials
```

### 3. **Verify Project Connection**
```bash
eas project:info
# Should show your project: 5d72a71e-9d9b-43ad-a3cd-85a2cd60296d
```

### 4. **Configure Credentials**
```bash
# For iOS (if you have Apple Developer account)
eas credentials:configure -p ios

# For Android (Google Play Console)
eas credentials:configure -p android
```

## Building Your App

### 🛠️ Development Builds
```bash
# Build for development testing
eas build --platform all --profile development

# Install on device for testing
eas build:install
```

### 📱 Preview Builds
```bash
# Build for internal testing
eas build --platform all --profile preview

# Share with team members
eas build:list
```

### 🚀 Production Builds
```bash
# Build for app store submission
eas build --platform all --profile production

# Check build status
eas build:list
```

## App Store Submission

### 🍎 iOS App Store
```bash
# Submit to Apple App Store
eas submit --platform ios

# You'll need:
# - Apple Developer Account ($99/year)
# - App Store Connect app configured
# - App icons and screenshots ready
```

### 🤖 Google Play Store
```bash
# Submit to Google Play Store
eas submit --platform android

# You'll need:
# - Google Play Console account ($25 one-time)
# - Service account key (for automated uploads)
# - Store listing and screenshots ready
```

## Over-the-Air Updates

### 📦 Publish Updates
```bash
# Publish updates without app store review
eas update --branch production --message "Bug fixes and improvements"

# Create preview updates
eas update --branch preview --message "Testing new features"
```

### 🔄 Update Channels
- **Production**: Live app updates
- **Preview**: Internal testing updates  
- **Development**: Development testing

## Asset Requirements

### 📱 App Icons
Create these files in `assets/` directory:
- `icon.png` - 1024x1024px
- `adaptive-icon.png` - 1024x1024px (Android)
- `favicon.png` - 48x48px (Web)

### 🎨 Splash Screen
- `splash.png` - 1284x2778px or larger

### 🖼️ Store Assets
- App screenshots for each platform
- App Store/Play Store descriptions
- Privacy policy and terms of service

## Environment Variables

### 🔐 Secure Environment Variables
```bash
# Add secrets for production builds
eas secret:create --name SUPABASE_URL --value your_supabase_url
eas secret:create --name SUPABASE_ANON_KEY --value your_anon_key
eas secret:create --name OPENAI_API_KEY --value your_openai_key

# List all secrets
eas secret:list
```

## Workflow Integration

### 🔄 GitHub Actions Integration
Your `.github/workflows/deploy.yml` already includes EAS build commands:

```yaml
- name: Build mobile app
  run: eas build --platform all --non-interactive --no-wait
  env:
    EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### 🔧 Required GitHub Secrets
Add to your repository secrets:
- `EXPO_TOKEN` - Get from https://expo.dev/accounts/[account]/settings/access-tokens

## Build Profiles Explained

### 🧪 Development Profile
```json
"development": {
  "developmentClient": true,
  "distribution": "internal"
}
```
- Includes dev tools and debugging
- For testing with development builds
- Can be installed alongside production app

### 👀 Preview Profile  
```json
"preview": {
  "distribution": "internal",
  "ios": { "simulator": true },
  "android": { "buildType": "apk" }
}
```
- Internal distribution only
- For team testing and demos
- iOS simulator builds included

### 🚀 Production Profile
```json
"production": {
  "ios": { "resourceClass": "m-medium" },
  "android": { "resourceClass": "medium" }
}
```
- Optimized for app store submission
- Maximum performance and security
- Release-ready builds

## Troubleshooting Common Issues

### ❌ Build Failures
```bash
# Check build logs
eas build:list
eas build:view [build-id]

# Clear cache and retry
eas build --clear-cache
```

### 🔐 Credential Issues
```bash
# Reset credentials
eas credentials:configure -p ios --clear-provisioning-profile
eas credentials:configure -p android --clear-all
```

### 📱 Installation Issues
```bash
# Check device compatibility
eas device:list

# Create development build for testing
eas build --platform ios --profile development
```

## Performance Optimization

### ⚡ Build Speed
- Use appropriate resource classes
- Enable caching where possible
- Optimize asset sizes

### 📦 App Size
- Enable Hermes for Android
- Use asset bundling patterns
- Optimize images and audio files

### 🔄 Update Frequency
- Use OTA updates for quick fixes
- Full builds for major features
- Test updates thoroughly before publishing

## Monitoring and Analytics

### 📊 Build Analytics
```bash
# View build statistics
eas analytics

# Monitor crash reports
# (Configure in app.json with crash reporting service)
```

### 🎯 Performance Monitoring
- Configure crash reporting
- Monitor app performance
- Track user engagement

## Next Steps

1. **🎨 Create App Icons** - Design your brand assets
2. **🏗️ Run First Build** - Test the build process
3. **📱 Test on Devices** - Install and test functionality
4. **🛒 Prepare Store Listing** - Screenshots, descriptions
5. **🚀 Submit to Stores** - Apple App Store and Google Play

## 🎵 Your Music Platform is EAS-Ready! 

With this configuration, you can:
- ✅ Build for iOS and Android
- ✅ Submit to app stores
- ✅ Push over-the-air updates
- ✅ Manage multiple environments
- ✅ Scale to millions of users

**Ready to build your music empire! 🎶🚀**

For more details, visit: https://docs.expo.dev/eas/