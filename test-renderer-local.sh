#!/bin/bash

# Test PlantUML renderer locally with SAM
set -e

echo "🚀 Starting local PlantUML renderer..."

# Start SAM local API in background
cd services/renderer
sam local start-api --port 3001 &
SAM_PID=$!

# Wait for SAM to start
echo "⏳ Waiting for SAM to start..."
sleep 10

# Test with sample PlantUML
echo "🧪 Testing PlantUML rendering..."

# Create JWT token for auth
JWT_SECRET="test-secret-key-for-local-development"
JWT_PAYLOAD='{"iss":"plantuml-confluence","iat":'$(date +%s)',"exp":'$(($(date +%s) + 60))',"nonce":"test-'$(date +%s)'"}'
JWT_TOKEN=$(echo -n "$JWT_PAYLOAD" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 | tr -d '\n')

# Test SVG rendering
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "source": "@startuml\nAlice -> Bob: Hello\nBob -> Alice: Hi there\n@enduml",
    "format": "svg"
  }' \
  -o test-output.svg

echo "✅ SVG output saved to test-output.svg"

# Test PNG rendering
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "source": "@startuml\nAlice -> Bob: Hello\nBob -> Alice: Hi there\n@enduml",
    "format": "png"
  }' \
  -o test-output.png

echo "✅ PNG output saved to test-output.png"

# Cleanup
kill $SAM_PID
echo "🧹 Cleaned up SAM process"