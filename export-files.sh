#!/bin/bash

# 🎵 Music Social Platform - File Export Script
# This script helps you export all files for GitHub upload

echo "🎵 Music Social Platform - File Export"
echo "======================================"
echo ""

# Create export directory
EXPORT_DIR="music-social-platform-export"
rm -rf "$EXPORT_DIR"
mkdir -p "$EXPORT_DIR"

echo "📦 Copying project files..."

# Copy all important files and directories
cp -r src/ "$EXPORT_DIR/"
cp -r assets/ "$EXPORT_DIR/" 2>/dev/null || echo "ℹ️  No assets directory found"
cp -r .github/ "$EXPORT_DIR/"
cp -r patches/ "$EXPORT_DIR/" 2>/dev/null || echo "ℹ️  No patches directory found"

# Copy configuration files
cp App.tsx "$EXPORT_DIR/"
cp package.json "$EXPORT_DIR/"
cp tsconfig.json "$EXPORT_DIR/"
cp tailwind.config.js "$EXPORT_DIR/"
cp app.json "$EXPORT_DIR/"
cp babel.config.js "$EXPORT_DIR/"
cp metro.config.js "$EXPORT_DIR/"
cp global.css "$EXPORT_DIR/"
cp index.ts "$EXPORT_DIR/"
cp nativewind-env.d.ts "$EXPORT_DIR/"

# Copy environment and git files
cp .env.example "$EXPORT_DIR/"
cp .gitignore "$EXPORT_DIR/"
cp .prettierrc "$EXPORT_DIR/"
cp .eslintrc.js "$EXPORT_DIR/"

# Copy documentation
cp README.md "$EXPORT_DIR/"
cp DEPLOYMENT_GUIDE.md "$EXPORT_DIR/"
cp DEPLOYMENT_CHECKLIST.md "$EXPORT_DIR/"
cp FULL_DATABASE_SCHEMA.md "$EXPORT_DIR/"
cp UI_FEATURES_ROADMAP.md "$EXPORT_DIR/"
cp TECHNICAL_ARCHITECTURE.md "$EXPORT_DIR/"
cp GITHUB_SETUP_INSTRUCTIONS.md "$EXPORT_DIR/"

# Copy setup scripts
cp setup-git.sh "$EXPORT_DIR/"
cp export-files.sh "$EXPORT_DIR/"

# Copy SQL files for database setup
cp *.sql "$EXPORT_DIR/" 2>/dev/null || echo "ℹ️  No SQL files found"
cp *.md "$EXPORT_DIR/" 2>/dev/null || true

echo "✅ Files copied to $EXPORT_DIR/"
echo ""

# Show directory contents
echo "📋 Exported files:"
find "$EXPORT_DIR" -type f | head -20
echo "... and more"
echo ""

# Create a zip file
if command -v zip &> /dev/null; then
    ZIP_FILE="music-social-platform.zip"
    zip -r "$ZIP_FILE" "$EXPORT_DIR/" > /dev/null
    echo "📦 Created zip file: $ZIP_FILE"
    echo ""
fi

echo "🚀 Ready for GitHub upload!"
echo ""
echo "📋 Options to upload to https://github.com/Parallaxx203/update:"
echo ""
echo "Option 1 - Upload via GitHub Web:"
echo "1. Go to https://github.com/Parallaxx203/update"
echo "2. Click 'uploading an existing file'"
echo "3. Drag and drop the files from $EXPORT_DIR/"
echo "4. Add commit message and upload"
echo ""
echo "Option 2 - Use Git Command Line:"
echo "1. Clone the repository locally"
echo "2. Copy files from $EXPORT_DIR/ to your local repo"
echo "3. Git add, commit, and push"
echo ""
echo "Option 3 - Use the zip file:"
echo "1. Download $ZIP_FILE"
echo "2. Extract and upload to GitHub"
echo ""
echo "🎵 Your complete music social platform is ready to deploy!"