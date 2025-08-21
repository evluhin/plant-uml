#!/bin/bash

# Local testing script for PlantUML renderer
set -e

echo "🧪 Testing PlantUML renderer locally..."

# Build first
echo "📦 Building..."
npm run build

# Kill any existing SAM process on port 3001
echo "🧹 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2

# Start SAM local in background
echo "🚀 Starting SAM local..."
npm run local &
SAM_PID=$!

# Wait for startup
echo "⏳ Waiting for SAM to start..."
sleep 15

# Test health endpoint
echo "🔍 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health || echo "failed")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed: $HEALTH_RESPONSE"
fi

# Test SVG rendering
echo "🧪 Testing SVG rendering..."
SVG_RESPONSE=$(curl -s -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "source": "@startuml\nAlice -> Bob: Hello\nBob -> Alice: Hi there\n@enduml",
    "format": "svg"
  }' || echo "failed")

if echo "$SVG_RESPONSE" | grep -q "svg"; then
  echo "✅ SVG rendering works!"
  echo "📄 Sample output:"
  echo "$SVG_RESPONSE" | head -3
else
  echo "❌ SVG rendering failed: $SVG_RESPONSE"
fi

# Test PNG rendering
echo "🧪 Testing PNG rendering..."
PNG_RESPONSE=$(curl -s -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "source": "@startuml\nAlice -> Bob: Hello\n@enduml",
    "format": "png"
  }' || echo "failed")

if echo "$PNG_RESPONSE" | grep -q "pngBase64"; then
  echo "✅ PNG rendering works!"
else
  echo "❌ PNG rendering failed: $PNG_RESPONSE"
fi

# Test error handling
echo "🧪 Testing error handling..."
ERROR_RESPONSE=$(curl -s -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"format": "svg"}' || echo "failed")

if echo "$ERROR_RESPONSE" | grep -q "error"; then
  echo "✅ Error handling works!"
else
  echo "❌ Error handling failed: $ERROR_RESPONSE"
fi

# Cleanup
echo "🧹 Cleaning up..."
kill $SAM_PID 2>/dev/null || true
sleep 2

echo "✅ Local testing complete!"