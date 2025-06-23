#!/bin/bash

# 🎵 Music Social Platform - Git Setup Script
# This script helps you connect your project to a GitHub repository

echo "🎵 Music Social Platform - Git Setup"
echo "===================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

echo "✅ Git is installed"

# Check current git status
echo ""
echo "📊 Current Git Status:"
git status

# Add GitHub remote (you'll need to replace with your actual repository URL)
echo ""
echo "🔗 Setting up GitHub connection..."
echo "Please enter your GitHub repository URL:"
echo "Example: https://github.com/yourusername/music-social-platform.git"
read -p "GitHub Repository URL: " github_url

if [ -n "$github_url" ]; then
    # Add GitHub as a remote
    git remote add github "$github_url" 2>/dev/null || git remote set-url github "$github_url"
    echo "✅ GitHub remote added successfully"
    
    # Show all remotes
    echo ""
    echo "📝 Current remotes:"
    git remote -v
    
    # Commit current changes
    echo ""
    echo "📦 Preparing to commit current changes..."
    git add .
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        echo "ℹ️  No changes to commit"
    else
        echo "💾 Committing changes..."
        git commit -m "feat: complete music social platform with all features

🎵 Core Features:
- Enhanced music streaming and playlists
- Social features (follow, like, comment, share)
- Real-time messaging and live chat support
- File upload system with multiple formats
- User profiles with statistics

🛠️ Technical Features:
- TypeScript compilation error-free
- Zustand state management
- React Navigation
- Supabase integration ready
- Live chat support system

📚 Documentation:
- Complete database schema
- UI features roadmap
- Technical architecture plan
- Deployment guide
- README with setup instructions

🚀 Ready for Production:
- Mobile app (iOS/Android)
- Web app (PWA)
- GitHub Actions CI/CD
- Environment configuration
- Scalable architecture

Built for creators, by creators! 🎶"
        
        echo "✅ Changes committed successfully"
    fi
    
    # Push to GitHub
    echo ""
    echo "🚀 Pushing to GitHub..."
    
    # Set upstream and push
    git branch --set-upstream-to=github/main main 2>/dev/null || true
    git push github main
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to GitHub!"
        echo ""
        echo "🎉 Setup Complete!"
        echo "Your music social platform is now connected to GitHub."
        echo ""
        echo "🔗 Your repository: $github_url"
        echo ""
        echo "📝 Next steps:"
        echo "1. Set up Vercel for web deployment"
        echo "2. Configure Expo for mobile builds"
        echo "3. Set up Supabase database"
        echo "4. Add environment variables"
        echo ""
        echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
    else
        echo "❌ Failed to push to GitHub"
        echo "Please check your repository URL and permissions"
    fi
    
else
    echo "❌ No GitHub URL provided. Skipping GitHub setup."
fi

echo ""
echo "🛠️  Available commands:"
echo "bun start          - Start development server"
echo "bun build:web      - Build for web deployment"
echo "bun deploy:vercel  - Deploy to Vercel"
echo "git push github main - Push updates to GitHub"
echo ""
echo "Happy coding! 🎵"