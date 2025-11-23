#!/bin/bash
# Run both Mastra (backend) and Vite (frontend)

# Start Vite on port 5000 from darkwave-web (this must run in foreground)
cd darkwave-web && npm run dev
