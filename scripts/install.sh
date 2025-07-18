#!/bin/bash

# Serenity Notes Installation Script
set -e

echo "🚀 Installing Serenity Notes dependencies..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from the root directory"
    exit 1
fi

echo "📦 Installing root dependencies..."
npm install --no-optional

echo "📦 Installing workspace dependencies..."
npm install --workspaces --no-optional

echo "🔧 Building packages..."
npm run build --workspaces --if-present

echo "✅ Installation completed successfully!"
echo ""
echo "Next steps:"
echo "  • Run './scripts/dev.sh' to start development"
echo "  • Or run 'npm run dev' to start all development servers"
echo ""
echo "📖 For more information, see README.md"