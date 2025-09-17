#!/bin/bash
set -e

# PlantUML Confluence App Full Deployment Script
# Usage: ./deploy.sh [dev|prod] [development|production]

AWS_ENV=${1:-dev}
FORGE_ENV=${2:-development}

if [[ "$AWS_ENV" != "dev" && "$AWS_ENV" != "prod" ]]; then
    echo "❌ Error: AWS environment must be 'dev' or 'prod'"
    echo "Usage: ./deploy.sh [dev|prod] [development|production]"
    exit 1
fi

if [[ "$FORGE_ENV" != "development" && "$FORGE_ENV" != "production" ]]; then
    echo "❌ Error: Forge environment must be 'development' or 'production'"
    echo "Usage: ./deploy.sh [dev|prod] [development|production]"
    exit 1
fi

echo "🚀 Deploying PlantUML Confluence App"
echo "  AWS Environment: $AWS_ENV"
echo "  Forge Environment: $FORGE_ENV"

# Deploy Lambda renderer
echo "📦 Building and deploying AWS renderer..."
cd services/renderer
sam build
sam deploy --config-env "$AWS_ENV" --profile plant-uml --region eu-north-1
cd ../..

# Deploy Forge app
echo "🔨 Deploying Forge app..."

# Load configuration
CONFIG_FILE="apps/forge-plantuml/config/$FORGE_ENV.json"
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "❌ Error: Configuration file $CONFIG_FILE not found"
    exit 1
fi

RENDERER_URL=$(cat "$CONFIG_FILE" | grep -o '"rendererUrl": "[^"]*"' | cut -d'"' -f4)
JWT_SECRET_PARAM=$(cat "$CONFIG_FILE" | grep -o '"jwtSecretParameter": "[^"]*"' | cut -d'"' -f4)

echo "📋 Forge Configuration:"
echo "  Environment: $FORGE_ENV"
echo "  Renderer URL: $RENDERER_URL"
echo "  JWT Secret Parameter: $JWT_SECRET_PARAM"

# Get JWT secret from AWS SSM (secrets are in eu-central-1)
echo "🔐 Retrieving JWT secret from AWS SSM..."
JWT_SECRET=$(aws ssm get-parameter --profile plant-uml --region eu-central-1 --name "$JWT_SECRET_PARAM" --with-decryption --query 'Parameter.Value' --output text)

if [[ -z "$JWT_SECRET" ]]; then
    echo "❌ Error: Failed to retrieve JWT secret from AWS SSM"
    exit 1
fi

# Navigate to Forge app directory
cd apps/forge-plantuml

# Set Forge environment variables
echo "🔧 Setting Forge environment variables..."
forge variables set RENDERER_URL "$RENDERER_URL" --environment "$FORGE_ENV"
forge variables set RENDERER_JWT_SECRET "$JWT_SECRET" --environment "$FORGE_ENV"

# Deploy to Forge
echo "🚀 Deploying to Forge $FORGE_ENV environment..."
forge deploy --environment "$FORGE_ENV"

cd ../..

echo "✅ Full deployment complete!"
echo ""
echo "📋 Summary:"
echo "  AWS Stack: plantuml-renderer-$AWS_ENV"
echo "  Forge Environment: $FORGE_ENV"
echo ""
echo "💡 Next steps:"
echo "  1. Test health endpoints:"
if [[ "$AWS_ENV" == "dev" ]]; then
    echo "     curl https://q2cro7gz51.execute-api.eu-north-1.amazonaws.com/dev/health"
else
    echo "     curl https://gezrf8c2xa.execute-api.eu-north-1.amazonaws.com/prod/health"
fi
echo "  2. Install Forge app in Confluence if needed"
echo "  3. Test PlantUML macro functionality"