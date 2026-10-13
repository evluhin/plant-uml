#!/bin/bash
set -e

# PlantUML Confluence Cloud App - Automated Setup Script
# This script sets up the complete development and production environment

echo "🚀 PlantUML Confluence Cloud App - Automated Setup"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check Java
    if command_exists java; then
        JAVA_VERSION=$(java -version 2>&1 | head -n1 | cut -d'"' -f2 | cut -d'.' -f1)
        if [ "$JAVA_VERSION" -ge 11 ]; then
            log_success "Java $JAVA_VERSION found"
        else
            log_error "Java 11+ required, found Java $JAVA_VERSION"
            missing_tools+=("java-11+")
        fi
    else
        log_error "Java not found"
        missing_tools+=("java-11+")
    fi
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 20 ]; then
            log_success "Node.js v$NODE_VERSION found"
        else
            log_error "Node.js 20+ required, found v$NODE_VERSION"
            missing_tools+=("nodejs-20+")
        fi
    else
        log_error "Node.js not found"
        missing_tools+=("nodejs-20+")
    fi
    
    # Check AWS CLI
    if command_exists aws; then
        log_success "AWS CLI found"
        # Test AWS credentials
        if aws sts get-caller-identity >/dev/null 2>&1; then
            log_success "AWS credentials configured"
        else
            log_error "AWS credentials not configured"
            log_info "Run: aws configure"
            exit 1
        fi
    else
        log_error "AWS CLI not found"
        missing_tools+=("awscli")
    fi
    
    # Check SAM CLI
    if command_exists sam; then
        log_success "SAM CLI found"
    else
        log_error "SAM CLI not found"
        missing_tools+=("aws-sam-cli")
    fi
    
    # Check Forge CLI
    if command_exists forge; then
        log_success "Forge CLI found"
    else
        log_warning "Forge CLI not found - will install"
        npm install -g @forge/cli
        log_success "Forge CLI installed"
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install missing tools and run setup again"
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Get user input for configuration
get_configuration() {
    log_info "Configuration setup..."
    
    # Get Forge credentials
    if [ -z "$FORGE_EMAIL" ]; then
        echo -n "Enter your Forge email: "
        read -r FORGE_EMAIL
    fi
    
    if [ -z "$FORGE_API_TOKEN" ]; then
        echo -n "Enter your Forge API token: "
        read -rs FORGE_API_TOKEN
        echo ""
    fi
    
    # Get AWS region
    if [ -z "$AWS_DEFAULT_REGION" ]; then
        echo -n "Enter AWS region (default: eu-north-1): "
        read -r AWS_REGION
        AWS_REGION=${AWS_REGION:-eu-north-1}
        export AWS_DEFAULT_REGION=$AWS_REGION
    fi
    
    log_success "Configuration collected"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Root dependencies
    npm install
    log_success "Root dependencies installed"
    
    # Renderer dependencies
    cd services/renderer
    if [ -f "package.json" ]; then
        npm install
        log_success "Renderer dependencies installed"
    fi
    cd ../..
    
    # Forge app dependencies
    cd apps/forge-plantuml
    npm install
    log_success "Forge app dependencies installed"
    cd ../..
}

# Create JWT secrets
create_jwt_secrets() {
    log_info "Creating JWT secrets in AWS SSM..."
    
    # Development secret
    if aws ssm get-parameter --name "/plantuml/renderer/jwt-secret-dev" >/dev/null 2>&1; then
        log_warning "Development JWT secret already exists"
    else
        DEV_SECRET=$(openssl rand -base64 32)
        aws ssm put-parameter \
            --name "/plantuml/renderer/jwt-secret-dev" \
            --value "$DEV_SECRET" \
            --type "SecureString" \
            --description "JWT secret for PlantUML renderer - DEV"
        log_success "Development JWT secret created"
    fi
    
    # Production secret
    if aws ssm get-parameter --name "/plantuml/renderer/jwt-secret-prod" >/dev/null 2>&1; then
        log_warning "Production JWT secret already exists"
    else
        PROD_SECRET=$(openssl rand -base64 32)
        aws ssm put-parameter \
            --name "/plantuml/renderer/jwt-secret-prod" \
            --value "$PROD_SECRET" \
            --type "SecureString" \
            --description "JWT secret for PlantUML renderer - PROD"
        log_success "Production JWT secret created"
    fi
}

# Deploy AWS Lambda services
deploy_aws_services() {
    log_info "Deploying AWS Lambda services..."
    
    cd services/renderer
    
    # Build SAM application
    log_info "Building SAM application..."
    sam build
    log_success "SAM build completed"
    
    # Deploy development environment
    log_info "Deploying to development environment..."
    sam deploy --config-env dev --no-confirm-changeset --capabilities CAPABILITY_IAM
    
    # Get development URL
    DEV_URL=$(aws cloudformation describe-stacks \
        --stack-name plantuml-renderer-dev \
        --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
        --output text)
    log_success "Development environment deployed: $DEV_URL"
    
    # Deploy production environment
    log_info "Deploying to production environment..."
    sam deploy --config-env prod --no-confirm-changeset --capabilities CAPABILITY_IAM
    
    # Get production URL
    PROD_URL=$(aws cloudformation describe-stacks \
        --stack-name plantuml-renderer-prod \
        --query 'Stacks[0].Outputs[?OutputKey==`RendererApiUrl`].OutputValue' \
        --output text)
    log_success "Production environment deployed: $PROD_URL"
    
    cd ../..
    
    # Export URLs for later use
    export DEV_URL
    export PROD_URL
}

# Configure and deploy Forge app
deploy_forge_app() {
    log_info "Configuring and deploying Forge app..."
    
    cd apps/forge-plantuml
    
    # Login to Forge
    log_info "Logging into Forge..."
    forge login --email "$FORGE_EMAIL" --token "$FORGE_API_TOKEN" --non-interactive
    log_success "Forge login successful"
    
    # Get JWT secrets
    DEV_SECRET=$(aws ssm get-parameter \
        --name "/plantuml/renderer/jwt-secret-dev" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text)
    
    PROD_SECRET=$(aws ssm get-parameter \
        --name "/plantuml/renderer/jwt-secret-prod" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text)
    
    # Configure development environment
    log_info "Configuring development environment..."
    forge variables set RENDERER_URL "$DEV_URL" --environment development
    forge variables set RENDERER_JWT_SECRET "$DEV_SECRET" --environment development
    log_success "Development environment configured"
    
    # Configure production environment
    log_info "Configuring production environment..."
    forge variables set RENDERER_URL "$PROD_URL" --environment production
    forge variables set RENDERER_JWT_SECRET "$PROD_SECRET" --environment production
    log_success "Production environment configured"
    
    # Deploy to development
    log_info "Deploying to Forge development environment..."
    forge deploy --environment development --non-interactive --no-verify
    log_success "Forge development deployment completed"
    
    # Deploy to production
    log_info "Deploying to Forge production environment..."
    forge deploy --environment production --non-interactive --no-verify
    log_success "Forge production deployment completed"
    
    cd ../..
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Test development endpoint
    log_info "Testing development endpoint..."
    if curl -s -f "$DEV_URL/health" >/dev/null; then
        log_success "Development endpoint healthy"
    else
        log_error "Development endpoint health check failed"
    fi
    
    # Test production endpoint
    log_info "Testing production endpoint..."
    if curl -s -f "$PROD_URL/health" >/dev/null; then
        log_success "Production endpoint healthy"
    else
        log_error "Production endpoint health check failed"
    fi
    
    # Run smoke tests if available
    if [ -f "scripts/smoke-test.sh" ]; then
        log_info "Running smoke tests..."
        ./scripts/smoke-test.sh "$DEV_URL"
        log_success "Smoke tests passed"
    fi
}

# Create environment file
create_env_file() {
    log_info "Creating environment configuration..."
    
    cat > .env.local << EOF
# PlantUML Confluence App - Local Environment Configuration
# Generated by setup script on $(date)

# AWS Configuration
AWS_REGION=$AWS_DEFAULT_REGION

# Development Environment
DEV_RENDERER_URL=$DEV_URL
DEV_STACK_NAME=plantuml-renderer-dev

# Production Environment
PROD_RENDERER_URL=$PROD_URL
PROD_STACK_NAME=plantuml-renderer-prod

# Forge Configuration
FORGE_EMAIL=$FORGE_EMAIL
# FORGE_API_TOKEN is not stored for security

# Local Development
LOCAL_RENDERER_URL=http://localhost:3001
EOF
    
    log_success "Environment file created: .env.local"
}

# Print setup summary
print_summary() {
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "📋 Environment Summary:"
    echo "  AWS Region: $AWS_DEFAULT_REGION"
    echo "  Development URL: $DEV_URL"
    echo "  Production URL: $PROD_URL"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Install Forge app in Confluence:"
    echo "     cd apps/forge-plantuml"
    echo "     forge install --product confluence --environment development"
    echo ""
    echo "  2. Test PlantUML macro in Confluence:"
    echo "     - Create/edit a page"
    echo "     - Add PlantUML macro"
    echo "     - Test with sample diagram"
    echo ""
    echo "  3. Local development:"
    echo "     ./scripts/dev.sh"
    echo ""
    echo "  4. Deploy changes:"
    echo "     ./scripts/deploy-dev.sh    # Development"
    echo "     ./scripts/deploy-prod.sh   # Production"
    echo ""
    echo "📚 Documentation:"
    echo "  - Setup Guide: SETUP.md"
    echo "  - Development: DEVELOPMENT.md"
    echo "  - Security: SECURITY.md"
    echo ""
    log_success "Setup completed successfully!"
}

# Main setup flow
main() {
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "apps/forge-plantuml" ]; then
        log_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Run setup steps
    check_prerequisites
    get_configuration
    install_dependencies
    create_jwt_secrets
    deploy_aws_services
    deploy_forge_app
    run_health_checks
    create_env_file
    print_summary
}

# Handle script interruption
trap 'log_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"