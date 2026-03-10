#!/bin/bash
# Render Build Script — Pulse
# Runs during Render deployment build phase
set -e

echo "📦 [Render] Build starting..."

# Set Node options
export NODE_OPTIONS="--max-old-space-size=4096"

# 1. Install ALL deps (devDependencies needed for build tools)
echo "📚 Installing backend dependencies..."
NODE_ENV=development npm install --legacy-peer-deps --ignore-scripts || npm install --legacy-peer-deps --force

# Rebuild native modules (bcrypt, etc.)
npm rebuild bcrypt 2>/dev/null || true

# 2. Install frontend dependencies
echo "📚 Installing frontend dependencies..."
cd darkwave-web
NODE_ENV=development npm install --legacy-peer-deps || npm install --force
cd ..

# 3. Build frontend
echo "🎨 Building frontend..."
cd darkwave-web
npm run build
cd ..

# 4. Copy frontend dist to public/ (Mastra serves static files from here)
echo "📂 Copying frontend build to public/..."
mkdir -p public
cp -r darkwave-web/dist/* public/

# 5. Create tools stub (required by mastra)
mkdir -p .mastra/.build
if [ ! -f ".mastra/.build/tools.mjs" ]; then
  echo 'export const tools = {};' > .mastra/.build/tools.mjs
  echo "✅ Created tools.mjs stub"
fi

# 6. Install .mastra/output deps if package.json exists
if [ -f ".mastra/output/package.json" ]; then
  echo "📚 Installing Mastra output dependencies..."
  npm install --prefix .mastra/output --legacy-peer-deps --omit=dev 2>/dev/null || true
fi

echo "✅ [Render] Build complete!"
