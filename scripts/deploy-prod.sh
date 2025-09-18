#!/bin/bash
set -e

# Deploy to Production Environment
echo "🚀 Deploying to Production Environment"
echo "====================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Production deployment confirmation
echo ""
log_warning "PRODUCTION DEPLOYMENT"
log_warning "This will deploy to the live production environment!"
echo ""
echo -n "Are you sure you want to continue? (yes/no): "
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "Production deployment cancelled"
    exit 0
fi

# Run tests first
log_info "Running pre-deployment tests..."
npm test || {
    log_error "Tests failed - aborting production deployment"
    exit 1
}
log_success "Tests passed"

# Deploy AWS Lambda
log_info "Deploying AWS Lambda renderer to production..."
cd services/renderer
sam build --cached
sam deploy --config-env prod --no-confirm-changeset --capabilities CAPABILITY_IAM || {
    if sam deploy --config-env prod --no-confirm-changeset --capabilities CAPABILITY_IAM 2>&1 | grep -q "No changes to deploy"; then
        log_success "AWS Lambda up to date"
    else
        log_error "AWS deployment failed"
        exit 1
    fi
}
cd ../..

# Get renderer URL
PROD_URL=$(aws cloudformation describe-stacks \
    --stack-name plantuml-renderer-prod \
    --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
    --output text)

# Deploy Forge app
log_info "Deploying Forge app to production..."
cd apps/forge-plantuml

# Get JWT secret
PROD_SECRET=$(aws ssm get-parameter \
    --name "/plantuml/renderer/jwt-secret-prod" \
    --with-decryption \
    --query 'Parameter.Value' \
    --output text)

# Update Forge variables
forge variables set RENDERER_URL "$PROD_URL" --environment production
forge variables set RENDERER_JWT_SECRET "$PROD_SECRET" --environment production

# Deploy
forge deploy --environment production --non-interactive --no-verify

cd ../..

# Health check
log_info "Running production health check..."
if curl -s -f "$PROD_URL/health" >/dev/null; then
    log_success "Production health check passed"
else
    log_error "Production health check failed - investigate immediately!"
    exit 1
fi

# Smoke test
log_info "Running production smoke test..."
if [ -f "scripts/smoke-test.sh" ]; then
    ./scripts/smoke-test.sh "$PROD_URL" || {
        log_error "Production smoke test failed - investigate immediately!"
        exit 1
    }
    log_success "Production smoke test passed"
fi

log_success "Production deployment complete!"
echo ""
echo "📋 Production Summary:"
echo "🔗 Renderer URL: $PROD_URL"
echo "📱 Forge Environment: production"
echo "🧪 Health Status: ✅ Healthy"
echo ""
echo "🚨 Post-Deployment Checklist:"
echo "  1. Monitor CloudWatch logs for errors"
echo "  2. Test PlantUML macro in production Confluence"
echo "  3. Verify diagram rendering performance"
echo "  4. Check error rates in next 30 minutes"
echo ""
log_success "Production deployment successful! 🎉"