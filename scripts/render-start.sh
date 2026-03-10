#!/bin/bash
# Render Start Script — Pulse
# Mastra dev builds and serves in one step (same approach as Replit production)
set -e

echo "🚀 [Render] Starting Pulse..."

export NODE_OPTIONS="--max-old-space-size=4096"
export PORT=${PORT:-5000}

# mastra dev builds on-the-fly and starts the server
npx mastra dev
