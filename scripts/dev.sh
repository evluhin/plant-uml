#!/bin/bash
set -e

# Local Development Setup
echo "🛠️  Starting Local Development Environment"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if SAM is available
if ! command -v sam &> /dev/null; then
    echo "❌ SAM CLI not found. Please install AWS SAM CLI first."
    exit 1
fi

# Start local renderer
log_info "Starting local PlantUML renderer..."
cd services/renderer

# Build if needed
if [ ! -d ".aws-sam" ]; then
    log_info "Building SAM application..."
    sam build
fi

# Start local API
log_info "Starting local API on port 3001..."
log_warning "Keep this terminal open - local renderer running"
echo ""
echo "🔗 Local renderer: http://localhost:3001"
echo "🧪 Health check: curl http://localhost:3001/health"
echo ""
echo "📝 In another terminal, run:"
echo "   cd apps/forge-plantuml"
echo "   forge tunnel"
echo ""

# Set development environment
export NODE_ENV=development

# Start SAM local API
sam local start-api --port 3001