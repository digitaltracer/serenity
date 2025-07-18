#!/bin/bash

# Serenity Notes Build Script
set -e

echo "🚀 Building Serenity Notes..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from the root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build all packages
echo "🔨 Building packages..."
npm run build

# Build desktop application
echo "💻 Building desktop application..."
cd apps/desktop
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "Next steps:"
echo "  • Run 'npm run electron' to test the built app"
echo "  • Run 'npm run dist' to create distribution packages"
echo "  • Distribution files will be in apps/desktop/release/"