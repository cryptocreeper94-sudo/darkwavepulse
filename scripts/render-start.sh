#!/bin/bash
# Render Start Script — Pulse
# Uses pre-built Mastra output directly (artifacts committed to git)
set -e

echo "🚀 [Render] Starting Pulse..."

export NODE_OPTIONS="--max-old-space-size=4096"
export PORT=${PORT:-5000}
export HOST=0.0.0.0

# Run pre-built Mastra output directly
# Falls back to mastra dev if output doesn't exist
if [ -f ".mastra/output/index.mjs" ]; then
  echo "📡 Starting from pre-built Mastra output on port $PORT..."
  node .mastra/output/index.mjs
else
  echo "📡 No pre-built output found, using mastra dev on port $PORT..."
  npx mastra dev
fi
