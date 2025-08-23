#!/bin/bash

# Kill any existing Next.js dev servers
echo "Checking for existing Next.js dev servers..."
pids=$(ps aux | grep -E 'next-server|next dev' | grep -v grep | awk '{print $2}')

if [ ! -z "$pids" ]; then
    echo "Found existing dev servers. Killing processes: $pids"
    echo $pids | xargs kill -9 2>/dev/null
    sleep 2
fi

# Start dev server with memory limit
echo "Starting development server with 2GB memory limit..."
NODE_OPTIONS="--max-old-space-size=2048" pnpm dev