#!/bin/bash
set -e

# Health Check Script
echo "🏥 PlantUML Health Check"
echo "======================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Get environment URLs
get_urls() {
    if [ -f ".env.local" ]; then
        source .env.local
        DEV_URL=$DEV_RENDERER_URL
        PROD_URL=$PROD_RENDERER_URL
    else
        # Fallback to CloudFormation
        DEV_URL=$(aws cloudformation describe-stacks \
            --stack-name plantuml-renderer-dev \
            --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
            --output text 2>/dev/null || echo "")
        
        PROD_URL=$(aws cloudformation describe-stacks \
            --stack-name plantuml-renderer-prod \
            --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
            --output text 2>/dev/null || echo "")
    fi
}

# Test endpoint health
test_endpoint() {
    local url=$1
    local name=$2
    
    log_info "Testing $name endpoint..."
    
    if [ -z "$url" ]; then
        log_error "$name URL not found"
        return 1
    fi
    
    # Test health endpoint
    local health_response
    health_response=$(curl -s -f "$url/health" 2>/dev/null || echo "FAILED")
    
    if [[ "$health_response" == *"healthy"* ]]; then
        log_success "$name health check passed"
        echo "   URL: $url"
        echo "   Response: $health_response"
    else
        log_error "$name health check failed"
        echo "   URL: $url"
        echo "   Response: $health_response"
        return 1
    fi
    
    # Test render endpoint (expect 401 without JWT)
    local render_status
    render_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url/render" \
        -H "Content-Type: application/json" \
        -d '{"source":"@startuml\nAlice -> Bob: Test\n@enduml","format":"svg"}' 2>/dev/null || echo "000")
    
    if [[ "$render_status" == "401" ]]; then
        log_success "$name authentication working (401 expected)"
    elif [[ "$render_status" == "200" ]]; then
        log_success "$name render endpoint accessible"
    else
        log_error "$name render endpoint failed (status: $render_status)"
        return 1
    fi
    
    echo ""
}

# Test local endpoint
test_local() {
    log_info "Testing local development endpoint..."
    
    local local_url="http://localhost:3001"
    local health_response
    health_response=$(curl -s -f "$local_url/health" 2>/dev/null || echo "FAILED")
    
    if [[ "$health_response" == *"healthy"* ]]; then
        log_success "Local development server running"
        echo "   URL: $local_url"
    else
        log_info "Local development server not running"
        echo "   Start with: ./scripts/dev.sh"
    fi
    echo ""
}

# Test Forge app configuration
test_forge_config() {
    log_info "Testing Forge app configuration..."
    
    cd apps/forge-plantuml 2>/dev/null || {
        log_error "Forge app directory not found"
        return 1
    }
    
    # Check development environment
    if forge variables list --environment development >/dev/null 2>&1; then
        log_success "Forge development environment configured"
    else
        log_error "Forge development environment not configured"
    fi
    
    # Check production environment
    if forge variables list --environment production >/dev/null 2>&1; then
        log_success "Forge production environment configured"
    else
        log_error "Forge production environment not configured"
    fi
    
    cd - >/dev/null
    echo ""
}

# Main health check
main() {
    get_urls
    
    # Test local development
    test_local
    
    # Test development environment
    if [ -n "$DEV_URL" ]; then
        test_endpoint "$DEV_URL" "Development"
    else
        log_error "Development environment not deployed"
        echo ""
    fi
    
    # Test production environment
    if [ -n "$PROD_URL" ]; then
        test_endpoint "$PROD_URL" "Production"
    else
        log_error "Production environment not deployed"
        echo ""
    fi
    
    # Test Forge configuration
    test_forge_config
    
    log_success "Health check complete!"
}

# Run health check
main "$@"