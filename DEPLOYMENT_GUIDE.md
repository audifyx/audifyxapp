# 🚀 Music Social Platform - Deployment Guide

## Overview
This guide helps you deploy the music social platform to external hosting while maintaining live updates from this development environment.

## 📋 Prerequisites

### Required Accounts
- **GitHub** (for code repository)
- **Vercel/Netlify** (for web deployment)
- **Expo** (for mobile app deployment)
- **Supabase** (for database - optional)
- **Cloudflare** (for CDN - optional)

### Local Requirements
```bash
# Node.js 18+
node --version

# Bun package manager
bun --version

# Git
git --version

# Expo CLI
npm install -g @expo/cli
```

## 🔄 Git Repository Setup

### 1. Create GitHub Repository
```bash
# Go to GitHub.com and create a new repository
# Name: music-social-platform
# Description: Premium music social platform with creator tools
# Visibility: Private (recommended) or Public
```

### 2. Add GitHub as Remote
```bash
# In your project directory
git remote add github https://github.com/YOUR_USERNAME/music-social-platform.git

# Verify remotes
git remote -v
# Should show both 'origin' and 'github'
```

### 3. Push to GitHub
```bash
# Push current code to GitHub
git push github main

# Set GitHub as upstream for future pushes
git branch --set-upstream-to=github/main main
```

## 📱 Mobile App Deployment (Expo)

### 1. Expo Account Setup
```bash
# Login to Expo
expo login

# Initialize Expo project (if not already done)
expo install

# Configure app.json for deployment
```

### 2. App Configuration
Update `app.json`:
```json
{
  "expo": {
    "name": "Music Social Platform",
    "slug": "music-social-platform",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.musicsocial"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "package": "com.yourcompany.musicsocial"
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

### 3. EAS Build Setup
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to EAS
eas login

# Initialize EAS
eas build:configure

# Build for development
eas build --platform all --profile development

# Build for production
eas build --platform all --profile production
```

### 4. App Store Deployment
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## 🌐 Web Deployment

### 1. Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# For production deployment
vercel --prod
```

### 2. Netlify Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build for web
expo export:web

# Deploy
netlify deploy --dir=web-build

# Production deployment
netlify deploy --prod --dir=web-build
```

### 3. Custom Domain Setup
```bash
# Vercel
vercel domains add yourdomain.com

# Netlify
netlify domains:create yourdomain.com
```

## 🗄️ Database Deployment

### 1. Supabase Project Setup
```sql
-- Create new Supabase project at supabase.com
-- Run the SQL schema from FULL_DATABASE_SCHEMA.md
-- Get your project URL and anon key

-- Update your .env file:
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Environment Variables
```bash
# For Vercel
vercel env add EXPO_PUBLIC_SUPABASE_URL
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY

# For Netlify
netlify env:set EXPO_PUBLIC_SUPABASE_URL your_value
netlify env:set EXPO_PUBLIC_SUPABASE_ANON_KEY your_value

# For Expo
# Add to app.json > expo > extra
```

## 🔄 Continuous Deployment Setup

### 1. GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy Music Social Platform

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: npx tsc --noEmit

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./

  deploy-mobile:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install -g @expo/eas-cli
      - run: bun install
      - name: Build mobile app
        run: eas build --platform all --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### 2. Automatic Deployments
```bash
# Vercel - connects automatically to GitHub
# Netlify - can connect via GitHub integration
# Expo - use EAS Build webhooks for auto-building
```

## 🔧 Development Workflow

### 1. Local Development + Live Updates
```bash
# Work in this environment (keeps live updates)
# Make changes to code
# Test features

# When ready to deploy:
git add .
git commit -m "feat: add new music discovery features"
git push github main  # Triggers automatic deployment
```

### 2. Branch Strategy
```bash
# Create feature branches for major changes
git checkout -b feature/live-streaming
# Make changes
git commit -m "feat: add live streaming interface"
git push github feature/live-streaming
# Create pull request on GitHub
# Merge to main when ready
```

### 3. Environment Sync
```bash
# Pull changes from external repository
git pull github main

# Push updates from this environment
git push github main
```

## 📊 Monitoring & Analytics

### 1. Vercel Analytics
```javascript
// Add to your app
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      {/* Your app */}
      <Analytics />
    </>
  );
}
```

### 2. Expo Analytics
```javascript
// Add to App.tsx
import * as Analytics from 'expo-analytics';

// Track events
Analytics.track('user_signup', {
  method: 'email',
  user_type: 'artist'
});
```

## 🔒 Security Configuration

### 1. Environment Variables
```bash
# Never commit sensitive data
# Use environment variables for:
- API keys
- Database URLs
- Secret tokens
- Third-party credentials

# Example .env.example file
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### 2. CORS Configuration
```javascript
// For web deployment, configure CORS in Supabase
// Authentication > Settings > CORS
// Add your domain: https://yourapp.vercel.app
```

## 🚀 Quick Start Commands

### Deploy Everything
```bash
# 1. Push to GitHub
git add . && git commit -m "deploy: latest features" && git push github main

# 2. Deploy web app
vercel --prod

# 3. Build mobile app
eas build --platform all --profile production

# 4. Submit to app stores
eas submit --platform all
```

### Update Production
```bash
# Make changes in this environment
# Test thoroughly
# Then deploy:
git add . && git commit -m "update: your changes" && git push github main
# Automatic deployment will trigger
```

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] All TypeScript errors fixed
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Assets optimized (images, audio)
- [ ] App icons and splash screens ready
- [ ] App store metadata prepared

### Web Deployment
- [ ] Vercel/Netlify project created
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Environment variables set
- [ ] Analytics configured

### Mobile Deployment
- [ ] Expo account set up
- [ ] EAS project configured
- [ ] App store accounts ready
- [ ] App icons and screenshots prepared
- [ ] Privacy policy and terms ready

### Post-Deployment
- [ ] Test all features in production
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Set up monitoring alerts
- [ ] Plan update schedule

## 🆘 Troubleshooting

### Common Issues
```bash
# Build errors
bun install && npx tsc --noEmit

# Expo build fails
expo doctor
eas build:configure

# Deployment fails
vercel logs
netlify logs

# Database connection issues
Check environment variables
Verify Supabase project settings
```

### Getting Help
- **Expo**: https://docs.expo.dev/
- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs
- **GitHub Actions**: https://docs.github.com/actions

## 🎯 Next Steps

1. **Create GitHub repository**
2. **Set up Vercel/Netlify account** 
3. **Configure Expo project**
4. **Deploy database to Supabase**
5. **Set up continuous deployment**
6. **Test production deployment**
7. **Monitor and optimize**

This setup allows you to:
- ✅ Work in this live environment
- ✅ Deploy to external hosting
- ✅ Maintain automatic updates
- ✅ Scale to production
- ✅ Monitor performance

Ready to deploy! 🚀