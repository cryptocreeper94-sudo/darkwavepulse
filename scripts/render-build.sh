#!/bin/bash
# Render Build Script — Pulse
# Runs during Render deployment build phase
set -e

echo "📦 [Render] Build starting..."

# 1. Install root (backend) dependencies
echo "📚 Installing backend dependencies..."
npm install --legacy-peer-deps

# 2. Install frontend dependencies
echo "📚 Installing frontend dependencies..."
cd darkwave-web
npm install
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

# 5. Build backend with esbuild
echo "🔧 Building backend..."
npx esbuild src/bootstrap.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=esm \
  --outfile=dist/bootstrap.mjs \
  --external:pg-native \
  --external:pg \
  --external:cpu-features \
  --external:ssh2 \
  --external:better-sqlite3 \
  --external:bun:sqlite

# 6. Build Mastra
echo "🤖 Building Mastra..."
NODE_OPTIONS='--max-old-space-size=4096' npx mastra build || true

# 7. Patch Mastra (fix uuid ESM import)
if [ -f "scripts/patch-mastra.sh" ]; then
  bash scripts/patch-mastra.sh || true
fi

if [ -f ".mastra/output/mastra.mjs" ]; then
  sed -i "s/import require\$\$0\$8\$1, { v4 as v4\$1 } from 'uuid';/import * as require\$\$0\$8\$1 from 'uuid'; const { v4: v4\$1 } = require\$\$0\$8\$1;/g" .mastra/output/mastra.mjs 2>/dev/null || true
fi

# 8. Install Mastra output deps
if [ -d ".mastra/output" ]; then
  npm install --prefix .mastra/output --legacy-peer-deps --omit=dev || true
fi

echo "✅ [Render] Build complete!"
