#!/bin/bash
export NODE_OPTIONS="--max-old-space-size=1024"

while true; do
  node dist/bootstrap.mjs
  EXIT_CODE=$?
  echo "[run.sh] Process exited with code $EXIT_CODE, restarting in 3 seconds..."
  sleep 3
done
