#!/bin/bash
# Production server - Mastra serves both API and static files on port 5000

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 DarkWave Production Server Starting...${NC}"

# Build the frontend first
echo -e "${BLUE}📦 Building frontend...${NC}"
cd darkwave-web
npm run build
cd ..

# Copy built files to public directory for Mastra to serve
echo -e "${BLUE}📂 Copying built files to public...${NC}"
rm -rf public/assets
cp -r darkwave-web/dist/* public/

# Start Mastra on port 5000 (production port)
echo -e "${GREEN}🎨 Starting Mastra server on port 5000...${NC}"
PORT=5000 npm run dev
