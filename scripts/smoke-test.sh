#!/bin/bash
set -e

RENDERER_URL=${1:-"http://localhost:3001"}
echo "🧪 Running smoke tests against: $RENDERER_URL"

# Test 1: Health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -f "$RENDERER_URL/health" || echo "FAILED")
if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed: $HEALTH_RESPONSE"
    exit 1
fi

# Test 2: Simple diagram rendering
echo "Testing diagram rendering..."
TEST_PAYLOAD='{"source":"@startuml\nAlice -> Bob: Test\n@enduml","format":"svg"}'

if [[ "$RENDERER_URL" == *"localhost"* ]]; then
    # Local development - no JWT needed
    RENDER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$RENDERER_URL/render" \
        -H "Content-Type: application/json" \
        -d "$TEST_PAYLOAD" || echo "000")
    
    if [[ "$RENDER_STATUS" == "200" ]]; then
        echo "✅ Render endpoint working (local development mode)"
    else
        echo "❌ Render endpoint failed with status: $RENDER_STATUS"
        exit 1
    fi
else
    # Deployed environment - JWT required, expect 401 without proper JWT
    RENDER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$RENDERER_URL/render" \
        -H "Content-Type: application/json" \
        -d "$TEST_PAYLOAD" || echo "000")
    
    if [[ "$RENDER_STATUS" == "401" ]]; then
        echo "✅ Render endpoint accessible (401 expected without JWT)"
    elif [[ "$RENDER_STATUS" == "200" ]]; then
        echo "✅ Render endpoint working (development environment?)"
    else
        echo "❌ Render endpoint failed with status: $RENDER_STATUS"
        exit 1
    fi
fi

echo "🎉 All smoke tests passed!"