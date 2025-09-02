#!/bin/bash

# Test automation loop for PlantUML Lambda
set -e

PORT=3001
SAM_PID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING: $1${NC}"
}

# Cleanup function
cleanup() {
    if [ ! -z "$SAM_PID" ]; then
        log "Stopping SAM local (PID: $SAM_PID)"
        kill $SAM_PID 2>/dev/null || true
        wait $SAM_PID 2>/dev/null || true
    fi
    
    # Kill any process using port 3001
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
}

# Trap cleanup on exit
trap cleanup EXIT INT TERM

# Build Lambda
build_lambda() {
    log "Building Lambda..."
    sam build
    if [ $? -ne 0 ]; then
        error "Build failed"
        return 1
    fi
    log "Build successful"
}

# Start SAM local
start_sam() {
    log "Starting SAM local on port $PORT..."
    cleanup  # Kill any existing processes
    
    AWS_ACCESS_KEY_ID=dummy AWS_SECRET_ACCESS_KEY=dummy AWS_DEFAULT_REGION=eu-north-1 NODE_ENV=development \
    sam local start-api --port $PORT --skip-pull-image > sam.log 2>&1 &
    
    SAM_PID=$!
    log "SAM local started with PID: $SAM_PID"
    
    # Wait for SAM to be ready
    log "Waiting for SAM local to be ready..."
    for i in {1..30}; do
        if curl -s http://127.0.0.1:$PORT/health > /dev/null 2>&1; then
            log "SAM local is ready"
            return 0
        fi
        sleep 1
    done
    
    error "SAM local failed to start"
    return 1
}

# Test the endpoint
test_endpoint() {
    log "Testing PlantUML endpoint..."
    
    local response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "source": "@startuml\nAlice -> Bob: Hello\nBob -> Alice: Hi there\n@enduml",
            "format": "svg"
        }' \
        http://127.0.0.1:$PORT/render)
    
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    log "HTTP Status: $status"
    
    if [ "$status" = "200" ]; then
        if echo "$body" | grep -q "PlantUML Error\|Generated fallback SVG"; then
            warn "Response contains fallback/error SVG"
            echo "$body" | head -c 200
            return 1
        else
            log "SUCCESS: Proper PlantUML SVG generated"
            echo "$body" | head -c 200
            return 0
        fi
    else
        error "HTTP error $status"
        echo "$body"
        return 1
    fi
}

# Check SAM logs for errors
check_logs() {
    log "Checking SAM logs for errors..."
    
    if [ -f sam.log ]; then
        if grep -q "PlantUML rendering failed\|Using fallback SVG\|PlantUML jar not found" sam.log; then
            warn "Found PlantUML errors in logs:"
            grep -A 2 -B 2 "PlantUML rendering failed\|Using fallback SVG\|PlantUML jar not found" sam.log | tail -10
            return 1
        else
            log "No PlantUML errors found in logs"
            return 0
        fi
    else
        warn "No SAM log file found"
        return 1
    fi
}

# Main test loop
main() {
    log "Starting PlantUML Lambda test automation"
    
    # Build and test
    if ! build_lambda; then
        exit 1
    fi
    
    if ! start_sam; then
        exit 1
    fi
    
    sleep 3  # Give SAM a moment to fully start
    
    if test_endpoint && check_logs; then
        log "🎉 SUCCESS: PlantUML Lambda is working correctly!"
        exit 0
    else
        error "❌ FAILED: PlantUML Lambda has issues"
        
        log "SAM log tail:"
        tail -20 sam.log 2>/dev/null || echo "No logs available"
        
        exit 1
    fi
}

main "$@"