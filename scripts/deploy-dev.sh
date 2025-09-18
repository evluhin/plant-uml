#!/bin/bash
set -e

# Deploy to Development Environment
echo "🚀 Deploying to Development Environment"
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Deploy AWS Lambda
log_info "Deploying AWS Lambda renderer..."
cd services/renderer
sam build --cached
sam deploy --config-env dev --no-confirm-changeset --capabilities CAPABILITY_IAM || {
    if sam deploy --config-env dev --no-confirm-changeset --capabilities CAPABILITY_IAM 2>&1 | grep -q "No changes to deploy"; then
        log_success "AWS Lambda up to date"
    else
        echo "❌ AWS deployment failed"
        exit 1
    fi
}
cd ../..

# Get renderer URL
DEV_URL=$(aws cloudformation describe-stacks \
    --stack-name plantuml-renderer-dev \
    --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
    --output text)

# Deploy Forge app
log_info "Deploying Forge app..."
cd apps/forge-plantuml

# Get JWT secret
DEV_SECRET=$(aws ssm get-parameter \
    --name "/plantuml/renderer/jwt-secret-dev" \
    --with-decryption \
    --query 'Parameter.Value' \
    --output text)

# Update Forge variables
forge variables set RENDERER_URL "$DEV_URL" --environment development
forge variables set RENDERER_JWT_SECRET "$DEV_SECRET" --environment development

# Deploy
forge deploy --environment development --non-interactive --no-verify

cd ../..

# Health check
log_info "Running health check..."
if curl -s -f "$DEV_URL/health" >/dev/null; then
    log_success "Health check passed"
else
    echo "⚠️  Health check failed - check logs"
fi

log_success "Development deployment complete!"
echo "🔗 Renderer URL: $DEV_URL"
echo "📱 Test in Confluence: Add PlantUML macro to a page"