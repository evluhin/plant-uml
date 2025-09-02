#!/bin/bash

echo "🚀 Starting SAM Local with file watching..."
echo "Press Ctrl+C to stop"

# Function to start SAM local
start_sam() {
    echo "Starting SAM local..."
    AWS_ACCESS_KEY_ID=dummy AWS_SECRET_ACCESS_KEY=dummy AWS_DEFAULT_REGION=eu-north-1 NODE_ENV=development sam local start-api --port 3001 --env-vars .env.local --skip-pull-image &
    SAM_PID=$!
    echo "SAM local started with PID: $SAM_PID"
}

# Function to stop SAM local
stop_sam() {
    if [ ! -z "$SAM_PID" ]; then
        echo "Stopping SAM local (PID: $SAM_PID)..."
        kill $SAM_PID 2>/dev/null
        wait $SAM_PID 2>/dev/null
    fi
}

# Function to restart SAM local
restart_sam() {
    echo "📁 File change detected, rebuilding..."
    stop_sam
    sam build
    if [ $? -eq 0 ]; then
        start_sam
        echo "✅ SAM local restarted successfully"
    else
        echo "❌ Build failed, not restarting"
    fi
}

# Trap Ctrl+C to cleanup
trap 'echo "Stopping..."; stop_sam; exit 0' INT

# Initial build and start
sam build
start_sam

# Watch for file changes
echo "👀 Watching for changes in src/ directory..."
fswatch -o src/ | while read f; do
    restart_sam
done