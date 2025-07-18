#!/bin/bash

# Serenity Notes Development Script
set -e

echo "🛠️  Starting Serenity Notes in development mode..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from the root directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if packages are built
if [ ! -d "packages/core/dist" ]; then
    echo "🔨 Building packages for the first time..."
    npm run build
fi

echo "🚀 Starting development servers..."
echo ""
echo "Desktop app will be available at:"
echo "  • Renderer: http://localhost:3000"
echo "  • Electron: Will launch automatically"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start development
npm run dev