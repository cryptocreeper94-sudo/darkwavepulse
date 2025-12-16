#!/bin/bash
# Run Mastra (backend on port 3001), Public API (port 3002), and Vite (frontend on port 5000)

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 DarkWave Development Server Starting...${NC}"

# Step 1: Start Mastra backend on port 3001 in background
echo -e "${BLUE}📡 Starting Mastra backend on port 3001...${NC}"
PORT=3001 npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend PID: $BACKEND_PID${NC}"

# Wait for backend to be ready
echo -e "${BLUE}⏳ Waiting 4 seconds for backend to initialize...${NC}"
sleep 4

# Step 2: Start Public API server on port 3002 in background
echo -e "${BLUE}🔌 Starting Public API server on port 3002...${NC}"
npx tsx src/api/publicApiServer.ts &
PUBLIC_API_PID=$!
echo -e "${GREEN}✅ Public API PID: $PUBLIC_API_PID${NC}"

# Step 3: Start Vite frontend on port 5000 in foreground
echo -e "${BLUE}🎨 Starting Vite frontend on port 5000...${NC}"
cd darkwave-web
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID $PUBLIC_API_PID" EXIT
