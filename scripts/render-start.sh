#!/bin/bash
# Render Start Script — Pulse
# Runs the production server on Render
set -e

echo "🚀 [Render] Starting Pulse..."

# Start Mastra server (serves both API and static frontend)
PORT=${PORT:-5000} npx mastra dev
