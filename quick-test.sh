#!/bin/bash

# Quick test of PlantUML renderer locally
echo "🧪 Testing PlantUML renderer locally..."

cd services/renderer

# Build first
echo "📦 Building..."
npm run build

# Start SAM local in background
echo "🚀 Starting SAM local..."
npm run local &
SAM_PID=$!

# Wait for startup
echo "⏳ Waiting for SAM to start..."
sleep 10

# Test health endpoint first
echo "🔍 Testing health endpoint..."
if curl -f http://localhost:3001/health 2>/dev/null; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed - SAM may not be ready"
fi

# Test simple PlantUML without auth for now
echo "🧪 Testing basic diagram..."
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -d '{
    "source": "@startuml\nAlice -> Bob: Hello\n@enduml",
    "format": "svg"
  }' -o test.svg -w "%{http_code}" -s

HTTP_CODE=$?
if [ $HTTP_CODE -eq 0 ] && [ -f test.svg ] && grep -q "<svg" test.svg 2>/dev/null; then
  echo "✅ SVG generation works!"
  echo "📄 Output saved to test.svg"
  head -5 test.svg
else
  echo "❌ SVG generation failed"
  echo "Response:"
  cat test.svg 2>/dev/null || echo "No output file"
fi

# Cleanup
echo "🧹 Cleaning up..."
kill $SAM_PID 2>/dev/null
rm -f test.svg